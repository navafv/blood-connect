from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import Donor, DonationRecord

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