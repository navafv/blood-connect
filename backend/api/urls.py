from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LogoutView,
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
    TenantPaymentView, 
    TenantStaffViewSet,
    TenantDonorViewSet,
    TenantOrganizationView,
    TenantDashboardStatsView,
    TenantDonorBulkUploadView,
    TenantSupportTicketViewSet,
    SuperAdminPaymentViewSet, 
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

router = DefaultRouter()
router.register(r'tenant/staff', TenantStaffViewSet, basename='tenant-staff')
router.register(r'tenant/donors', TenantDonorViewSet, basename='tenant-donor')
router.register(r'tenant/support-tickets', TenantSupportTicketViewSet, basename='tenant-support-tickets')
router.register(r'superadmin/ads', SuperAdminAdvertisementViewSet, basename='superadmin-ads')
router.register(r'superadmin/payments', SuperAdminPaymentViewSet, basename='superadmin-payments')
router.register(r'superadmin/messages', SuperAdminContactMessageViewSet, basename='superadmin-messages')
router.register(r'superadmin/archived-donors', SuperAdminArchivedDonorViewSet, basename='superadmin-archived-donors')
router.register(r'superadmin/support-tickets', SuperAdminSupportTicketViewSet, basename='superadmin-support-tickets')

urlpatterns = [
    # ==========================================
    # SUPER ADMIN ENDPOINTS
    # ==========================================
    path('superadmin/logs/', SuperAdminSystemLogListView.as_view(), name='superadmin-logs'),
    path('superadmin/organizations/', SuperAdminOrganizationListView.as_view(), name='superadmin-org-list'),
    path('superadmin/dashboard-stats/', SuperAdminDashboardStatsView.as_view(), name='superadmin-dashboard-stats'),
    path('superadmin/organizations/<int:pk>/status/', SuperAdminOrganizationStatusUpdateView.as_view(), name='superadmin-org-status'),
    path('superadmin/organizations/<int:pk>/extend-subscription/', SuperAdminExtendSubscriptionView.as_view(), name='superadmin-extend-sub'),
    
    # ==========================================
    # AUTHENTICATION ENDPOINTS (For React Login/Register)
    # ==========================================
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterOrganizationView.as_view(), name='register-org'),
    path('auth/login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # ==========================================
    # GEOGRAPHIC DROPDOWN ENDPOINTS
    # ==========================================
    path('locations/states/', MasterStateListView.as_view(), name='state-list'),
    path('locations/countries/', MasterCountryListView.as_view(), name='country-list'),
    path('locations/districts/', MasterDistrictListView.as_view(), name='district-list'),

    # ==========================================
    # PUBLIC FACING ENDPOINTS
    # ==========================================
    path('advertisements/', ActiveAdvertisementView.as_view(), name='active-ads'),
    path('public/contact/', ContactMessageCreateView.as_view(), name='public-contact'),
    path('donors/search/', PublicDonorSearchView.as_view(), name='public-donor-search'),
    path('public/ads/<int:pk>/click/', AdClickRedirectView.as_view(), name='public-ad-click'),

    # ==========================================
    # TENANT ENDPOINTS
    # ==========================================
    path('tenant/billing/payments/', TenantPaymentView.as_view(), name='tenant-payments'),
    path('tenant/organization/', TenantOrganizationView.as_view(), name='tenant-organization'),
    path('tenant/dashboard-stats/', TenantDashboardStatsView.as_view(), name='tenant-dashboard-stats'),
    path('tenant/donors/bulk-upload/', TenantDonorBulkUploadView.as_view(), name='tenant-donor-bulk-upload'),
    path('', include(router.urls)),
]