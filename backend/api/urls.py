from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    ContactMessageCreateView,
    MasterCountryListView,
    MasterStateListView,
    MasterDistrictListView,
    PublicDonorSearchView,
    RegisterOrganizationView,
    SuperAdminSystemLogListView,
    TenantDonorViewSet,
    ActiveAdvertisementView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    SuperAdminOrganizationListView,
    SuperAdminOrganizationStatusUpdateView,
    SuperAdminDashboardStatsView,
    TenantDashboardStatsView,
    TenantBillingUpdateView,
    TenantOrganizationView,
    TenantStaffViewSet,
    TenantDonorBulkUploadView,
)

router = DefaultRouter()
router.register(r'tenant/donors', TenantDonorViewSet, basename='tenant-donor')
router.register(r'tenant/staff', TenantStaffViewSet, basename='tenant-staff')

urlpatterns = [
    # ==========================================
    # SUPER ADMIN ENDPOINTS
    # ==========================================
    path('superadmin/dashboard-stats/', SuperAdminDashboardStatsView.as_view(), name='superadmin-dashboard-stats'),
    path('superadmin/organizations/', SuperAdminOrganizationListView.as_view(), name='superadmin-org-list'),
    path('superadmin/organizations/<int:pk>/status/', SuperAdminOrganizationStatusUpdateView.as_view(), name='superadmin-org-status'),
    path('superadmin/logs/', SuperAdminSystemLogListView.as_view(), name='superadmin-logs'),
    
    # ==========================================
    # AUTHENTICATION ENDPOINTS (For React Login/Register)
    # ==========================================
    path('auth/register/', RegisterOrganizationView.as_view(), name='register-org'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # ==========================================
    # GEOGRAPHIC DROPDOWN ENDPOINTS
    # ==========================================
    path('locations/countries/', MasterCountryListView.as_view(), name='country-list'),
    path('locations/states/', MasterStateListView.as_view(), name='state-list'),
    path('locations/districts/', MasterDistrictListView.as_view(), name='district-list'),

    # ==========================================
    # PUBLIC FACING ENDPOINTS
    # ==========================================
    path('donors/search/', PublicDonorSearchView.as_view(), name='public-donor-search'),
    path('advertisements/', ActiveAdvertisementView.as_view(), name='active-ads'),
    path('public/contact/', ContactMessageCreateView.as_view(), name='public-contact'),

    # ==========================================
    # TENANT ENDPOINTS
    # ==========================================
    path('tenant/organization/', TenantOrganizationView.as_view(), name='tenant-organization'),
    path('tenant/dashboard-stats/', TenantDashboardStatsView.as_view(), name='tenant-dashboard-stats'),
    path('tenant/billing/plan/', TenantBillingUpdateView.as_view(), name='tenant-billing-plan'),
    path('tenant/donors/bulk-upload/', TenantDonorBulkUploadView.as_view(), name='tenant-donor-bulk-upload'),
    path('', include(router.urls)),
]