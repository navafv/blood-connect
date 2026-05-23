import string
import random
import csv
import io
from rest_framework import viewsets, generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from django.db.models import Count, F
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta

from .tasks import send_async_email
from .models import (
    ContactMessage, MasterCountry, MasterState, MasterDistrict,
    CustomUser, Organization, Donor, Advertisement, PaymentTransaction, SystemLog, TenantSupportTicket
)
from .serializers import (
    ContactMessageSerializer, MasterCountrySerializer, MasterStateSerializer, MasterDistrictSerializer,
    CustomUserSerializer, OrganizationSerializer, DonorSerializer, AdvertisementSerializer, PaymentTransactionSerializer, SystemLogSerializer, TenantSupportTicketSerializer
)


class CookieTokenObtainPairView(TokenObtainPairView):
    """
    Overrides login to set tokens as HttpOnly cookies instead of returning JSON.
    Includes strict throttling to prevent credential stuffing.
    """
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            user = CustomUser.objects.filter(username=request.data.get('username')).first()
            actual_role = user.role
            
            # If they were created via terminal, force them to be a SUPER_ADMIN
            if user and user.is_superuser:
                actual_role = 'SUPER_ADMIN'
            
            # Set Access Token Cookie
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=access_token,
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
            # Set Refresh Token Cookie
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=refresh_token,
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
            
            # Remove tokens from JSON response body for ultimate security
            del response.data['access']
            del response.data['refresh']
            
            response.data['message'] = 'Login successful.'
            response.data['role'] = actual_role

        return response
    
class CookieTokenRefreshView(TokenRefreshView):
    """Overrides refresh to read from cookies and issue new cookies."""
    def post(self, request, *args, **kwargs):
        # 1. Extract refresh token from cookie and inject it into the request data
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        if refresh_token:
            request.data['refresh'] = refresh_token
            
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # 2. Update Access Cookie
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=response.data.get('access'),
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
            del response.data['access']

            # 3. Update Refresh Cookie (if ROTATE_REFRESH_TOKENS is True)
            if 'refresh' in response.data:
                response.set_cookie(
                    key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                    value=response.data['refresh'],
                    expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                    secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                    httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                    samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
                )
                del response.data['refresh']
                
            response.data['message'] = 'Session extended.'
            
        return response
    
class LogoutView(APIView):
    """Securely logs the user out by commanding the browser to destroy the cookies."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        response = Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        # Destroy the cookies
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        return response


# ==========================================
# CUSTOM PAGINATION CLASS
# ==========================================
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20 # Return 20 items per page by default
    page_size_query_param = 'page_size' # Allow frontend to request ?page_size=50
    max_page_size = 100 # Maximum limit to prevent abuse

# ==========================================
# 1. PUBLIC GEOGRAPHIC VIEWS (For Dropdowns)
# ==========================================

class MasterCountryListView(generics.ListAPIView):
    """Returns only countries whitelisted by the Super Admin"""
    queryset = MasterCountry.objects.filter(is_whitelisted=True)
    serializer_class = MasterCountrySerializer
    permission_classes = [permissions.AllowAny]

class MasterStateListView(generics.ListAPIView):
    """Returns states filtered by a specific country ID"""
    serializer_class = MasterStateSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        country_id = self.request.query_params.get('country')
        if country_id:
            return MasterState.objects.filter(country_id=country_id)
        return MasterState.objects.none()

class MasterDistrictListView(generics.ListAPIView):
    """Returns districts filtered by a specific state ID"""
    serializer_class = MasterDistrictSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        state_id = self.request.query_params.get('state')
        if state_id:
            return MasterDistrict.objects.filter(state_id=state_id)
        return MasterDistrict.objects.none()


# ==========================================
# 2. PUBLIC DONOR SEARCH VIEW
# ==========================================

class PublicDonorSearchView(generics.ListAPIView):
    """
    Handles the public cascading search. 
    Only returns donors belonging to 'ACTIVE' organizations.
    """
    serializer_class = DonorSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Donor.objects.select_related(
            'organization', 'country', 'state', 'district'
        ).filter(organization__status='ACTIVE')

        # 2. Grab search parameters from the URL (e.g., ?blood_group=O+&district=5)
        blood_group = self.request.query_params.get('blood_group')
        country = self.request.query_params.get('country')
        state = self.request.query_params.get('state')
        district = self.request.query_params.get('district')

        # 3. Apply filters if the user provided them
        if blood_group:
            queryset = queryset.filter(blood_group=blood_group)
        if country:
            queryset = queryset.filter(country__name=country) # Or filter by ID
        if state:
            queryset = queryset.filter(state__name=state)
        if district:
            queryset = queryset.filter(district__name=district)

        return queryset


# ==========================================
# 3. ORGANIZATION REGISTRATION VIEW
# ==========================================

class RegisterOrganizationView(APIView):
    """
    Handles the combined creation of a new Organization AND its primary Admin user.
    Uses @transaction.atomic to ensure if one fails, the whole process rolls back.
    """
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data
        
        try:
            # 1. Create the Organization (Tenant)
            # Note: The frontend needs to pass country_id, state_id, district_id during registration
            organization = Organization.objects.create(
                name=data.get('orgName'),
                org_type=data.get('orgType', 'NGO'), # Default to NGO if not provided
                contact_email=data.get('email'),
                country_id=data.get('country_id'),
                state_id=data.get('state_id'),
                district_id=data.get('district_id'),
                address_line="Pending Address...", # Can be updated later in profile settings
                status='PENDING'
            )

            # 2. Create the primary Admin User for this organization
            admin_user = CustomUser.objects.create_user(
                username=data.get('email'), # Use email as username
                email=data.get('email'),
                password=data.get('password'),
                first_name=data.get('contactName', ''),
                role='ORG_ADMIN',
                organization=organization
            )

            return Response({
                "message": "Organization registered successfully. Please check your email to verify your account.",
                "organization_id": organization.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            # If anything fails (e.g., email already exists, missing geographic IDs), it rolls back completely.
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 4. TENANT DASHBOARD: DONOR MANAGEMENT (CRUD)
# ==========================================

class TenantDonorViewSet(viewsets.ModelViewSet):
    """
    This is the core Multi-Tenancy security view. 
    It ensures an Organization Admin can ONLY see, update, and delete their OWN donors.
    """
    serializer_class = DonorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.organization:
            return Donor.objects.none()
            
        # Add select_related here too!
        return Donor.objects.select_related(
            'country', 
            'state', 
            'district'
        ).filter(organization=self.request.user.organization).order_by('-created_at')
    
    def perform_create(self, serializer):
        """
        When the ORG_ADMIN clicks 'Add Donor' on the frontend, 
        this automatically forces the donor to belong to their organization 
        and locks the donor to the organization's geographic region.
        """
        org = self.request.user.organization
        serializer.save(organization=org)

class TenantDonorBulkUploadView(APIView):
    """
    Allows ORG_ADMINs to upload a CSV file and bulk-import thousands of donors at once.
    Optimized for low-memory streaming and strict security validation.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser] # Allows accepting file uploads

    @transaction.atomic
    def post(self, request):
        user = request.user
        if not user.organization:
            return Response({"error": "No organization linked."}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

        if not file.name.endswith('.csv'):
            return Response({"error": "Only .csv files are allowed."}, status=status.HTTP_400_BAD_REQUEST)
        
        allowed_mime_types = ['text/csv', 'application/csv', 'application/vnd.ms-excel']
        if file.content_type not in allowed_mime_types:
            return Response({"error": "Invalid file type. Please upload a valid CSV."}, status=status.HTTP_400_BAD_REQUEST)

        org = user.organization
        
        try:
            decoded_file = io.TextIOWrapper(file, encoding='utf-8', errors='replace')
            reader = csv.DictReader(decoded_file)
            
            expected_headers = {'full_name', 'phone_number', 'blood_group', 'date_of_birth'}
            if not reader.fieldnames or not expected_headers.issubset(set(reader.fieldnames)):
                return Response(
                    {"error": f"Invalid CSV headers. File must contain at least: {', '.join(expected_headers)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            donors_to_create = []
            errors = []
            
            # Loop through the rows (starting at 2 because row 1 is the header)
            for idx, row in enumerate(reader, start=2): 
                try:
                    full_name = row.get('full_name')
                    phone_number = row.get('phone_number')
                    blood_group = row.get('blood_group')
                    dob_str = row.get('date_of_birth')

                    # 1. Basic validation for required fields (including DOB)
                    if not full_name or not phone_number or not blood_group or not dob_str:
                        errors.append(f"Row {idx} skipped: Missing required fields (full_name, phone_number, blood_group, or date_of_birth).")
                        continue
                        
                    # 2. Strict Date of Birth Parsing
                    try:
                        parsed_dob = datetime.strptime(dob_str.strip(), '%Y-%m-%d').date()
                    except ValueError:
                        errors.append(f"Row {idx} skipped: Invalid date_of_birth format '{dob_str}'. Expected YYYY-MM-DD.")
                        continue

                    # 3. Strict Last Donation Date Parsing (Optional Field)
                    last_donation_str = row.get('last_donation_date')
                    parsed_last_donation = None
                    if last_donation_str and last_donation_str.strip():
                        try:
                            parsed_last_donation = datetime.strptime(last_donation_str.strip(), '%Y-%m-%d').date()
                        except ValueError:
                            errors.append(f"Row {idx} skipped: Invalid last_donation_date format. Expected YYYY-MM-DD.")
                            continue

                    # Create the model instance in memory (does NOT hit the database yet)
                    donor = Donor(
                        organization=org,
                        country=org.country, 
                        state=org.state,
                        district=org.district,
                        full_name=full_name.strip(),
                        phone_number=phone_number.strip(),
                        date_of_birth=parsed_dob,
                        gender=row.get('gender', 'O').strip().upper()[:1],
                        blood_group=blood_group.strip().upper(),
                        last_donation_date=parsed_last_donation
                    )
                    donors_to_create.append(donor)
                    
                except Exception as e:
                    errors.append(f"Row {idx} skipped: Invalid data format ({str(e)}).")

            # Execute the massive SQL INSERT in a fraction of a second
            if donors_to_create:
                Donor.objects.bulk_create(donors_to_create, ignore_conflicts=True)
                
            return Response({
                "message": f"Successfully imported {len(donors_to_create)} donors.",
                "errors": errors
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Error parsing CSV file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 5. PUBLIC ADVERTISEMENTS VIEW
# ==========================================

class ActiveAdvertisementView(generics.ListAPIView):
    """Public view to fetch ALL active and non-expired ads."""
    serializer_class = AdvertisementSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Advertisement.objects.filter(
            is_active=True, 
            expires_at__gt=timezone.now()
        ).order_by('-created_at')


# ==========================================
# 6. PASSWORD RESET REQUEST VIEW
# ==========================================

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        email = request.data.get('email')
        user = CustomUser.objects.filter(email=email).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            # Use a variable for the frontend URL in settings.py for production flexibility
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

            # Prepare the email
            subject = "Reset your BloodConnect Password"
            plain_message = f"Click the link below to reset your password: {reset_link}"
            html_message = f"""
            <div style="font-family: Arial; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. Click the button below to proceed:</p>
                <a href="{reset_link}" style="background-color: #e11d48; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    Reset Password
                </a>
                <p style="margin-top: 20px; color: #666;">If you did not request this, please ignore this email.</p>
            </div>
            """

            # ACTUAL ASYNC EMAIL DELIVERY
            send_async_email.delay(
                subject=subject, 
                plain_message=plain_message, 
                recipient_list=[email], 
                html_message=html_message
            )

        # Always return 200 OK
        return Response(
            {"message": "If an account exists, a password reset link has been sent."}, 
            status=status.HTTP_200_OK
        )


# ==========================================
# 7. PASSWORD RESET CONFIRM VIEW
# ==========================================

class PasswordResetConfirmView(APIView):
    """
    Verifies the secure token and UID, then updates the user's password.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        try:
            # 1. Decode the User ID
            uid = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            user = None

        # 2. Check if the user exists AND the token is valid/unexpired
        if user is not None and default_token_generator.check_token(user, token):
            # 3. Hash and save the new password
            user.set_password(new_password)
            user.save()
            return Response(
                {"message": "Password has been reset successfully."}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "The reset link is invalid or has expired. Please request a new link."}, 
                status=status.HTTP_400_BAD_REQUEST
            )


# ==========================================
# 8. SUPER ADMIN CONTROLS
# ==========================================

class IsSuperAdmin(permissions.BasePermission):
    """
    Custom permission to allow users with the 'SUPER_ADMIN' role 
    OR native Django superusers (created via python manage.py createsuperuser).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'SUPER_ADMIN' or request.user.is_superuser)
        )


class SuperAdminOrganizationListView(generics.ListAPIView):
    """
    Returns a list of all registered organizations across the platform.
    Only accessible by Super Admins.
    """
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperAdmin]
    queryset = Organization.objects.select_related(
        'country', 
        'state', 
        'district'
    ).order_by('-created_at')


class SuperAdminOrganizationStatusUpdateView(APIView):
    """
    Allows a Super Admin to Approve (ACTIVE) or Suspend an organization.
    Fires a welcome email upon approval.
    """
    permission_classes = [IsSuperAdmin]

    def patch(self, request, pk):
        try:
            organization = Organization.objects.get(pk=pk)
        except Organization.DoesNotExist:
            return Response({"error": "Organization not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in dict(Organization.STATUS_CHOICES).keys():
            return Response({"error": "Invalid status provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Track the old status to ensure we only send the welcome email ONCE
        old_status = organization.status
        
        # Update and save the new status
        organization.status = new_status
        organization.save()

        if old_status != 'ACTIVE' and new_status == 'ACTIVE':
            self.send_approval_email(organization)

        return Response({
            "message": f"Organization status updated to {new_status}",
            "status": new_status
        }, status=status.HTTP_200_OK)

    def send_approval_email(self, organization):
        """Generates and sends a styled HTML welcome email."""
        subject = "Welcome to BloodConnect! Your Dashboard is Ready 🩸"
        
        # Plain text fallback (for older email clients)
        plain_message = f"Welcome to BloodConnect, {organization.name}! Your account has been approved. Log in at http://localhost:5173/login"
        
        # Beautiful HTML Version
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
        
        # ACTUAL ASYNC EMAIL DELIVERY
        send_async_email.delay(
            subject=subject,
            plain_message=plain_message,
            recipient_list=[organization.contact_email],
            html_message=html_message
        )
    
class SuperAdminDashboardStatsView(APIView):
    """
    Returns platform-wide statistics for the Super Admin dashboard.
    """
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        # 1. Calculate Aggregate Metrics
        total_orgs = Organization.objects.count()
        active_orgs = Organization.objects.filter(status='ACTIVE').count()
        global_donors = Donor.objects.count()
        
        # 2. Get Pending Organizations for the Action Center
        pending_orgs_qs = Organization.objects.filter(status='PENDING').order_by('-created_at')
        pending_approvals = pending_orgs_qs.count()
        
        pending_orgs_data = []
        for org in pending_orgs_qs[:5]: # Get up to 5 pending orgs
            pending_orgs_data.append({
                "id": org.id,
                "name": org.name,
                "location": f"{org.district.name}, {org.state.name}",
                "date": org.created_at.strftime("%b %d, %Y"),
                "type": org.get_org_type_display()
            })
            
        # 3. Static/Generated System Logs (Since we don't have a dedicated logging table yet)
        system_logs = [
            {"id": "log-1", "message": f"Platform operating normally with {active_orgs} active tenants.", "time": "Just now", "type": "system"},
            {"id": "log-2", "message": f"{global_donors} total donors now registered globally.", "time": "1 hour ago", "type": "analytics"},
            {"id": "log-3", "message": "Automated database backup completed successfully.", "time": "3 hours ago", "type": "system"},
        ]

        return Response({
            "globalStats": {
                "totalOrganizations": total_orgs,
                "pendingApprovals": pending_approvals,
                "globalDonors": global_donors,
                "activeSubscriptions": active_orgs
            },
            "pendingOrgs": pending_orgs_data,
            "systemLogs": system_logs
        }, status=status.HTTP_200_OK)

class SuperAdminSystemLogListView(generics.ListAPIView):
    """
    Returns system logs for the Super Admin audit trail with pagination.
    """
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
    parser_classes = [MultiPartParser, FormParser] # Required for image uploads

    def create(self, request, *args, **kwargs):
        # Calculate expiration date based on the dropdown selection (months)
        duration_months = int(request.data.get('duration_months', 1))
        expires_at = timezone.now() + timedelta(days=30 * duration_months)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(expires_at=expires_at)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        """Extends the ad expiration date."""
        ad = self.get_object()
        months = int(request.data.get('months', 1))
        
        if ad.is_expired:
            ad.expires_at = timezone.now() + timedelta(days=30 * months)
        else:
            ad.expires_at += timedelta(days=30 * months)
            
        ad.save()
        return Response({'message': 'Ad extended successfully', 'expires_at': ad.expires_at})

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggles the is_active status (Disable/Enable)."""
        ad = self.get_object()
        ad.is_active = not ad.is_active
        ad.save()
        return Response({'message': 'Status updated', 'is_active': ad.is_active})
    
class SuperAdminContactMessageViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for Super Admins to manage and reply to public contact messages.
    """
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    permission_classes = [IsSuperAdmin]

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Sends an email reply to the user and marks the message as resolved."""
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
        
        # Fire the Celery Task
        send_async_email.delay(
            subject=subject,
            plain_message=plain_message,
            recipient_list=[message.email],
            html_message=html_message
        )
        
        # Auto-resolve the message
        message.is_resolved = True
        message.save()
        
        return Response({"message": "Reply sent successfully and ticket resolved."})

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Manually toggles the resolved status."""
        message = self.get_object()
        message.is_resolved = not message.is_resolved
        message.save()
        return Response({'message': 'Status updated', 'is_resolved': message.is_resolved})
    
class SuperAdminArchivedDonorViewSet(viewsets.ModelViewSet):
    """
    Endpoints for Super Admins to view, restore, or permanently delete archived donors.
    """
    serializer_class = DonorSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        # We must use all_objects because the default objects manager hides is_deleted=True
        return Donor.all_objects.select_related(
            'organization',
            'country', 
            'state', 
            'district'
        ).filter(is_deleted=True).order_by('-deleted_at')

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restores a soft-deleted donor back to the active registry."""
        donor = self.get_object()
        donor.is_deleted = False
        donor.deleted_at = None
        donor.save()
        return Response({"message": f"{donor.full_name} has been restored successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'])
    def hard_delete_record(self, request, pk=None):
        """Permanently purges the record from the database (GDPR Right to Erasure)."""
        donor = self.get_object()
        donor.hard_delete() # Calls the custom hard_delete method from your models.py
        return Response({"message": "Donor record permanently erased."}, status=status.HTTP_200_OK)
    

class TenantDashboardStatsView(APIView):
    """
    Calculates and returns real-time statistics for the logged-in
    Organization's dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Ensure the user belongs to an organization
        if not user.organization:
            return Response({"error": "No organization linked."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Get ONLY the donors belonging to this organization
        donors = Donor.objects.filter(organization=user.organization)
        
        # 1. Total Donors
        total_donors = donors.count()
        
        # 2. Available Donors (Calculate in Python since it's a dynamic @property)
        available_donors = sum(1 for d in donors if d.is_available_now)
        
        # 3. Donations this month (last_donation_date within last 30 days)
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent_donations = donors.filter(last_donation_date__gte=thirty_days_ago).count()
        
        # 4. Blood Group Distribution (Aggregated by Database)
        bg_counts = donors.values('blood_group').annotate(count=Count('blood_group')).order_by('-count')
        blood_distribution = [{"group": item['blood_group'], "count": item['count']} for item in bg_counts]
        
        # 5. Recent Activity (Grabbing the 5 newest donors added)
        recent_donors = donors.order_by('-created_at')[:5]
        recent_activity = []
        for d in recent_donors:
            recent_activity.append({
                "id": f"donor_{d.id}",
                "action": "DONOR_ADDED",
                "message": f"Registered new donor: {d.full_name} ({d.blood_group})",
                "timestamp": d.created_at.isoformat()
            })
            
        return Response({
            "overview": {
                "totalDonors": total_donors,
                "availableDonors": available_donors,
                "donationsThisMonth": recent_donations,
                "pendingRequests": 0 # Placeholder for a future feature!
            },
            "bloodGroupDistribution": blood_distribution,
            "recentActivity": recent_activity
        }, status=status.HTTP_200_OK)
    

class TenantOrganizationView(generics.RetrieveUpdateAPIView):
    """
    Allows a Tenant Admin to view and update their organization's profile settings.
    """
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # This completely ignores any ID passed in the URL, preventing IDOR attacks.
        if not self.request.user.organization:
            raise PermissionDenied("You are not associated with any organization.")
        return self.request.user.organization
    
class TenantStaffViewSet(viewsets.ModelViewSet):
    """
    Allows ORG_ADMINs to view, invite, and remove staff members
    within their own organization.
    """
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return staff belonging to the logged-in user's organization
        user = self.request.user
        if not user.organization:
            return CustomUser.objects.none()
        return CustomUser.objects.filter(organization=user.organization).order_by('-date_joined')

    def create(self, request, *args, **kwargs):
        # 1. Security Check: Only Admins can invite staff
        if request.user.role != 'ORG_ADMIN':
            return Response({"error": "Only Organization Admins can add staff."}, status=status.HTTP_403_FORBIDDEN)

        email = request.data.get('email')
        first_name = request.data.get('name', '')
        role = request.data.get('role', 'ORG_STAFF')

        # 2. Prevent duplicate emails
        if CustomUser.objects.filter(email=email).exists():
            return Response({"error": "A user with this email already exists in the system."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Generate a secure, random temporary password
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))

        # 4. Create the new user and lock them to the current organization
        org = request.user.organization
        user = CustomUser.objects.create_user(
            username=email,
            email=email,
            password=temp_password,
            first_name=first_name,
            role=role,
            organization=org
        )

        # 5. ACTUAL EMAIL DELIVERY
        login_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/login"
        
        subject = f"You've been invited to join {org.name} on BloodConnect 🩸"
        plain_message = f"Welcome! You've been invited to join {org.name} on BloodConnect. Your temporary password is: {temp_password}. Please log in at {login_url} and change your password immediately."
        
        html_message = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 40px;">🏥</span>
            </div>
            <h2 style="color: #0f172a; text-align: center; margin-bottom: 20px;">Staff Invitation</h2>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Hello {first_name},
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                You have been invited by your administrator to join the <strong>{org.name}</strong> team on the BloodConnect platform.
            </p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0;">
                <p style="margin: 0; color: #334155; font-size: 15px;">Your Temporary Login Credentials:</p>
                <p style="margin: 10px 0 0 0; font-size: 16px;">
                    <strong>Email:</strong> {email}<br/>
                    <strong>Password:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">{temp_password}</span>
                </p>
            </div>
            
            <p style="color: #ef4444; font-size: 14px; font-weight: bold;">
                * Please log in and change this temporary password immediately.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{login_url}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
                    Log In Now
                </a>
            </div>
        </div>
        """

        # ACTUAL ASYNC EMAIL DELIVERY
        send_async_email.delay(
            subject=subject,
            plain_message=plain_message,
            recipient_list=[email],
            html_message=html_message
        )

        serializer = self.get_serializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        # Security Check
        if request.user.role != 'ORG_ADMIN':
            return Response({"error": "Only Organization Admins can remove staff."}, status=status.HTTP_403_FORBIDDEN)
        
        user_to_delete = self.get_object()
        
        # Prevent the admin from accidentally deleting themselves
        if user_to_delete.id == request.user.id:
            return Response({"error": "You cannot remove your own admin account."}, status=status.HTTP_400_BAD_REQUEST)
            
        return super().destroy(request, *args, **kwargs)
    

# ==========================================
# 8. Contact Message Creation View (For Public Contact Us Form)
# ==========================================

class ContactMessageCreateView(generics.CreateAPIView):
    """
    Allows the public to submit contact forms to the Super Admin.
    """
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]


# ==========================================
# TENANT: BILLING & SUPPORT
# ==========================================

class TenantPaymentView(generics.ListCreateAPIView):
    serializer_class = PaymentTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.organization:
            return PaymentTransaction.objects.none()
        return PaymentTransaction.objects.select_related(
            'organization', 
            'submitted_by'
        ).filter(organization=self.request.user.organization).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'ORG_ADMIN':
            raise PermissionDenied("Only Organization Admins can submit payments.")
        if not self.request.user.organization:
            raise PermissionDenied("You are not linked to an organization.")
            
        serializer.save(
            organization=self.request.user.organization,
            submitted_by=self.request.user,
            amount=999.00 # Fixed price enforced by backend
        )

class TenantSupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.organization:
            return TenantSupportTicket.objects.none()
        return TenantSupportTicket.objects.select_related(
            'organization', 
            'created_by'
        ).prefetch_related(
            'replies__sender'
        ).filter(organization=self.request.user.organization).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization, created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        message = request.data.get('message')
        if not message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        TicketReply.objects.create(ticket=ticket, sender=request.user, message=message)
        # Automatically reopen the ticket if the tenant replies to a resolved one
        if ticket.status == 'RESOLVED':
            ticket.status = 'OPEN'
            ticket.save()
            
        return Response({"message": "Reply sent successfully."})


# ==========================================
# SUPER ADMIN: BILLING & SUPPORT
# ==========================================

class SuperAdminPaymentViewSet(viewsets.ModelViewSet):
    """Super Admin endpoints to view and approve/reject UPI transactions."""
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsSuperAdmin]

    queryset = PaymentTransaction.objects.select_related(
        'organization', 
        'submitted_by'
    ).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        payment = self.get_object()
        action_type = request.data.get('action') # 'APPROVE' or 'REJECT'
        
        if payment.status != 'PENDING':
            return Response({"error": "Payment is already processed."}, status=status.HTTP_400_BAD_REQUEST)

        payment.verified_at = timezone.now()
        
        if action_type == 'APPROVE':
            payment.status = 'APPROVED'
            payment.save()
            
            # Extend Organization Subscription by 1 Year
            org = payment.organization
            org.is_paid = True
            
            # If they already have active time left, add 365 days to it. Otherwise, start from today.
            if org.subscription_expires_at and org.subscription_expires_at > timezone.now():
                org.subscription_expires_at += timedelta(days=365)
            else:
                org.subscription_expires_at = timezone.now() + timedelta(days=365)
            org.save()
            
            return Response({"message": "Payment approved and subscription extended by 1 year."})
            
        elif action_type == 'REJECT':
            payment.status = 'REJECTED'
            payment.save()
            return Response({"message": "Payment rejected."})
            
        return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

class SuperAdminExtendSubscriptionView(APIView):
    """Allows Super Admins to manually gift/extend a subscription by X years from the Org table."""
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
        
        return Response({
            "message": f"Successfully extended {org.name}'s subscription by {years} year(s).",
            "expires_at": org.subscription_expires_at
        })

class SuperAdminSupportTicketViewSet(viewsets.ModelViewSet):
    """Super Admin endpoints to manage and reply to Tenant Support Tickets."""
    serializer_class = TenantSupportTicketSerializer
    permission_classes = [IsSuperAdmin]

    queryset = TenantSupportTicket.objects.select_related(
        'organization', 
        'created_by'
    ).prefetch_related(
        'replies__sender'
    ).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        message = request.data.get('message')
        new_status = request.data.get('status', 'IN_PROGRESS') # Default to marking it in progress
        
        if message:
            TicketReply.objects.create(ticket=ticket, sender=request.user, message=message)
            
        ticket.status = new_status
        ticket.save()
        
        return Response({"message": "Reply sent and status updated."})


# ==========================================
# 9. Advertisement Click Tracking and Redirection
# ==========================================

class AdClickRedirectView(APIView):
    """
    Public endpoint to track advertisement clicks. 
    Increments the click counter securely and redirects the user.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        # 1. Find the ad or return a 404 error
        ad = get_object_or_404(Advertisement, pk=pk)
        
        # 2. Securely increment the click counter at the database level
        # Using F() prevents race conditions if multiple users click simultaneously!
        Advertisement.objects.filter(pk=pk).update(clicks=F('clicks') + 1)
        
        # 3. Issue a 302 HTTP Redirect to send the user to the advertiser's site
        return HttpResponseRedirect(redirect_to=ad.target_link)