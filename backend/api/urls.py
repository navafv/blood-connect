from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ActiveAdvertisementView, AdClickRedirectView, AdViewTrackingView, CookieTokenObtainPairView, 
    CookieTokenRefreshView, ContactMessageCreateView, CurrentUserView, LogDonationView, LogoutView, 
    MasterCountryListView, MasterDistrictListView, MasterStateListView, PasswordResetConfirmView, 
    PasswordResetRequestView, PublicDonorSearchView, PublicHeroContentView, PublicOrganizationDetailView, 
    RegisterOrganizationView, ResendEmailOTPView, SecuritySettingsView, Setup2FAView, 
    SuperAdminAdvertisementViewSet, SuperAdminArchivedDonorViewSet, SuperAdminContactMessageViewSet, 
    SuperAdminCountryViewSet, SuperAdminDashboardStatsView, SuperAdminDistrictViewSet, 
    SuperAdminExtendSubscriptionView, SuperAdminHeroImageViewSet, SuperAdminImpersonateTenantView, 
    SuperAdminOrganizationDetailView, SuperAdminOrganizationDonorsView, SuperAdminOrganizationListView, 
    SuperAdminOrganizationStatusUpdateView, SuperAdminPaymentViewSet, SuperAdminStateViewSet, 
    SuperAdminSupportTicketViewSet, SuperAdminSystemLogListView, SystemCronWebhookView, TenantDashboardStatsView, 
    TenantDonorBulkUploadView, TenantDonorViewSet, TenantOrganizationView, TenantPaymentView, 
    TenantSupportTicketViewSet, TenantSystemLogListView, Toggle2FAView, Verify2FALoginView, VerifyEmailOTPView
)

router = DefaultRouter()
router.register(r'tenant/donors', TenantDonorViewSet, basename='tenant-donor')
router.register(r'tenant/support-tickets', TenantSupportTicketViewSet, basename='tenant-support-tickets')
router.register(r'superadmin/ads', SuperAdminAdvertisementViewSet, basename='superadmin-ads')
router.register(r'superadmin/payments', SuperAdminPaymentViewSet, basename='superadmin-payments')
router.register(r'superadmin/locations/states', SuperAdminStateViewSet, basename='superadmin-states')
router.register(r'superadmin/messages', SuperAdminContactMessageViewSet, basename='superadmin-messages')
router.register(r'superadmin/hero-images', SuperAdminHeroImageViewSet, basename='superadmin-hero-images')
router.register(r'superadmin/locations/countries', SuperAdminCountryViewSet, basename='superadmin-countries')
router.register(r'superadmin/locations/districts', SuperAdminDistrictViewSet, basename='superadmin-districts')
router.register(r'superadmin/archived-donors', SuperAdminArchivedDonorViewSet, basename='superadmin-archived-donors')
router.register(r'superadmin/support-tickets', SuperAdminSupportTicketViewSet, basename='superadmin-support-tickets')

urlpatterns = [
    # System Administration Boundary
    path('superadmin/logs/', SuperAdminSystemLogListView.as_view(), name='superadmin-logs'),
    path('superadmin/system/cron-webhook/', SystemCronWebhookView.as_view(), name='system-cron-webhook'),
    path('superadmin/organizations/', SuperAdminOrganizationListView.as_view(), name='superadmin-org-list'),
    path('superadmin/dashboard-stats/', SuperAdminDashboardStatsView.as_view(), name='superadmin-dashboard-stats'),
    path('superadmin/organizations/<int:pk>/', SuperAdminOrganizationDetailView.as_view(), name='superadmin-org-detail'),
    path('superadmin/organizations/<int:pk>/donors/', SuperAdminOrganizationDonorsView.as_view(), name='superadmin-org-donors'),
    path('superadmin/organizations/<int:pk>/impersonate/', SuperAdminImpersonateTenantView.as_view(), name='superadmin-impersonate'),
    path('superadmin/organizations/<int:pk>/status/', SuperAdminOrganizationStatusUpdateView.as_view(), name='superadmin-org-status'),
    path('superadmin/organizations/<int:pk>/extend-subscription/', SuperAdminExtendSubscriptionView.as_view(), name='superadmin-extend-sub'),
    
    # Authentication & Identity
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('auth/2fa/setup/', Setup2FAView.as_view(), name='2fa-setup'),
    path('auth/2fa/toggle/', Toggle2FAView.as_view(), name='2fa-toggle'),
    path('auth/login/2fa/', Verify2FALoginView.as_view(), name='login-2fa'),
    path('auth/resend-otp/', ResendEmailOTPView.as_view(), name='resend_otp'),
    path('auth/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/verify-email/', VerifyEmailOTPView.as_view(), name='verify_email'),
    path('auth/register/', RegisterOrganizationView.as_view(), name='register-org'),
    path('auth/security/', SecuritySettingsView.as_view(), name='security-settings'),
    path('auth/login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # Master Data
    path('locations/states/', MasterStateListView.as_view(), name='state-list'),
    path('locations/countries/', MasterCountryListView.as_view(), name='country-list'),
    path('locations/districts/', MasterDistrictListView.as_view(), name='district-list'),

    # Public Directory Boundary
    path('public/contact/', ContactMessageCreateView.as_view(), name='public-contact'),
    path('public/advertisements/', ActiveAdvertisementView.as_view(), name='active-ads'),
    path('public/hero-content/', PublicHeroContentView.as_view(), name='public-hero-content'),
    path('public/ads/<int:pk>/click/', AdClickRedirectView.as_view(), name='public-ad-click'),
    path('public/ads/<int:pk>/view/', AdViewTrackingView.as_view(), name='public-ad-view'),
    path('public/donors/search/', PublicDonorSearchView.as_view(), name='public-donor-search'),
    path('public/organizations/<slug:slug>/', PublicOrganizationDetailView.as_view(), name='public-org-detail'),

    # Tenant Workspace Boundary
    path('tenant/billing/payments/', TenantPaymentView.as_view(), name='tenant-payments'),
    path('tenant/organization/', TenantOrganizationView.as_view(), name='tenant-organization'),
    path('tenant/dashboard-stats/', TenantDashboardStatsView.as_view(), name='tenant-dashboard-stats'),
    path('tenant/audit-logs/', TenantSystemLogListView.as_view(), name='tenant-audit-logs'),
    path('tenant/donors/<int:donor_id>/log-donation/', LogDonationView.as_view(), name='log-donation'),
    path('tenant/donors/bulk-upload/', TenantDonorBulkUploadView.as_view(), name='tenant-donor-bulk-upload'),
    
    path('', include(router.urls)),
]