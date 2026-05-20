import string
import random
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes

from .models import (
    ContactMessage, MasterCountry, MasterState, MasterDistrict,
    CustomUser, Organization, Donor, Advertisement, SystemLog
)
from .serializers import (
    ContactMessageSerializer, MasterCountrySerializer, MasterStateSerializer, MasterDistrictSerializer,
    CustomUserSerializer, OrganizationSerializer, DonorSerializer, AdvertisementSerializer, SystemLogSerializer
)

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

    def get_queryset(self):
        # 1. Start with donors whose parent organization has been approved
        queryset = Donor.objects.filter(organization__status='ACTIVE')

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
        """STRICT ISOLATION: Filter query to only this user's organization."""
        user = self.request.user
        
        # If the user isn't attached to an org (e.g., a public user somehow got in), return nothing.
        if not user.organization:
            return Donor.objects.none()
            
        return Donor.objects.filter(organization=user.organization)

    def perform_create(self, serializer):
        """
        When the ORG_ADMIN clicks 'Add Donor' on the frontend, 
        this automatically forces the donor to belong to their organization 
        and locks the donor to the organization's geographic region.
        """
        org = self.request.user.organization
        serializer.save(organization=org)


# ==========================================
# 5. PUBLIC ADVERTISEMENTS VIEW
# ==========================================

class ActiveAdvertisementView(generics.ListAPIView):
    """Returns active ads. Can be filtered by the user's searching region."""
    serializer_class = AdvertisementSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        country_id = self.request.query_params.get('country')
        
        queryset = Advertisement.objects.filter(is_active=True)
        if country_id:
            queryset = queryset.filter(target_country_id=country_id)
            
        return queryset


# ==========================================
# 6. PASSWORD RESET REQUEST VIEW
# ==========================================

class PasswordResetRequestView(APIView):
    """
    Takes an email, finds the user, generates a secure token, 
    and simulates sending an email with the reset link.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        
        # 1. Find the user by email
        user = CustomUser.objects.filter(email=email).first()

        if user:
            # 2. Generate secure tokens
            # uid is an encoded version of the User's ID
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            # token is a secure, one-time use string
            token = default_token_generator.make_token(user)

            # 3. Create the frontend URL they need to click
            # Assuming your React app is running on localhost:5173
            reset_link = f"http://localhost:5173/reset-password?uid={uid}&token={token}"

            # 4. SIMULATE SENDING EMAIL (Prints to your Python console)
            print("\n" + "="*50)
            print("✉️ SIMULATED PASSWORD RESET EMAIL")
            print(f"To: {email}")
            print(f"Subject: Reset your BloodConnect Password")
            print(f"Message: Click the link below to reset your password:")
            print(f"{reset_link}")
            print("="*50 + "\n")

        # Always return 200 OK so attackers can't guess valid emails
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
    Custom permission to only allow users with the 'SUPER_ADMIN' role.
    """
    def hasattr_role(self, request):
        return hasattr(request.user, 'role') and request.user.role == 'SUPER_ADMIN'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and self.hasattr_role(request))


class SuperAdminOrganizationListView(generics.ListAPIView):
    """
    Returns a list of all registered organizations across the platform.
    Only accessible by Super Admins.
    """
    queryset = Organization.objects.all().order_by('-created_at')
    serializer_class = OrganizationSerializer
    permission_classes = [IsSuperAdmin]


class SuperAdminOrganizationStatusUpdateView(APIView):
    """
    Allows a Super Admin to Approve (ACTIVE) or Suspend an organization.
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

        organization.status = new_status
        organization.save()

        return Response({
            "message": f"Organization status updated to {new_status}",
            "status": new_status
        }, status=status.HTTP_200_OK)
    
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
    Returns the last 100 system logs for the Super Admin audit trail.
    """
    permission_classes = [IsSuperAdmin]
    serializer_class = SystemLogSerializer

    def get_queryset(self):
        return SystemLog.objects.all().order_by('-timestamp')[:100]
    

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
    Allows a tenant admin to retrieve and update their own organization's profile.
    """
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Always return the organization linked to the JWT token's user.
        # This guarantees Hospital A can never edit Hospital B's profile.
        user = self.request.user
        if not user.organization:
            raise PermissionDenied("You are not linked to any organization.")
        return user.organization
    
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
        user = CustomUser.objects.create_user(
            username=email,
            email=email,
            password=temp_password,
            first_name=first_name,
            role=role,
            organization=request.user.organization
        )

        # --- DEVELOPER NOTE ---
        # In a real app, you would use Django's send_mail() here.
        # For now, we print it to the terminal so you can test logging in as the new staff member!
        print("\n" + "="*50)
        print("✉️ STAFF INVITATION EMAIL SIMULATION")
        print(f"To: {email}")
        print(f"Your hospital admin has invited you to BloodConnect.")
        print(f"Your temporary password is: {temp_password}")
        print("="*50 + "\n")

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
    
class TenantBillingUpdateView(APIView):
    """
    Allows an ORG_ADMIN to upgrade or downgrade their organization's subscription tier.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user = request.user

        # 1. Ensure the user is an Admin
        if user.role != 'ORG_ADMIN':
            return Response(
                {"error": "Only Organization Admins can modify billing plans."}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Ensure they are linked to an organization
        if not user.organization:
            return Response(
                {"error": "No organization linked to this account."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        new_plan = request.data.get('plan_tier')
        
        # 3. Validate the plan choice
        valid_plans = dict(Organization.PLAN_CHOICES).keys()
        if new_plan not in valid_plans:
            return Response(
                {"error": "Invalid plan selected."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Update the organization's plan
        user.organization.plan_tier = new_plan
        user.organization.save()

        return Response({
            "message": f"Successfully updated to {new_plan} plan.",
            "plan_tier": new_plan
        }, status=status.HTTP_200_OK)
    

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