from datetime import timedelta
from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.utils import timezone
from django.utils.timezone import localtime
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from rest_framework import viewsets, generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from ..tasks import send_async_email
from ..models import (
    MasterCountry, MasterDistrict, MasterState, Organization, Donor, Advertisement, PaymentTransaction, 
    SystemLog, TenantSupportTicket, TicketReply, ContactMessage
)
from ..serializers import (
    MasterCountrySerializer, MasterDistrictSerializer, MasterStateSerializer, OrganizationSerializer, DonorSerializer, AdvertisementSerializer, 
    PaymentTransactionSerializer, SystemLogSerializer, 
    TenantSupportTicketSerializer, ContactMessageSerializer
)
from .public_views import StandardResultsSetPagination


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'SUPER_ADMIN' or request.user.is_superuser)
        )

class ProtectedDestroyMixin:
    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot delete this location because it is actively used by organizations or donors."},
                status=status.HTTP_400_BAD_REQUEST
            )
    
class SuperAdminCountryViewSet(ProtectedDestroyMixin, viewsets.ModelViewSet):
    serializer_class = MasterCountrySerializer
    permission_classes = [IsSuperAdmin]
    queryset = MasterCountry.objects.all()

class SuperAdminStateViewSet(ProtectedDestroyMixin, viewsets.ModelViewSet):
    serializer_class = MasterStateSerializer
    permission_classes = [IsSuperAdmin]
    queryset = MasterState.objects.all()

class SuperAdminDistrictViewSet(ProtectedDestroyMixin, viewsets.ModelViewSet):
    serializer_class = MasterDistrictSerializer
    permission_classes = [IsSuperAdmin]
    queryset = MasterDistrict.objects.all()

class SuperAdminOrganizationListView(generics.ListAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperAdmin]
    queryset = Organization.objects.select_related(
        'country', 'state', 'district'
    ).order_by('-created_at')

class SuperAdminOrganizationStatusUpdateView(APIView):
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

        # Send email if newly activated
        if old_status != 'ACTIVE' and new_status == 'ACTIVE':
            self.send_approval_email(organization)

        return Response({
            "message": f"Organization status updated to {new_status}",
            "status": new_status
        }, status=status.HTTP_200_OK)

    def send_approval_email(self, organization):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        login_link = f"{frontend_url}/login"
        
        subject = "Welcome to BloodConnect! Your Dashboard is Ready 🩸"
        plain_message = f"Welcome to BloodConnect, {organization.name}! Your account has been approved. Log in at {login_link}"
        
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
                <a href="{login_link}" style="background-color: #e11d48; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Access Your Dashboard
                </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 13px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                If you have any questions, simply reply to this email or visit our Contact Us page.<br/>
                &copy; {localtime().year} BloodConnect Platform
            </p>
        </div>
        """
        
        send_async_email(
            subject=subject,
            plain_message=plain_message,
            recipient_list=[organization.contact_email],
            html_message=html_message
        )

class SuperAdminDashboardStatsView(APIView):
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
        
        logs_qs = SystemLog.objects.all().order_by('-timestamp')[:5]
        system_logs_data = [
            {
                "id": log.id,
                "type": getattr(log, 'level', 'system').lower(),
                "message": log.message,
                "time": localtime(log.timestamp).strftime("%I:%M %p")
            }
            for log in logs_qs
        ]

        return Response({
            "globalStats": {
                "totalOrganizations": Organization.objects.exclude(status='SUSPENDED').count(),
                "pendingApprovals": Organization.objects.filter(status='PENDING').count(),
                "globalDonors": Donor.objects.count(),
                "activeSubscriptions": Organization.objects.filter(status='ACTIVE').count()
            },
            "pendingOrgs": pending_orgs_data,
            "systemLogs": system_logs_data
        }, status=status.HTTP_200_OK)

class SuperAdminSystemLogListView(generics.ListAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = SystemLogSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = SystemLog.objects.all().order_by('-timestamp')
        
        # 1. Extract query parameters from the frontend request
        search = self.request.query_params.get('search', None)
        level = self.request.query_params.get('level', None)
        
        # 2. Apply Severity Filter
        if level and level != 'ALL':
            queryset = queryset.filter(level=level)
            
        # 3. Apply Text Search (Source OR Message)
        if search:
            queryset = queryset.filter(
                Q(source__icontains=search) | 
                Q(message__icontains=search)
            )
            
        return queryset

class SuperAdminAdvertisementViewSet(viewsets.ModelViewSet):
    queryset = Advertisement.objects.all().order_by('-created_at')
    serializer_class = AdvertisementSerializer
    permission_classes = [IsSuperAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        try:
            duration_months = int(request.data.get('duration_months', 1))
        except ValueError:
            return Response({"error": "Duration must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)
            
        expires_at = timezone.now() + timedelta(days=30 * duration_months)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(expires_at=expires_at)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        ad = self.get_object()
        
        try:
            months = int(request.data.get('months', 1))
        except ValueError:
            return Response({"error": "Months must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)
        
        if ad.is_expired: 
            ad.expires_at = timezone.now() + timedelta(days=30 * months)
        else: 
            ad.expires_at += timedelta(days=30 * months)
            
        ad.save()
        return Response({'message': 'Ad extended', 'expires_at': ad.expires_at}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        ad = self.get_object()
        ad.is_active = not ad.is_active
        ad.save()
        return Response({'message': 'Status updated', 'is_active': ad.is_active}, status=status.HTTP_200_OK)

class SuperAdminContactMessageViewSet(viewsets.ModelViewSet):
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
        
        try:
            send_async_email(
                subject=subject,
                plain_message=plain_message,
                recipient_list=[message.email],
                html_message=html_message
            )
        except Exception as e:
            return Response({"error": "Message saved, but the email failed to send. Check SMTP settings."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        message.is_resolved = True
        message.save()
        return Response({"message": "Reply sent successfully and ticket resolved."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        message = self.get_object()
        message.is_resolved = not message.is_resolved
        message.save()
        return Response({'message': 'Status updated', 'is_resolved': message.is_resolved}, status=status.HTTP_200_OK)

class SuperAdminArchivedDonorViewSet(viewsets.ModelViewSet):
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
            return Response({"message": "Payment approved and subscription extended."}, status=status.HTTP_200_OK)
            
        elif action_type == 'REJECT':
            payment.status = 'REJECTED'
            payment.save()
            return Response({"message": "Payment rejected."}, status=status.HTTP_200_OK)
            
        return Response({"error": "Invalid action parameter."}, status=status.HTTP_400_BAD_REQUEST)

class SuperAdminExtendSubscriptionView(APIView):
    permission_classes = [IsSuperAdmin]
    
    def post(self, request, pk):
        org = get_object_or_404(Organization, pk=pk)
        
        try:
            years = int(request.data.get('years', 1))
        except ValueError:
            return Response({"error": "Invalid year format."}, status=status.HTTP_400_BAD_REQUEST)
        
        org.is_paid = True
        if org.subscription_expires_at and org.subscription_expires_at > timezone.now():
            org.subscription_expires_at += timedelta(days=365 * years)
        else:
            org.subscription_expires_at = timezone.now() + timedelta(days=365 * years)
            
        org.save()
        return Response({"message": f"Extended successfully by {years} year(s)."}, status=status.HTTP_200_OK)

class SuperAdminSupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSupportTicketSerializer
    permission_classes = [IsSuperAdmin]
    queryset = TenantSupportTicket.objects.select_related(
        'organization', 'created_by'
    ).prefetch_related('replies__sender').order_by('-created_at')

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        message = request.data.get('message')
        new_status = request.data.get('status', 'IN_PROGRESS')
        
        if message: 
            TicketReply.objects.create(ticket=ticket, sender=request.user, message=message)
            
        ticket.status = new_status
        ticket.save()

        # --- TENANT NOTIFICATION PROTOCOL ---
        if message or new_status == 'RESOLVED':
            subject = f"Update on Support Ticket: TCKT-{str(ticket.id).zfill(4)}"
            
            # Simple plain text fallback
            plain_message = f"Hello {ticket.created_by.first_name or 'Admin'},\n\nYour support ticket '{ticket.subject}' has been updated.\n\nStatus: {ticket.get_status_display()}"
            if message:
                plain_message += f"\n\nSupport Team: {message}"
                
            # Modern HTML Template
            status_color = "#10b981" if new_status == 'RESOLVED' else "#3b82f6"
            html_message = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h3 style="color: #0f172a; margin-bottom: 20px;">BloodConnect Support Update</h3>
                <p style="color: #475569; font-size: 15px;">Hello {ticket.created_by.first_name or 'Administrator'},</p>
                <p style="color: #475569; font-size: 15px;">There is an update on your ticket: <strong>{ticket.subject}</strong></p>
                
                <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid {status_color}; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: bold;">Current Status: {ticket.get_status_display()}</p>
            """
            
            if message:
                html_message += f"""
                    <p style="margin: 0 0 5px 0; font-weight: bold; color: #0f172a;">Support Team Response:</p>
                    <div style="color: #475569; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">{message}</div>
                """
                
            html_message += """
                </div>
                <p style="color: #475569; font-size: 15px;">You can reply to this message directly from your Tenant Dashboard.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="color: #94a3b8; font-size: 12px;">&copy; BloodConnect Global Infrastructure</p>
            </div>
            """
            
            # Dispatch safely so a failed email doesn't crash the status update
            try:
                send_async_email(
                    subject=subject,
                    plain_message=plain_message,
                    recipient_list=[ticket.created_by.email],
                    html_message=html_message
                )
            except Exception as e:
                print(f"Failed to dispatch ticket notification: {e}")

        return Response({"message": "Ticket updated successfully."}, status=status.HTTP_200_OK)
    
class SystemCronWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        auth_header = request.headers.get('Authorization', '')
        query_token = request.query_params.get('token', '')
        
        provided_token = query_token if query_token else auth_header.replace('Bearer ', '').strip()
        expected_token = getattr(settings, 'CRON_SECRET_KEY', settings.SECRET_KEY)

        if not provided_token or provided_token != expected_token:
            return Response({"error": "Unauthorized cron execution."}, status=status.HTTP_403_FORBIDDEN)

        # === 1. Task: Purge Old Records ===
        deleted_count = 0
        try:
            cutoff_date = timezone.now() - relativedelta(days=30)
            
            # Fetch the stale records
            old_records = Donor.all_objects.filter(
                is_deleted=True, 
                deleted_at__lt=cutoff_date
            )
            
            # Iterate and call your custom hard_delete() on each instance
            for donor in old_records:
                donor.hard_delete()
                deleted_count += 1
            
        except Exception as e:
            return Response({"error": f"Task Failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # === Add more daily tasks here in the future ===

        return Response({
            "message": "Daily cron jobs executed successfully.",
            "tasks_completed": {
                "records_purged": deleted_count
            }
        }, status=status.HTTP_200_OK)