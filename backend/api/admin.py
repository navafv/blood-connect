from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import CustomUser, Donor, DonationRecord, Organization, Advertisement, ContactMessage, SystemLog

@admin.register(Donor)
class DonorAdmin(SimpleHistoryAdmin):
    list_display = ('full_name', 'blood_group', 'organization')
    search_fields = ('full_name', 'phone_number')
    history_list_display = ["status"] 
    list_select_related = ('organization', 'country', 'state', 'district')

@admin.register(DonationRecord)
class DonationRecordAdmin(SimpleHistoryAdmin):
    list_display = ('donor', 'donation_type', 'donation_date')
    list_select_related = ('donor', 'organization')

@admin.register(Organization)
class OrganizationAdmin(SimpleHistoryAdmin):
    list_display = ('name', 'org_type', 'contact_email')
    search_fields = ('name', 'contact_email')

@admin.register(CustomUser)
class CustomUserAdmin(SimpleHistoryAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role')
    search_fields = ('email', 'first_name', 'last_name')

@admin.register(Advertisement)
class AdvertisementAdmin(SimpleHistoryAdmin):
    list_display = ('title', 'is_active', 'created_at')
    search_fields = ('title', 'organization__name')
    list_filter = ('is_active', 'created_at')

@admin.register(ContactMessage)
class ContactMessageAdmin(SimpleHistoryAdmin):
    list_display = ('name', 'email', 'subject', 'created_at')
    search_fields = ('name', 'email', 'subject')
    list_filter = ('created_at',)

@admin.register(SystemLog)
class SystemLogAdmin(SimpleHistoryAdmin):
    list_display = ('timestamp', 'level', 'source', 'message')
    search_fields = ('source', 'message')
    list_filter = ('level', 'timestamp')