from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from .models import (
    ContactMessage, MasterCountry, MasterState, MasterDistrict,
    CustomUser, Organization, Donor, DonationRecord, Advertisement, 
    PaymentTransaction, SystemLog, TenantSupportTicket, TicketReply
)

# ==========================================
# 1. GEOGRAPHIC SERIALIZERS
# ==========================================

class MasterCountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterCountry
        fields = ['id', 'name', 'code', 'timezone_offset', 'is_whitelisted']

class MasterStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterState
        fields = ['id', 'name', 'country']

class MasterDistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterDistrict
        fields = ['id', 'name', 'state']


# ==========================================
# 2. USER SERIALIZER 
# ==========================================

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'password', 'role', 'phone_number', 'organization']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)


# ==========================================
# 3. ORGANIZATION SERIALIZER
# ==========================================

class OrganizationSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)
    has_active_subscription = serializers.ReadOnlyField()
    is_email_verified = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id', 'slug', 'name', 'org_type', 'contact_email', 'contact_phone', 
            'description', 'country', 'country_name', 'state', 'state_name', 
            'district', 'district_name', 'address_line', 'logo', 'banner_image',
            'is_paid', 'is_searchable', 'subscription_expires_at', 'has_active_subscription', 
            'status', 'created_at', 'is_email_verified'
        ]
        read_only_fields = ['status', 'is_paid', 'subscription_expires_at', 'created_at']

    def get_is_email_verified(self, obj):
        # Fetch the ORG_ADMIN for this organization to check their email verification status
        admin = CustomUser.objects.filter(organization=obj, role='ORG_ADMIN').first()
        return admin.is_email_verified if admin else False


# ==========================================
# 4. DONOR & DONATION SERIALIZERS
# ==========================================

class DonorSerializer(serializers.ModelSerializer):
    is_available_now = serializers.ReadOnlyField()
    
    last_donation_date = serializers.DateField(required=False, allow_null=True)
    
    masked_phone = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    country_name = serializers.CharField(source='country.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)

    class Meta:
        model = Donor
        fields = [
            'id', 'full_name', 'blood_group', 'gender', 'date_of_birth', 
            'phone_number', 'masked_phone', 'country', 'country_name', 
            'state', 'state_name', 'district', 'district_name',
            'organization', 'organization_name', 'last_donation_date', 
            'is_permanently_deferred', 'deferral_reason', 'is_available_now',
            'has_consented'
        ]
        read_only_fields = ['organization']

    def get_masked_phone(self, obj):
        if obj.phone_number and len(obj.phone_number) >= 10:
            return obj.phone_number[:6] + 'XXXX'
        return "INVALID/HIDDEN"
    
    def validate_date_of_birth(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def validate_last_donation_date(self, value):
        if value and value > timezone.now().date():
            raise serializers.ValidationError("Last donation date cannot be in the future.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        historical_donation = validated_data.pop('last_donation_date', None)
        donor = super().create(validated_data)
        
        if historical_donation:
            DonationRecord.objects.create(
                donor=donor,
                organization=donor.organization,
                donation_date=historical_donation,
                clinical_notes="Historical donation logged during registration/import."
            )
            
        return donor

    @transaction.atomic
    def update(self, instance, validated_data):
        historical_donation = validated_data.pop('last_donation_date', None)
        
        if historical_donation and instance.last_donation_date != historical_donation:
            DonationRecord.objects.create(
                donor=instance,
                organization=instance.organization,
                donation_date=historical_donation,
                clinical_notes="Historical donation added via profile update."
            )
            
        return super().update(instance, validated_data)

class PublicDonorSearchSerializer(serializers.ModelSerializer):
    anonymous_label = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_contact = serializers.CharField(source='organization.contact_phone', read_only=True)
    country_name = serializers.CharField(source='country.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)
    is_available_now = serializers.ReadOnlyField()
    last_donation_date = serializers.ReadOnlyField()

    class Meta:
        model = Donor
        fields = [
            'id', 'anonymous_label', 'blood_group', 'gender', 
            'organization_name', 'organization_contact',
            'country_name', 'state_name', 'district_name', 
            'last_donation_date', 'is_available_now'
        ]

    def get_anonymous_label(self, obj):
        return f"{obj.blood_group} Donor (ID: #{obj.id})"

class DonationRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationRecord
        fields = ['id', 'donor', 'organization', 'donation_type', 'donation_date', 'clinical_notes', 'created_at']
        read_only_fields = ['organization', 'created_at']

    def validate_donation_date(self, value):
        if value > timezone.now().date():
            raise serializers.ValidationError("Donation date cannot be in the future.")
        return value


# ==========================================
# 5. ADVERTISEMENT SERIALIZER
# ==========================================

class AdvertisementSerializer(serializers.ModelSerializer):
    is_expired = serializers.ReadOnlyField()

    class Meta:
        model = Advertisement
        fields = ['id', 'title', 'banner_image', 'portrait_image', 'target_link', 'is_active', 'clicks', 'views', 'created_at', 'expires_at', 'is_expired']
        read_only_fields = ['clicks', 'views', 'created_at', 'expires_at', 'is_expired']


# ==========================================
# 6. SYSTEM LOG SERIALIZER
# ==========================================
class SystemLogSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    
    class Meta:
        model = SystemLog
        fields = ['id', 'timestamp', 'level', 'source', 'message', 'context']


# ==========================================
# 7. CONTACT & SUPPORT SERIALIZERS
# ==========================================
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at', 'is_resolved']

class PaymentTransactionSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = '__all__'
        read_only_fields = ['organization', 'amount', 'status', 'submitted_by', 'verified_at']

class TicketReplySerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    is_superadmin = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketReply
        fields = '__all__'
        read_only_fields = ['ticket', 'sender']

    def get_is_superadmin(self, obj):
        return obj.sender.role == 'SUPER_ADMIN'

class TenantSupportTicketSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    replies = TicketReplySerializer(many=True, read_only=True)
    
    class Meta:
        model = TenantSupportTicket
        fields = '__all__'
        read_only_fields = ['organization', 'created_by', 'status']