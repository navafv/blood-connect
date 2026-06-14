import calendar
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.utils.timezone import localtime
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum
from django.db.models.deletion import ProtectedError
from django.db.models.functions import TruncMonth
from rest_framework import viewsets, generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken

from ..tasks import send_async_email
from ..models import (
    MasterCountry, MasterDistrict, MasterState, Organization, Donor, Advertisement, PaymentTransaction, SystemLog, 
    TenantSupportTicket, TicketReply, ContactMessage, HeroImage, CustomUser
)
from ..serializers import (
    MasterCountrySerializer, MasterDistrictSerializer, MasterStateSerializer, OrganizationSerializer, 
    DonorSerializer, AdvertisementSerializer, PaymentTransactionSerializer, SystemLogSerializer, 
    PublicDonorSearchSerializer,TenantSupportTicketSerializer, ContactMessageSerializer, HeroImageSerializer
)
from .public_views import StandardResultsSetPagination


def send_subscription_activated_email(organization):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://www.bloodonate.org')
    login_link = f"{frontend_url}/login"
    
    subject = "Subscription Activated - Bloodonate 🩸"
    plain_message = f"Hello {organization.name},\n\nYour subscription has been successfully activated. You can now log in and access all premium features of the platform.\n\nYour subscription is valid until: {organization.subscription_expires_at.strftime('%B %d, %Y')}\n\nLog in at {login_link}"
    
    html_message = f"""
    <!doctype html>
    <html>
    <body style="margin: 0; padding: 0; background: #f8fafc; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
                        <tr>
                            <td align="center" style="background: #0f172a; padding: 36px 24px; border-bottom: 4px solid #10b981;">
                                <div style="font-size: 42px; margin-bottom: 12px">🩸</div>
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">Bloodonate</h1>
                                <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px">Subscription Activated</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 32px">
                                <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 24px">Hello, {organization.name}</h2>
                                <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.7;">
                                    Your Bloodonate Premium License has been successfully activated by the Administrator.
                                </p>
                                <div style="background: #f8fafc; border-left: 4px solid #10b981; border-radius: 10px; padding: 22px; margin: 30px 0;">
                                    <p style="margin: 0 0 14px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #64748b;">License Valid Until</p>
                                    <p style="margin:0; font-size:18px; font-weight:700; color:#10b981;">
                                        {organization.subscription_expires_at.strftime('%B %d, %Y')}
                                    </p>
                                </div>
                                <p style="margin: 0 0 30px; color: #475569; font-size: 16px; line-height: 1.7;">
                                    You can now log in to the dashboard, manage your donors, and utilize all premium features of the platform.
                                </p>
                                <div style="text-align: center; margin: 40px 0">
                                    <a href="{login_link}" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-size: 16px; font-weight: 600;">
                                        Access Dashboard
                                    </a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 24px; color: #94a3b8; font-size: 12px; background: #f8fafc;">
                                © {localtime().year} Bloodonate. All rights reserved.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    try:
        send_async_email(
            subject=subject,
            plain_message=plain_message,
            recipient_list=[organization.contact_email],
            html_message=html_message
        )
    except Exception as e:
        print(f"Failed to send subscription activation email: {e}")

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

class SuperAdminOrganizationDetailView(generics.RetrieveAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperAdmin]
    queryset = Organization.objects.select_related('country', 'state', 'district')

class SuperAdminOrganizationDonorsView(generics.ListAPIView):
    serializer_class = PublicDonorSearchSerializer
    permission_classes = [IsSuperAdmin]
    
    def get_queryset(self):
        org_id = self.kwargs.get('pk')
        return Donor.objects.filter(organization_id=org_id).select_related(
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

        SystemLog.objects.create(
            organization=organization, actor=request.user, level='WARNING',
            source='SYSTEM_ADMIN', message=f"SuperAdmin updated organization status to {new_status}"
        )

        if old_status != 'ACTIVE' and new_status == 'ACTIVE':
            self.send_approval_email(organization)

        return Response({
            "message": f"Organization status updated to {new_status}",
            "status": new_status
        }, status=status.HTTP_200_OK)

    def send_approval_email(self, organization):
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://www.bloodonate.org')
        login_link = f"{frontend_url}/login"
        
        subject = "Welcome to Bloodonate! Your Dashboard is Ready 🩸"
        plain_message = f"Welcome to Bloodonate, {organization.name}! Your account has been approved. Log in at {login_link}"
        
        html_message = f"""
        <!doctype html>
        <html>

        <body style="
                    margin: 0;
                    padding: 0;
                    background: #f8fafc;
                    font-family: Arial, sans-serif;
                    ">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="
                            max-width: 600px;
                            background: #ffffff;
                            border-radius: 16px;
                            overflow: hidden;
                            border: 1px solid #e2e8f0;
                            ">
                            <tr>
                                <td align="center" style="
                                background: #0f172a;
                                padding: 36px 24px;
                                border-bottom: 4px solid #10b981;
                                ">
                                    <div style="font-size: 42px; margin-bottom: 12px">🩸</div>

                                    <h1 style="
                                    margin: 0;
                                    color: #ffffff;
                                    font-size: 28px;
                                    font-weight: 800;
                                ">
                                        Bloodonate
                                    </h1>

                                    <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px">
                                        Organization Approved
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 40px 32px">
                                    <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 24px">
                                        Welcome to Bloodonate!
                                    </h2>

                                    <p style="
                                    margin: 0 0 24px;
                                    color: #475569;
                                    font-size: 16px;
                                    line-height: 1.7;
                                ">
                                        Great news — your organization
                                        <strong style="color: #0f172a">{organization.name}</strong>
                                        has been successfully approved by the Bloodonate
                                        administration team.
                                    </p>

                                    <p style="
                                    margin: 0 0 30px;
                                    color: #475569;
                                    font-size: 16px;
                                    line-height: 1.7;
                                ">
                                        You can now access your dashboard, manage donors, invite staff
                                        members, and start coordinating blood donation activities in
                                        your region.
                                    </p>

                                    <div style="text-align: center; margin: 40px 0">
                                        <a href="{login_link}" style="
                                    display: inline-block;
                                    background: #10b981;
                                    color: #ffffff;
                                    text-decoration: none;
                                    padding: 16px 32px;
                                    border-radius: 10px;
                                    font-size: 16px;
                                    font-weight: 600;
                                    ">
                                            Access Dashboard
                                        </a>
                                    </div>

                                    <div style="
                                    background: #f8fafc;
                                    border: 1px solid #e2e8f0;
                                    border-radius: 12px;
                                    padding: 18px;
                                    margin-top: 20px;
                                ">
                                        <p style="
                                    margin: 0;
                                    color: #64748b;
                                    font-size: 14px;
                                    line-height: 1.6;
                                    ">
                                            Your administrator account is now active and ready to use.
                                            If you need assistance, simply reply to this email and our
                                            support team will help you.
                                        </p>
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td align="center" style="
                                padding: 24px;
                                color: #94a3b8;
                                font-size: 12px;
                                background: #f8fafc;
                                ">
                                    © {localtime().year} Bloodonate. All rights reserved.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>

        </html>
        """
        
        send_async_email(
            subject=subject,
            plain_message=plain_message,
            recipient_list=[organization.contact_email],
            html_message=html_message
        )

class SuperAdminImpersonateTenantView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        org = get_object_or_404(Organization, pk=pk)
        
        admin_user = CustomUser.objects.filter(organization=org, role='ORG_ADMIN').first()
        if not admin_user:
            return Response({"error": "No active administrator found for this organization."}, status=status.HTTP_404_NOT_FOUND)
        
        refresh = RefreshToken.for_user(admin_user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        cookie_kwargs = {
            'secure': settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
            'httponly': settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
            'samesite': settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
            'path': settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')
        }
        
        access_max_age = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
        refresh_max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
        
        response = Response({
            "message": f"Successfully impersonating {org.name}",
            "role": "ORG_ADMIN"
        }, status=status.HTTP_200_OK)

        response.set_cookie(
            key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
            value=access_token,
            max_age=access_max_age,
            **cookie_kwargs
        )
        response.set_cookie(
            key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
            value=refresh_token,
            max_age=refresh_max_age,
            **cookie_kwargs
        )

        SystemLog.objects.create(
            organization=org, actor=request.user, level='CRITICAL',
            source='SYSTEM_ADMIN', message=f"SuperAdmin initiated impersonation session for tenant {org.name}."
        )
        
        return response

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

        today = timezone.now().date()
        mrr_data = []
        for i in range(5, -1, -1):
            m = today.month - i
            y = today.year
            if m <= 0:
                m += 12
                y -= 1
            mrr_data.append({"month": calendar.month_abbr[m], "revenue": 0, "year": y, "m_num": m})

        six_months_ago_limit = (today.replace(day=1) - timedelta(days=160)).replace(day=1)

        payments_6m = PaymentTransaction.objects.filter(
            status='APPROVED',
            created_at__gte=six_months_ago_limit
        ).annotate(
            month_trunc=TruncMonth('created_at')
        ).values('month_trunc').annotate(total=Sum('amount')).order_by('month_trunc')

        for p in payments_6m:
            if not p['month_trunc']: continue
            p_month = p['month_trunc'].month
            p_year = p['month_trunc'].year
            for t in mrr_data:
                if t['m_num'] == p_month and t['year'] == p_year:
                    t['revenue'] = float(p['total'])

        for t in mrr_data:
            del t['year']
            del t['m_num']

        return Response({
            "globalStats": {
                "totalOrganizations": Organization.objects.exclude(status='SUSPENDED').count(),
                "pendingApprovals": Organization.objects.filter(status='PENDING').count(),
                "globalDonors": Donor.objects.count(),
                "activeSubscriptions": Organization.objects.filter(status='ACTIVE').count()
            },
            "pendingOrgs": pending_orgs_data,
            "systemLogs": system_logs_data,
            "mrrTrend": mrr_data
        }, status=status.HTTP_200_OK)

class SuperAdminSystemLogListView(generics.ListAPIView):
    permission_classes = [IsSuperAdmin]
    serializer_class = SystemLogSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = SystemLog.objects.all().order_by('-timestamp')
        
        search = self.request.query_params.get('search', None)
        level = self.request.query_params.get('level', None)
        
        if level and level != 'ALL':
            queryset = queryset.filter(level=level)
            
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

class SuperAdminHeroImageViewSet(viewsets.ModelViewSet):
    queryset = HeroImage.objects.all().order_by('order', '-created_at')
    serializer_class = HeroImageSerializer
    permission_classes = [IsSuperAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        hero = self.get_object()
        hero.is_active = not hero.is_active
        hero.save()
        return Response({'message': 'Hero Image status updated', 'is_active': hero.is_active}, status=status.HTTP_200_OK)

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
        
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://www.bloodonate.org')
        contact_url = f"{frontend_url}/contact"
        
        subject = f"Re: {message.subject} - Bloodonate Support"
        plain_message = f"Hello {message.name},\n\n{reply_text}\n\nBest regards,\nThe Bloodonate Team\n\n*** PLEASE DO NOT REPLY TO THIS EMAIL ***\nTo send another message, please visit our contact page at: {contact_url}"
        
        html_message = f"""
        <!doctype html>
        <html>

        <body style="
                    margin: 0;
                    padding: 0;
                    background: #f8fafc;
                    font-family: Arial, sans-serif;
                    ">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="
                            max-width: 600px;
                            background: #ffffff;
                            border-radius: 16px;
                            overflow: hidden;
                            border: 1px solid #e2e8f0;
                            ">
                            <tr>
                                <td align="center" style="
                                background: #0f172a;
                                padding: 36px 24px;
                                border-bottom: 4px solid #3b82f6;
                                ">
                                    <div style="font-size: 42px; margin-bottom: 12px">🩸</div>

                                    <h1 style="
                                    margin: 0;
                                    color: #ffffff;
                                    font-size: 28px;
                                    font-weight: 800;
                                ">
                                        Bloodonate
                                    </h1>

                                    <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px">
                                        Support Team Reply
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 40px 32px">
                                    <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 24px">
                                        Hello, {message.name}
                                    </h2>

                                    <p style="
                                    margin: 0 0 28px;
                                    color: #475569;
                                    font-size: 16px;
                                    line-height: 1.7;
                                ">
                                        Our support team has replied to your message regarding:
                                        <strong>{message.subject}</strong>
                                    </p>

                                    <div style="
                                    background: #f8fafc;
                                    border: 1px solid #e2e8f0;
                                    border-radius: 12px;
                                    padding: 24px;
                                    margin: 30px 0;
                                ">
                                        <p style="
                                    margin: 0;
                                    color: #334155;
                                    font-size: 15px;
                                    line-height: 1.8;
                                    white-space: pre-wrap;
                                    ">
                                            {reply_text}
                                        </p>
                                    </div>

                                    <p style="
                                    margin: 0;
                                    color: #475569;
                                    font-size: 15px;
                                    line-height: 1.7;
                                ">
                                        Best regards,<br />
                                        <strong>Bloodonate Support Team</strong>
                                    </p>
                                    
                                    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-top: 32px; text-align: center;">
                                        <p style="margin: 0; color: #64748b; font-size: 13px; font-weight: bold; text-transform: uppercase;">
                                            Please do not reply to this email
                                        </p>
                                        <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px;">
                                            This inbox is not monitored. To send us another message, please visit the <a href="{contact_url}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">Contact Us</a> page.
                                        </p>
                                    </div>

                                    <hr style="
                                    border: none;
                                    border-top: 1px solid #e2e8f0;
                                    margin: 32px 0;
                                " />

                                    <p style="
                                    margin: 0;
                                    color: #94a3b8;
                                    font-size: 12px;
                                    line-height: 1.6;
                                ">
                                        Original message: <br /><br />

                                        "{message.message}"
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td align="center" style="
                                padding: 24px;
                                color: #94a3b8;
                                font-size: 12px;
                                background: #f8fafc;
                                ">
                                    © {timezone.now().year} Bloodonate. All rights reserved.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>

        </html>
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
            
            if org.subscription_expires_at and org.subscription_expires_at > timezone.now():
                org.subscription_expires_at += timedelta(days=365)
            else:
                org.subscription_expires_at = timezone.now() + timedelta(days=365)
                
            org.save()
            payment.save()

            SystemLog.objects.create(
                organization=org, actor=request.user, level='INFO',
                source='BILLING', message=f"SuperAdmin approved payment {payment.upi_reference}."
            )
            
            send_subscription_activated_email(org)
            
            return Response({"message": "Payment approved and subscription extended."}, status=status.HTTP_200_OK)
            
        elif action_type == 'REJECT':
            payment.status = 'REJECTED'
            payment.save()

            SystemLog.objects.create(
                organization=payment.organization, actor=request.user, level='WARNING',
                source='BILLING', message=f"SuperAdmin rejected payment {payment.upi_reference}."
            )

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
        send_subscription_activated_email(org)
        
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

        if message or new_status == 'RESOLVED':
            subject = f"Update on Support Ticket: TCKT-{str(ticket.id).zfill(4)}"
            
            plain_message = f"Hello {ticket.created_by.first_name or 'Admin'},\n\nYour support ticket '{ticket.subject}' has been updated.\n\nStatus: {ticket.get_status_display()}"
            if message:
                plain_message += f"\n\nSupport Team: {message}"
                
            status_color = "#10b981" if new_status == 'RESOLVED' else "#3b82f6"
            html_message = f"""
            <!doctype html>
            <html>

            <body style="
                            margin: 0;
                            padding: 0;
                            background: #f8fafc;
                            font-family: Arial, sans-serif;
                            ">
                <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="
                                    max-width: 600px;
                                    background: #ffffff;
                                    border-radius: 16px;
                                    overflow: hidden;
                                    border: 1px solid #e2e8f0;
                                    ">
                                <tr>
                                    <td align="center" style="
                                                background:#0f172a;
                                                padding:36px 24px;
                                                border-bottom:4px solid {status_color};
                                                ">
                                        <div style="font-size: 42px; margin-bottom: 12px">🩸</div>

                                        <h1 style="
                                            margin: 0;
                                            color: #ffffff;
                                            font-size: 28px;
                                            font-weight: 800;
                                        ">
                                            Bloodonate
                                        </h1>

                                        <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px">
                                            Support Ticket Update
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 40px 32px">
                                        <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 24px">
                                            Hello, {ticket.created_by.first_name or 'Administrator'}
                                        </h2>

                                        <p style="
                                            margin: 0 0 28px;
                                            color: #475569;
                                            font-size: 16px;
                                            line-height: 1.7;
                                        ">
                                            There has been an update to your support ticket:
                                            <strong>{ticket.subject}</strong>
                                        </p>

                                        <div style="
                                                background:#f8fafc;
                                                border-left:4px solid {status_color};
                                                border-radius:10px;
                                                padding:22px;
                                                margin:30px 0;
                                                ">
                                            <p style="
                                            margin: 0 0 14px;
                                            font-size: 13px;
                                            font-weight: 700;
                                            letter-spacing: 1px;
                                            text-transform: uppercase;
                                            color: #64748b;
                                            ">
                                                Current Status
                                            </p>

                                            <p style="
                                                margin:0;
                                                font-size:18px;
                                                font-weight:700;
                                                color:{status_color};
                                                ">
                                                {ticket.get_status_display()}
                                            </p>
                                        </div>
                                        """
            if message: html_message += f"""
                                        <div style="
                                            background: #ffffff;
                                            border: 1px solid #e2e8f0;
                                            border-radius: 12px;
                                            padding: 24px;
                                            margin-top: 24px;
                                        ">
                                            <p style="
                                            margin: 0 0 14px;
                                            color: #0f172a;
                                            font-size: 15px;
                                            font-weight: 700;
                                            ">
                                                Support Team Response
                                            </p>

                                            <div style="
                                            color: #475569;
                                            font-size: 15px;
                                            line-height: 1.8;
                                            white-space: pre-wrap;
                                            ">
                                                {message}
                                            </div>
                                        </div>
                                        """
            html_message += f"""
                                        <p style="
                                            margin: 32px 0 0;
                                            color: #475569;
                                            font-size: 15px;
                                            line-height: 1.7;
                                        ">
                                            You can continue this conversation directly from your
                                            Bloodonate dashboard.
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="
                                        padding: 24px;
                                        color: #94a3b8;
                                        font-size: 12px;
                                        background: #f8fafc;
                                        ">
                                        © {timezone.now().year} Bloodonate. All rights reserved.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>

            </html>
            """
            
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

        deleted_count = 0
        try:
            cutoff_date = timezone.now() - timedelta(days=30)
            
            old_records = Donor.all_objects.filter(
                is_deleted=True, 
                deleted_at__lt=cutoff_date
            )
            
            for donor in old_records:
                donor.hard_delete()
                deleted_count += 1
            
        except Exception as e:
            return Response({"error": f"Task Failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": "Daily cron jobs executed successfully.",
            "tasks_completed": {
                "records_purged": deleted_count
            }
        }, status=status.HTTP_200_OK)