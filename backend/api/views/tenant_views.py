import csv
import io
import calendar # <-- Added for month names
from datetime import datetime, timedelta
from django.http import HttpResponse
from rest_framework import viewsets, generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from django.db import transaction
from django.db.models import Count, Q, Prefetch, Max
from django.db.models.functions import TruncMonth # <-- Added for 6-month aggregation
from django.utils import timezone
from django.shortcuts import get_object_or_404

from ..tasks import send_async_email
from ..models import CustomUser, DonationRecord, Donor, PaymentTransaction, TenantSupportTicket, TicketReply
from ..serializers import (
    DonorSerializer, OrganizationSerializer, CustomUserSerializer, 
    PaymentTransactionSerializer, TenantSupportTicketSerializer
)

class TenantDonorViewSet(viewsets.ModelViewSet):
    serializer_class = DonorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        if user.role != 'ORG_ADMIN' or not getattr(user, 'organization', None):
            return Donor.objects.none() 
            
        return Donor.objects.get_for_tenant(
            user.organization
        ).select_related(
            'country', 'state', 'district'
        ).with_availability_context().order_by('-created_at')
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'ORG_ADMIN' and getattr(user, 'organization', None):
            serializer.save(organization=user.organization)

    @action(detail=False, methods=['get'], url_path='export')
    def export_csv(self, request):
        user = request.user
        if user.role != 'ORG_ADMIN' or not getattr(user, 'organization', None):
            return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

        donors = Donor.objects.get_for_tenant(
            user.organization
        ).with_availability_context()

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="donor_registry_{timezone.now().strftime("%Y%m%d")}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Full Name', 'Phone Number', 'Blood Group', 'Gender', 'Date of Birth', 'Status', 'Last Donation'])

        for donor in donors:
            status_text = "Deferred" if donor.is_permanently_deferred else ("Available" if donor.is_available_now else "Resting")
            last_don = donor.last_donation_date.strftime("%Y-%m-%d") if getattr(donor, 'last_donation_date', None) else "None"
            
            writer.writerow([
                donor.full_name,
                donor.phone_number,
                donor.blood_group,
                donor.get_gender_display(),
                donor.date_of_birth.strftime("%Y-%m-%d") if donor.date_of_birth else "",
                status_text,
                last_don
            ])

        return response


class TenantDonorBulkUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    @transaction.atomic
    def post(self, request):
        user = request.user
        
        if user.role != 'ORG_ADMIN' or not getattr(user, 'organization', None):
            return Response({"error": "Unauthorized. Tenant administrators only."}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('file')
        if not file or not file.name.endswith('.csv'):
            return Response({"error": "A valid .csv file is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        def parse_flexible_date(date_str):
            if not date_str or not str(date_str).strip(): 
                return None
            for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d'):
                try:
                    return datetime.strptime(str(date_str).strip(), fmt).date()
                except ValueError:
                    continue
            raise ValueError(f"Invalid date format: {date_str}")

        org = request.user.organization
        valid_blood_groups = {"A+", "A-", "A1+", "A1-", "A1B+", "A1B-", "A2+", "A2-", "A2B+", "A2B-", "AB+", "AB-", "B+", "B-", "BBG", "INRA", "O+", "O-"}
        
        try:
            decoded_file = io.TextIOWrapper(file, encoding='utf-8-sig', errors='replace')
            reader = csv.DictReader(decoded_file)
            
            expected_headers = {'full_name', 'phone_number', 'blood_group', 'date_of_birth'}
            if not reader.fieldnames or not expected_headers.issubset(set(reader.fieldnames)):
                return Response({
                    "error": f"Invalid CSV headers. Expected at least: {', '.join(expected_headers)}"
                }, status=status.HTTP_400_BAD_REQUEST)

            existing_phones = set(Donor.objects.filter(organization=org).values_list('phone_number', flat=True))
            seen_phones_in_csv = set()
            
            donors_to_create = []
            donations_to_create = []
            errors = []
            
            for idx, row in enumerate(reader, start=2): 
                try:
                    full_name = str(row.get('full_name', '')).strip()
                    phone_number = str(row.get('phone_number', '')).strip()
                    blood_group = str(row.get('blood_group', '')).strip().upper()
                    gender = str(row.get('gender', 'O')).strip().upper()[:1]
                    
                    if not full_name or not phone_number or not blood_group:
                        raise ValueError("Missing required text fields (name, phone, or blood group).")
                    if blood_group not in valid_blood_groups:
                        raise ValueError(f"Unrecognized blood group: '{blood_group}'")
                        
                    if phone_number in existing_phones:
                        raise ValueError(f"Donor with phone '{phone_number}' already exists in your directory.")
                    if phone_number in seen_phones_in_csv:
                        raise ValueError(f"Duplicate phone '{phone_number}' found within this CSV file.")
                    seen_phones_in_csv.add(phone_number)
                        
                    parsed_dob = parse_flexible_date(row.get('date_of_birth'))
                    if not parsed_dob:
                        raise ValueError("Date of birth is required.")
                        
                    parsed_last_donation = parse_flexible_date(row.get('last_donation_date'))

                    donor = Donor(
                        organization=org,
                        country=org.country, 
                        state=org.state, 
                        district=org.district,
                        full_name=full_name,
                        phone_number=phone_number,
                        date_of_birth=parsed_dob,
                        gender=gender if gender in ['M', 'F', 'O'] else 'O',
                        blood_group=blood_group,
                        is_permanently_deferred=False,
                    )
                    donor._temp_last_donation = parsed_last_donation
                    donors_to_create.append(donor)

                except Exception as e:
                    errors.append(f"Row {idx} skipped: {str(e)}")

            if donors_to_create:
                Donor.objects.bulk_create(donors_to_create, ignore_conflicts=True)
                
                saved_donors = Donor.objects.filter(
                    organization=org, 
                    phone_number__in=[d.phone_number for d in donors_to_create]
                )
                
                phone_to_donor_map = {d.phone_number: d for d in saved_donors}
                for temp_donor in donors_to_create:
                    if getattr(temp_donor, '_temp_last_donation', None):
                        actual_donor = phone_to_donor_map.get(temp_donor.phone_number)
                        if actual_donor:
                            donations_to_create.append(DonationRecord(
                                donor=actual_donor,
                                organization=org,
                                donation_type='WHOLE_BLOOD',
                                donation_date=temp_donor._temp_last_donation,
                                clinical_notes="Imported via bulk CSV upload."
                            ))
                            
                if donations_to_create:
                    DonationRecord.objects.bulk_create(donations_to_create, ignore_conflicts=True)
                
            return Response({
                "message": f"Successfully imported {len(donors_to_create)} donors.", 
                "errors": errors 
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to process file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class TenantDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            
            if user.role != 'ORG_ADMIN':
                return Response(
                    {"error": "Unauthorized access. Tenant administrators only."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not hasattr(user, 'organization') or not user.organization:
                return Response({"error": "No organization linked."}, status=status.HTTP_400_BAD_REQUEST)
                
            donors = Donor.objects.filter(organization=user.organization).annotate(
                annotated_last_donation=Max('donation_records__donation_date')
            )
            
            today = timezone.now().date()
            thirty_days_ago = today - timedelta(days=30)
            seven_days_from_now = today + timedelta(days=7)
            
            male_threshold_now = today - timedelta(days=90)
            female_threshold_now = today - timedelta(days=120)
            male_threshold_future = seven_days_from_now - timedelta(days=90)
            female_threshold_future = seven_days_from_now - timedelta(days=120)

            # 1. Total Donors
            total_donors = donors.count()
            
            # 2. Available Donors
            available_donors = donors.filter(
                is_permanently_deferred=False
            ).filter(
                Q(annotated_last_donation__isnull=True) |
                Q(gender='M', annotated_last_donation__lte=male_threshold_now) |
                Q(gender='F', annotated_last_donation__lte=female_threshold_now) |
                Q(gender='O', annotated_last_donation__lte=female_threshold_now)
            ).count()
            
            # 3. Available *THIS WEEK*
            donors_available_this_week = donors.filter(
                is_permanently_deferred=False
            ).filter(
                ~Q(
                    Q(annotated_last_donation__isnull=True) |
                    Q(gender='M', annotated_last_donation__lte=male_threshold_now) |
                    Q(gender='F', annotated_last_donation__lte=female_threshold_now) |
                    Q(gender='O', annotated_last_donation__lte=female_threshold_now)
                )
            ).filter(
                Q(gender='M', annotated_last_donation__lte=male_threshold_future) |
                Q(gender='F', annotated_last_donation__lte=female_threshold_future) |
                Q(gender='O', annotated_last_donation__lte=female_threshold_future)
            ).count()
                    
            # 4. Donations this month
            recent_donations = donors.filter(annotated_last_donation__gte=thirty_days_ago).count()
            
            # 5. Blood Group Distribution
            bg_counts = donors.values('blood_group').annotate(count=Count('blood_group')).order_by('blood_group')
            blood_distribution = [
                {
                    "group": i.get('blood_group') or "Unknown", 
                    "count": i.get('count', 0)
                } for i in bg_counts
            ]

            # --- [NEW] 6. 6-Month Donation Trend ---
            trend_data = []
            for i in range(5, -1, -1):
                m = today.month - i
                y = today.year
                if m <= 0:
                    m += 12
                    y -= 1
                trend_data.append({"month": calendar.month_abbr[m], "count": 0, "year": y, "m_num": m})

            six_months_ago_limit = (today.replace(day=1) - timedelta(days=160)).replace(day=1)

            donations_6m = DonationRecord.objects.filter(
                organization=user.organization,
                donation_date__gte=six_months_ago_limit
            ).annotate(
                month_trunc=TruncMonth('donation_date')
            ).values('month_trunc').annotate(count=Count('id')).order_by('month_trunc')

            # Map the aggregated counts back to our contiguous 6-month timeline
            for d in donations_6m:
                if not d['month_trunc']: continue
                d_month = d['month_trunc'].month
                d_year = d['month_trunc'].year
                for t in trend_data:
                    if t['m_num'] == d_month and t['year'] == d_year:
                        t['count'] = d['count']

            # Clean up timeline data for the frontend
            for t in trend_data:
                del t['year']
                del t['m_num']
            
            # 7. Recent Activity
            recent_activity = []
            for d in donors.order_by('-created_at')[:5]:
                safe_timestamp = d.created_at.isoformat() if getattr(d, 'created_at', None) else timezone.now().isoformat()
                recent_activity.append({
                    "id": f"donor_{d.id}",
                    "action": "DONOR_ADDED",
                    "message": f"Registered new donor: {d.full_name or 'Unknown'} ({d.blood_group or '?'})",
                    "timestamp": safe_timestamp
                })

            return Response({
                "overview": {
                    "totalDonors": total_donors,
                    "availableDonors": available_donors,
                    "donationsThisMonth": recent_donations,
                    "availableThisWeek": donors_available_this_week
                },
                "bloodGroupDistribution": blood_distribution,
                "monthlyDonationTrend": trend_data, # <-- NEW
                "recentActivity": recent_activity
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Server Crash: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TenantOrganizationView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        user = self.request.user
        
        if getattr(user, 'role', '') != 'ORG_ADMIN':
            raise PermissionDenied("Unauthorized. Only Tenant Administrators can access this profile.")
            
        if not getattr(user, 'organization', None):
            raise PermissionDenied("You are not associated with any organization.")
            
        return user.organization

class TenantPaymentView(generics.ListCreateAPIView):
    serializer_class = PaymentTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        if getattr(user, 'role', '') != 'ORG_ADMIN':
            raise PermissionDenied("Only Tenant Administrators can view financial ledgers.")
            
        if not getattr(user, 'organization', None):
            return PaymentTransaction.objects.none()
            
        return PaymentTransaction.objects.select_related(
            'organization', 'submitted_by'
        ).filter(organization=user.organization).order_by('-created_at')

    def perform_create(self, serializer):
        if getattr(self.request.user, 'role', '') != 'ORG_ADMIN':
            raise PermissionDenied("Only Admins can submit payments.")
        serializer.save(organization=self.request.user.organization, submitted_by=self.request.user, amount=999.00)

class TenantSupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        if getattr(user, 'role', '') != 'ORG_ADMIN':
            return TenantSupportTicket.objects.none()
            
        if not getattr(user, 'organization', None):
            return TenantSupportTicket.objects.none()
            
        return TenantSupportTicket.objects.select_related(
            'organization', 'created_by'
        ).prefetch_related(
            'replies__sender'
        ).filter(organization=user.organization).order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if getattr(user, 'role', '') != 'ORG_ADMIN' or not getattr(user, 'organization', None):
            raise PermissionDenied("Only Tenant Administrators can open support tickets.")
            
        serializer.save(organization=user.organization, created_by=user)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        user = request.user
        if getattr(user, 'role', '') != 'ORG_ADMIN':
            return Response({"error": "Unauthorized action."}, status=status.HTTP_403_FORBIDDEN)
            
        ticket = self.get_object()
        if not request.data.get('message'):
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        TicketReply.objects.create(ticket=ticket, sender=user, message=request.data.get('message'))
        
        if ticket.status == 'RESOLVED':
            ticket.status = 'OPEN'
            ticket.save()
            
        return Response({"message": "Reply sent successfully."})

class LogDonationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, donor_id):
        user = request.user
        
        if user.role != 'ORG_ADMIN' or not getattr(user, 'organization', None):
            return Response({"error": "Unauthorized. Tenant administrators only."}, status=status.HTTP_403_FORBIDDEN)

        donor = get_object_or_404(Donor, id=donor_id, organization=user.organization)
        
        donation_type = request.data.get('donation_type', 'WHOLE_BLOOD')
        donation_date = request.data.get('donation_date')
        notes = request.data.get('clinical_notes', '')

        if not donation_date:
            return Response({"error": "Donation date is required."}, status=status.HTTP_400_BAD_REQUEST)

        DonationRecord.objects.create(
            donor=donor,
            organization=user.organization,
            donation_type=donation_type,
            donation_date=donation_date,
            clinical_notes=notes
        )

        return Response({"message": "Donation recorded successfully. Cooldown period recalculated."}, status=status.HTTP_201_CREATED)