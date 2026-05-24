import csv
import io
import string
import random
from datetime import datetime, timedelta
from rest_framework import viewsets, generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from django.conf import settings

from ..tasks import send_async_email
from ..models import CustomUser, Donor, PaymentTransaction, TenantSupportTicket, TicketReply
from ..serializers import (
    DonorSerializer, OrganizationSerializer, CustomUserSerializer, 
    PaymentTransactionSerializer, TenantSupportTicketSerializer
)

class TenantDonorViewSet(viewsets.ModelViewSet):
    serializer_class = DonorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return Donor.objects.none()
            
        return Donor.objects.select_related(
            'country', 'state', 'district'
        ).filter(organization=user.organization).order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

class TenantDonorBulkUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    @transaction.atomic
    def post(self, request):
        user = request.user
        if not user.organization:
            return Response({"error": "No organization linked."}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES.get('file')
        if not file or not file.name.endswith('.csv'):
            return Response({"error": "Valid .csv file is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        def parse_flexible_date(date_str):
            if not date_str or not date_str.strip(): return None
            # Tries standard, US, and EU date formats
            for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d'):
                try:
                    return datetime.strptime(date_str.strip(), fmt).date()
                except ValueError:
                    continue
            raise ValueError(f"Invalid date format: {date_str}")

        org = user.organization
        try:
            decoded_file = io.TextIOWrapper(file, encoding='utf-8', errors='replace')
            reader = csv.DictReader(decoded_file)
            
            expected_headers = {'full_name', 'phone_number', 'blood_group', 'date_of_birth'}
            if not reader.fieldnames or not expected_headers.issubset(set(reader.fieldnames)):
                return Response({"error": "Invalid CSV headers."}, status=status.HTTP_400_BAD_REQUEST)

            donors_to_create = []
            errors = []
            
            for idx, row in enumerate(reader, start=2): 
                try:
                    parsed_dob = parse_flexible_date(row.get('date_of_birth'))
                    if not parsed_dob:
                        raise ValueError("Date of birth is required.")
                        
                    parsed_last_donation = parse_flexible_date(row.get('last_donation_date'))

                    donor = Donor(
                        organization=org,
                        country=org.country, state=org.state, district=org.district,
                        full_name=row.get('full_name').strip(),
                        phone_number=row.get('phone_number').strip(),
                        date_of_birth=parsed_dob,
                        gender=row.get('gender', 'O').strip().upper()[:1],
                        blood_group=row.get('blood_group').strip().upper(),
                        last_donation_date=parsed_last_donation
                    )
                    donors_to_create.append(donor)
                except Exception as e:
                    errors.append(f"Row {idx} skipped: {str(e)}")

            if donors_to_create:
                Donor.objects.bulk_create(donors_to_create, ignore_conflicts=True)
                
            return Response({"message": f"Successfully imported {len(donors_to_create)} donors.", "errors": errors}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TenantDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            
            if not hasattr(user, 'organization') or not user.organization:
                return Response({"error": "No organization linked."}, status=status.HTTP_400_BAD_REQUEST)
                
            donors = Donor.objects.filter(organization=user.organization)
            today = timezone.now().date()
            thirty_days_ago = today - timedelta(days=30)
            
            # 1. Total Donors
            total_donors = donors.count()
            
            # 2. Available Donors
            male_threshold = today - timedelta(days=90)
            female_threshold = today - timedelta(days=120)

            available_donors = donors.filter(
                is_permanently_deferred=False
            ).filter(
                Q(last_donation_date__isnull=True) |
                Q(gender='M', last_donation_date__lte=male_threshold) |
                Q(gender='F', last_donation_date__lte=female_threshold) |
                Q(gender='O', last_donation_date__lte=female_threshold)
            ).count()
                    
            # 3. Donations this month
            recent_donations = donors.filter(last_donation_date__gte=thirty_days_ago).count()
            
            # 4. Blood Group Distribution
            bg_counts = donors.values('blood_group').annotate(count=Count('blood_group')).order_by('-count')
            blood_distribution = [
                {
                    "group": i.get('blood_group') or "Unknown", 
                    "count": i.get('count', 0)
                } for i in bg_counts
            ]
            
            # 5. Recent Activity
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
                    "pendingRequests": 0
                },
                "bloodGroupDistribution": blood_distribution,
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
        if not self.request.user.organization:
            raise PermissionDenied("You are not associated with any organization.")
        return self.request.user.organization

class TenantStaffViewSet(viewsets.ModelViewSet):
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return CustomUser.objects.none()
        return CustomUser.objects.select_related('organization').filter(
            organization=user.organization
        ).order_by('-date_joined')

    def create(self, request, *args, **kwargs):
        if request.user.role != 'ORG_ADMIN':
            return Response({"error": "Only Organization Admins can add staff."}, status=status.HTTP_403_FORBIDDEN)

        email = request.data.get('email')
        if CustomUser.objects.filter(email=email).exists():
            return Response({"error": "User exists."}, status=status.HTTP_400_BAD_REQUEST)

        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        org = request.user.organization
        
        user = CustomUser.objects.create_user(
            username=email, email=email, password=temp_password,
            first_name=request.data.get('name', ''), role=request.data.get('role', 'ORG_STAFF'), organization=org
        )

        send_async_email.delay(
            subject=f"Join {org.name} on BloodConnect",
            plain_message=f"Temp pass: {temp_password}",
            recipient_list=[email],
            html_message=f"<p>Temp pass: {temp_password}</p>"
        )

        return Response(self.get_serializer(user).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'ORG_ADMIN':
            return Response({"error": "Only Admins can remove staff."}, status=status.HTTP_403_FORBIDDEN)
        if self.get_object().id == request.user.id:
            return Response({"error": "Cannot remove yourself."}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

class TenantPaymentView(generics.ListCreateAPIView):
    serializer_class = PaymentTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.organization:
            return PaymentTransaction.objects.none()
        return PaymentTransaction.objects.select_related(
            'organization', 'submitted_by'
        ).filter(organization=self.request.user.organization).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'ORG_ADMIN':
            raise PermissionDenied("Only Admins can submit payments.")
        serializer.save(organization=self.request.user.organization, submitted_by=self.request.user, amount=999.00)

class TenantSupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.organization:
            return TenantSupportTicket.objects.none()
        return TenantSupportTicket.objects.select_related(
            'organization', 'created_by'
        ).prefetch_related(
            'replies__sender'
        ).filter(organization=self.request.user.organization).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        if not request.data.get('message'):
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        TicketReply.objects.create(ticket=ticket, sender=request.user, message=request.data.get('message'))
        if ticket.status == 'RESOLVED':
            ticket.status = 'OPEN'
            ticket.save()
        return Response({"message": "Reply sent successfully."})