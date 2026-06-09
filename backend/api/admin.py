from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import (
    CustomUser, 
    Donor, 
    DonationRecord, 
    Organization, 
    Advertisement, 
    ContactMessage, 
    SystemLog,
    MasterCountry,
    MasterState,
    MasterDistrict,
    PaymentTransaction,
    TenantSupportTicket,
    TicketReply
)

# ==========================================
# GEOGRAPHIC MASTER DATA
# ==========================================

@admin.register(MasterCountry)
class MasterCountryAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'timezone_offset', 'is_whitelisted')
    search_fields = ('name', 'code')
    list_filter = ('is_whitelisted',)

@admin.register(MasterState)
class MasterStateAdmin(admin.ModelAdmin):
    list_display = ('name', 'country')
    search_fields = ('name', 'country__name')
    list_filter = ('country',)
    list_select_related = ('country',)

@admin.register(MasterDistrict)
class MasterDistrictAdmin(admin.ModelAdmin):
    list_display = ('name', 'state')
    search_fields = ('name', 'state__name')
    list_filter = ('state__country', 'state')
    list_select_related = ('state',)

# ==========================================
# SAAS TENANTS & USERS
# ==========================================

@admin.register(Organization)
class OrganizationAdmin(SimpleHistoryAdmin):
    list_display = ('name', 'org_type', 'contact_email', 'status', 'is_paid')
    search_fields = ('name', 'contact_email', 'slug')
    list_filter = ('status', 'org_type', 'is_paid', 'is_searchable')
    list_select_related = ('country', 'state', 'district')

@admin.register(CustomUser)
class CustomUserAdmin(SimpleHistoryAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_email_verified', 'is_2fa_enabled')
    search_fields = ('email', 'first_name', 'last_name', 'phone_number')
    list_filter = ('role', 'is_email_verified', 'is_2fa_enabled')
    list_select_related = ('organization',)

# ==========================================
# DONOR MANAGEMENT
# ==========================================

@admin.register(Donor)
class DonorAdmin(SimpleHistoryAdmin):
    list_display = ('full_name', 'blood_group', 'gender', 'organization', 'is_deleted')
    search_fields = ('full_name', 'phone_number')
    list_filter = ('blood_group', 'is_deleted', 'is_permanently_deferred')
    history_list_display = ["is_deleted", "is_permanently_deferred"] 
    list_select_related = ('organization', 'country', 'state', 'district')

@admin.register(DonationRecord)
class DonationRecordAdmin(SimpleHistoryAdmin):
    list_display = ('donor', 'donation_type', 'donation_date')
    search_fields = ('donor__full_name', 'clinical_notes')
    list_filter = ('donation_type', 'donation_date')
    list_select_related = ('donor', 'organization')

# ==========================================
# BILLING & SUBSCRIPTIONS
# ==========================================

@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('organization', 'amount', 'upi_reference', 'status', 'created_at')
    search_fields = ('organization__name', 'upi_reference')
    list_filter = ('status', 'created_at')
    list_select_related = ('organization', 'submitted_by')

# ==========================================
# SUPPORT TICKETS
# ==========================================

class TicketReplyInline(admin.TabularInline):
    model = TicketReply
    extra = 1

@admin.register(TenantSupportTicket)
class TenantSupportTicketAdmin(admin.ModelAdmin):
    list_display = ('subject', 'organization', 'status', 'created_by', 'created_at')
    search_fields = ('subject', 'organization__name', 'created_by__email')
    list_filter = ('status', 'created_at')
    list_select_related = ('organization', 'created_by')
    inlines = [TicketReplyInline]

@admin.register(TicketReply)
class TicketReplyAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'sender', 'created_at')
    search_fields = ('ticket__subject', 'sender__email', 'message')
    list_select_related = ('ticket', 'sender')

# ==========================================
# PUBLIC ASSETS & LOGS
# ==========================================

@admin.register(Advertisement)
class AdvertisementAdmin(SimpleHistoryAdmin):
    list_display = ('title', 'is_active', 'clicks', 'expires_at')
    search_fields = ('title', 'target_link')
    list_filter = ('is_active', 'created_at')

@admin.register(ContactMessage)
class ContactMessageAdmin(SimpleHistoryAdmin):
    list_display = ('name', 'email', 'subject', 'is_resolved', 'created_at')
    search_fields = ('name', 'email', 'subject')
    list_filter = ('is_resolved', 'created_at')

@admin.register(SystemLog)
class SystemLogAdmin(SimpleHistoryAdmin):
    list_display = ('timestamp', 'level', 'source', 'message')
    search_fields = ('source', 'message', 'context')
    list_filter = ('level', 'source', 'timestamp')