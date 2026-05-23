from datetime import timedelta
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser

from ..tasks import send_async_email
from ..models import (
    Organization, Donor, Advertisement, PaymentTransaction, 
    SystemLog, TenantSupportTicket, TicketReply, ContactMessage
)
from ..serializers import (
    OrganizationSerializer, DonorSerializer, AdvertisementSerializer, 
    PaymentTransactionSerializer, SystemLogSerializer, 
    TenantSupportTicketSerializer, ContactMessageSerializer
)
from .public_views import StandardResultsSetPagination


class IsSuperAdmin(permissions.BasePermission):
    """
    Custom permission to allow users with the 'SUPER_ADMIN' role 
    OR native Django superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'SUPER_ADMIN' or request.user.is_superuser)
        )


class SuperAdminOrganizationListView(generics.ListAPIView):
    """Returns a list of all registered organizations."""
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperAdmin]
    queryset = Organization.objects.select_related(
        'country', 'state', 'district'
    ).order_by('-created_at')


class SuperAdminOrganizationStatusUpdateView(APIView):
    """Allows a Super Admin to Approve (ACTIVE) or Suspend an organization."""
    permission_classes = [IsSuperAdmin]

    def patch(self, request, pk):
        try:
            organization = Organization.objects.get(pk=pk)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in dict(Organization.STATUS_CHOICES).keys():
            return Response({"error": "Invalid status provided."}, status=status.HTTP_400_BAD_REQUEST)

        old_status = organization.status
        organization.status = new_status
        organization.save()

        if old_status != 'ACTIVE' and new_status == 'ACTIVE':
            self.send_approval_email(organization)

        return Response({
            "message": f"Organization status updated to {new_status}",
            "status": new_status
        }, status=status.HTTP_200_OK)

    def send_approval_email(self, organization):
        subject = "Welcome to BloodConnect! Your Dashboard is Ready 🩸"
        plain_message = f"Welcome to BloodConnect, {organization.name}! Your account has been approved. Log in at http://localhost:5173/login"
        
        html_message = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 40px;">🩸</span>
            </div>
            <h2 style="color: #0f172a; text-align: center; margin-bottom: 20px;">Welcome to BloodConnect, <br/> <span style="color: #e11d48;">{organization.name}</span>!</h2>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Great news! Your organization's registration has been officially <strong>approved</strong> by our administrative team.
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                You can now log into your Tenant Dashboard to start importing your existing donor registry, inviting your hospital staff, and saving lives in your local community.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="http://localhost:5173/login" style="background-color: #e11d48; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Access Your Dashboard
                </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 13px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                If you have any questions, simply reply to this email or visit our Contact Us page.<br/>
                &copy; 2026 BloodConnect Platform
            </p>
        </div>
        """
        
        send_async_email.delay(
            subject=subject,
            plain_message=plain_message,
            recipient_list=[organization.contact_email],
            html_message=html_message
        )


class SuperAdminDashboardStatsView(APIView):
    """Returns platform-wide statistics for the Super Admin dashboard."""
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        pending_orgs_qs = Organization.objects.select_related('district', 'state').filter(
            status='PENDING'
        ).order_by('-created_at')[:5]

        pending_orgs_data = [
            {
                "id": o.id, 
                "name": o.name, 
                "location": f"{o.district.name if o.district else 'Unknown'}", 
                "date": o.created_at.strftime("%b %d, %Y"), 
                "type": o.get_org_type_display()
            } 
            for o in pending_orgs_qs
        ]

        return Response({
            "globalStats": {
                "totalOrganizations": Organization.objects.count(),
                "pendingApprovals": Organization.objects.filter(status='PENDING').count(),
                "globalDonors": Donor.objects.count(),
                "activeSubscriptions": Organization.objects.filter(status='ACTIVE').count()
            },
            "pendingOrgs": pending_orgs_data,
            # If your SystemLog model utilizes relationships, values() safely joins them at the DB level!
            "systemLogs": SystemLog.objects.all().order_by('-timestamp')[:5].values(
                'id', 'level', 'message', 'timestamp'
            )
        }, status=status.HTTP_200_OK)


class SuperAdminSystemLogListView(generics.ListAPIView):
    """Returns system logs for the Super Admin audit trail with pagination."""
    permission_classes = [IsSuperAdmin]
    serializer_class = SystemLogSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return SystemLog.objects.all().order_by('-timestamp')


class SuperAdminAdvertisementViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for Super Admins to manage system-wide advertisements."""
    queryset = Advertisement.objects.all().order_by('-created_at')
    serializer_class = AdvertisementSerializer
    permission_classes = [IsSuperAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        duration_months = int(request.data.get('duration_months', 1))
        expires_at = timezone.now() + timedelta(days=30 * duration_months)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(expires_at=expires_at)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        ad = self.get_object()
        months = int(request.data.get('months', 1))
        
        if ad.is_expired: 
            ad.expires_at = timezone.now() + timedelta(days=30 * months)
        else: 
            ad.expires_at += timedelta(days=30 * months)
            
        ad.save()
        return Response({'message': 'Ad extended', 'expires_at': ad.expires_at})

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        ad = self.get_object()
        ad.is_active = not ad.is_active
        ad.save()
        return Response({'message': 'Status updated', 'is_active': ad.is_active})


class SuperAdminContactMessageViewSet(viewsets.ModelViewSet):
    """CRUD endpoints for Super Admins to manage and reply to public contact messages."""
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    permission_classes = [IsSuperAdmin]

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        message = self.get_object()
        reply_text = request.data.get('reply_text')
        
        if not reply_text:
            return Response({"error": "Reply text is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        subject = f"Re: {message.subject} - BloodConnect Support"
        plain_message = f"Hello {message.name},\n\n{reply_text}\n\nBest regards,\nThe BloodConnect Team"
        
        html_message = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #0f172a; margin-bottom: 20px;">BloodConnect Support</h3>
            <p style="color: #475569; font-size: 15px; line-height: 1.6;">Hello {message.name},</p>
            <div style="color: #475569; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">{reply_text}</div>
            <br/>
            <p style="color: #475569; font-size: 15px;">Best regards,<br/><strong>The BloodConnect Team</strong></p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; font-style: italic;">
                In response to your message:<br/>
                "{message.message}"
            </p>
        </div>
        """
        
        send_async_email.delay(
            subject=subject,
            plain_message=plain_message,
            recipient_list=[message.email],
            html_message=html_message
        )
        
        message.is_resolved = True
        message.save()
        return Response({"message": "Reply sent successfully and ticket resolved."})

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        message = self.get_object()
        message.is_resolved = not message.is_resolved
        message.save()
        return Response({'message': 'Status updated', 'is_resolved': message.is_resolved})


class SuperAdminArchivedDonorViewSet(viewsets.ModelViewSet):
    """Endpoints for Super Admins to view, restore, or permanently delete archived donors."""
    serializer_class = DonorSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        return Donor.all_objects.select_related(
            'organization', 'country', 'state', 'district'
        ).filter(is_deleted=True).order_by('-deleted_at')

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        donor = self.get_object()
        donor.is_deleted = False
        donor.deleted_at = None
        donor.save()
        return Response({"message": f"{donor.full_name} has been restored successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'])
    def hard_delete_record(self, request, pk=None):
        donor = self.get_object()
        donor.hard_delete()
        return Response({"message": "Donor record permanently erased."}, status=status.HTTP_200_OK)


class SuperAdminPaymentViewSet(viewsets.ModelViewSet):
    """Super Admin endpoints to view and approve/reject UPI transactions."""
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsSuperAdmin]
    queryset = PaymentTransaction.objects.select_related(
        'organization', 'submitted_by'
    ).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        payment = self.get_object()
        action_type = request.data.get('action')
        
        if payment.status != 'PENDING': 
            return Response({"error": "Payment is already processed"}, status=status.HTTP_400_BAD_REQUEST)

        payment.verified_at = timezone.now()
        
        if action_type == 'APPROVE':
            payment.status = 'APPROVED'
            org = payment.organization
            org.is_paid = True
            
            # Extend Organization Subscription by 1 Year securely
            if org.subscription_expires_at and org.subscription_expires_at > timezone.now():
                org.subscription_expires_at += timedelta(days=365)
            else:
                org.subscription_expires_at = timezone.now() + timedelta(days=365)
                
            org.save()
            payment.save()
            return Response({"message": "Payment approved and subscription extended."})
            
        elif action_type == 'REJECT':
            payment.status = 'REJECTED'
            payment.save()
            return Response({"message": "Payment rejected."})
            
        return Response({"error": "Invalid action parameter."}, status=status.HTTP_400_BAD_REQUEST)


class SuperAdminExtendSubscriptionView(APIView):
    """Allows Super Admins to manually gift/extend a subscription by X years."""
    permission_classes = [IsSuperAdmin]
    
    def post(self, request, pk):
        org = get_object_or_404(Organization, pk=pk)
        years = int(request.data.get('years', 1))
        
        org.is_paid = True
        if org.subscription_expires_at and org.subscription_expires_at > timezone.now():
            org.subscription_expires_at += timedelta(days=365 * years)
        else:
            org.subscription_expires_at = timezone.now() + timedelta(days=365 * years)
            
        org.save()
        return Response({"message": f"Extended successfully by {years} year(s)."})


class SuperAdminSupportTicketViewSet(viewsets.ModelViewSet):
    """Super Admin endpoints to manage and reply to Tenant Support Tickets."""
    serializer_class = TenantSupportTicketSerializer
    permission_classes = [IsSuperAdmin]
    queryset = TenantSupportTicket.objects.select_related(
        'organization', 'created_by'
    ).prefetch_related('replies__sender').order_by('-created_at')

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        message = request.data.get('message')
        
        if message: 
            TicketReply.objects.create(ticket=ticket, sender=request.user, message=message)
            
        ticket.status = request.data.get('status', 'IN_PROGRESS')
        ticket.save()
        return Response({"message": "Ticket updated successfully."})