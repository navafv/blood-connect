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
from django.db.models import Count
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
                    parsed_dob = datetime.strptime(row.get('date_of_birth').strip(), '%Y-%m-%d').date()
                    parsed_last_donation = None
                    last_donation_str = row.get('last_donation_date')
                    if last_donation_str and last_donation_str.strip():
                        parsed_last_donation = datetime.strptime(last_donation_str.strip(), '%Y-%m-%d').date()

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
        user = request.user
        if not user.organization:
            return Response({"error": "No organization linked."}, status=status.HTTP_400_BAD_REQUEST)
            
        donors = Donor.objects.filter(organization=user.organization)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        
        return Response({
            "overview": {
                "totalDonors": donors.count(),
                "availableDonors": sum(1 for d in donors if d.is_available_now),
                "donationsThisMonth": donors.filter(last_donation_date__gte=thirty_days_ago).count(),
                "pendingRequests": 0
            },
            "bloodGroupDistribution": [{"group": i['blood_group'], "count": i['count']} for i in donors.values('blood_group').annotate(count=Count('blood_group')).order_by('-count')],
            "recentActivity": [{"id": f"donor_{d.id}", "action": "DONOR_ADDED", "message": f"Registered new donor: {d.full_name} ({d.blood_group})", "timestamp": d.created_at.isoformat()} for d in donors.order_by('-created_at')[:5]]
        }, status=status.HTTP_200_OK)

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