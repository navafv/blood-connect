from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LogoutView,
    VerifyEmailOTPView,
    ResendEmailOTPView,
    CookieTokenRefreshView,
    RegisterOrganizationView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    CookieTokenObtainPairView,
    AdClickRedirectView,
    MasterStateListView,
    MasterCountryListView,
    PublicDonorSearchView,
    MasterDistrictListView,
    ActiveAdvertisementView,
    ContactMessageCreateView,
    PublicOrganizationDetailView,
    TenantPaymentView, 
    TenantStaffViewSet,
    TenantDonorViewSet,
    TenantOrganizationView,
    TenantDashboardStatsView,
    TenantDonorBulkUploadView,
    TenantSupportTicketViewSet,
    SuperAdminStateViewSet, 
    SuperAdminPaymentViewSet, 
    SuperAdminCountryViewSet, 
    SuperAdminDistrictViewSet,
    SuperAdminSystemLogListView,
    SuperAdminDashboardStatsView,
    SuperAdminOrganizationListView,
    SuperAdminAdvertisementViewSet,
    SuperAdminArchivedDonorViewSet,
    SuperAdminSupportTicketViewSet,
    SuperAdminContactMessageViewSet,
    SuperAdminExtendSubscriptionView, 
    SuperAdminOrganizationStatusUpdateView,
)

"""
System Router Configuration
Registers ViewSets for standard RESTful CRUD operations.
Namespaces are strictly segregated by actor roles (Tenant vs. SuperAdmin).
"""
router = DefaultRouter()

# Tenant (Organization) Routes
router.register(r'tenant/staff', TenantStaffViewSet, basename='tenant-staff')
router.register(r'tenant/donors', TenantDonorViewSet, basename='tenant-donor')
router.register(r'tenant/support-tickets', TenantSupportTicketViewSet, basename='tenant-support-tickets')

# SuperAdmin Routes
router.register(r'superadmin/ads', SuperAdminAdvertisementViewSet, basename='superadmin-ads')
router.register(r'superadmin/payments', SuperAdminPaymentViewSet, basename='superadmin-payments')
router.register(r'superadmin/messages', SuperAdminContactMessageViewSet, basename='superadmin-messages')
router.register(r'superadmin/archived-donors', SuperAdminArchivedDonorViewSet, basename='superadmin-archived-donors')
router.register(r'superadmin/support-tickets', SuperAdminSupportTicketViewSet, basename='superadmin-support-tickets')
router.register(r'superadmin/locations/countries', SuperAdminCountryViewSet, basename='superadmin-countries')
router.register(r'superadmin/locations/states', SuperAdminStateViewSet, basename='superadmin-states')
router.register(r'superadmin/locations/districts', SuperAdminDistrictViewSet, basename='superadmin-districts')


urlpatterns = [
    # ==========================================
    # SYSTEM ADMINISTRATION BOUNDARY
    # Endpoints restricted to 'SUPER_ADMIN' role.
    # ==========================================
    path('superadmin/logs/', SuperAdminSystemLogListView.as_view(), name='superadmin-logs'),
    path('superadmin/organizations/', SuperAdminOrganizationListView.as_view(), name='superadmin-org-list'),
    path('superadmin/dashboard-stats/', SuperAdminDashboardStatsView.as_view(), name='superadmin-dashboard-stats'),
    path('superadmin/organizations/<int:pk>/status/', SuperAdminOrganizationStatusUpdateView.as_view(), name='superadmin-org-status'),
    path('superadmin/organizations/<int:pk>/extend-subscription/', SuperAdminExtendSubscriptionView.as_view(), name='superadmin-extend-sub'),
    
    # ==========================================
    # AUTHENTICATION & IDENTITY
    # JWT issuance, invalidation, and credential recovery.
    # ==========================================
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/resend-otp/', ResendEmailOTPView.as_view(), name='resend_otp'),
    path('auth/verify-email/', VerifyEmailOTPView.as_view(), name='verify_email'),
    path('auth/register/', RegisterOrganizationView.as_view(), name='register-org'),
    path('auth/login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # ==========================================
    # MASTER DATA (UNAUTHENTICATED)
    # Read-only geographic hierarchies used for UI dropdowns.
    # ==========================================
    path('locations/states/', MasterStateListView.as_view(), name='state-list'),
    path('locations/countries/', MasterCountryListView.as_view(), name='country-list'),
    path('locations/districts/', MasterDistrictListView.as_view(), name='district-list'),

    # ==========================================
    # PUBLIC DIRECTORY BOUNDARY
    # Rate-limited endpoints for unauthenticated public traffic.
    # ==========================================
    path('public/advertisements/', ActiveAdvertisementView.as_view(), name='active-ads'),
    path('public/contact/', ContactMessageCreateView.as_view(), name='public-contact'),
    path('public/donors/search/', PublicDonorSearchView.as_view(), name='public-donor-search'),
    path('public/ads/<int:pk>/click/', AdClickRedirectView.as_view(), name='public-ad-click'),
    path('public/organizations/<slug:slug>/', PublicOrganizationDetailView.as_view(), name='public-org-detail'),

    # ==========================================
    # TENANT WORKSPACE BOUNDARY
    # Endpoints restricted to authenticated organization staff.
    # ==========================================
    path('tenant/billing/payments/', TenantPaymentView.as_view(), name='tenant-payments'),
    path('tenant/organization/', TenantOrganizationView.as_view(), name='tenant-organization'),
    path('tenant/dashboard-stats/', TenantDashboardStatsView.as_view(), name='tenant-dashboard-stats'),
    path('tenant/donors/bulk-upload/', TenantDonorBulkUploadView.as_view(), name='tenant-donor-bulk-upload'),
    
    # Mount generated router paths
    path('', include(router.urls)),
]