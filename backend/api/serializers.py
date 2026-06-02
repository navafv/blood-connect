from rest_framework import serializers
from django.utils import timezone
from .models import (
    ContactMessage, MasterCountry, MasterState, MasterDistrict,
    CustomUser, Organization, Donor, Advertisement, PaymentTransaction, SystemLog, TenantSupportTicket, TicketReply
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
# 2. USER SERIALIZER (With Password Hashing & OTP Security)
# ==========================================

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'password', 'role', 
            'phone_number', 'is_email_verified', 'is_phone_verified', 'organization'
        ]
        
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'read_only': True}, 
            'is_email_verified': {'read_only': True},
            'is_phone_verified': {'read_only': True},
            'organization': {'read_only': True} 
        }

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user


# ==========================================
# 3. ORGANIZATION SERIALIZER
# ==========================================

class OrganizationSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)
    has_active_subscription = serializers.ReadOnlyField()

    class Meta:
        model = Organization
        fields = [
            'id', 'slug', 'name', 'org_type', 'contact_email', 'contact_phone', 
            'description', 'country', 'country_name', 'state', 'state_name', 
            'district', 'district_name', 'address_line', 
            'banner_image', 'gallery_photo_1', 'gallery_photo_2',
            'is_paid', 'is_searchable', 'subscription_expires_at', 'has_active_subscription', 
            'status', 'created_at'
        ]
        read_only_fields = ['status', 'is_paid', 'subscription_expires_at', 'created_at']


# ==========================================
# 4. DONOR SERIALIZER (With Privacy Masking)
# ==========================================

class DonorSerializer(serializers.ModelSerializer):
    # This automatically grabs the output of the @property from your models.py
    is_available_now = serializers.ReadOnlyField()
    
    # We create a specific masked phone field for the public search endpoint
    masked_phone = serializers.SerializerMethodField()
    
    # Added country and state string representations for the React frontend
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
            'is_permanently_deferred', 'deferral_reason', 'is_available_now'
        ]
        # Prevent org staff from accidentally changing which org a donor belongs to
        read_only_fields = ['organization']

    def get_masked_phone(self, obj):
        """Returns the phone number with the last digits masked for public privacy"""
        if obj.phone_number and len(obj.phone_number) >= 10:
            # Mask format logic for public safety
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

class PublicDonorSearchSerializer(serializers.ModelSerializer):
    anonymous_label = serializers.SerializerMethodField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_contact = serializers.CharField(source='organization.contact_phone', read_only=True)
    country_name = serializers.CharField(source='country.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)
    is_available_now = serializers.ReadOnlyField()

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
        

# ==========================================
# 5. ADVERTISEMENT SERIALIZER
# ==========================================

class AdvertisementSerializer(serializers.ModelSerializer):
    is_expired = serializers.ReadOnlyField()

    class Meta:
        model = Advertisement
        fields = ['id', 'title', 'image', 'target_link', 'is_active', 'clicks', 'created_at', 'expires_at', 'is_expired']
        read_only_fields = ['clicks', 'created_at', 'expires_at', 'is_expired']


# ==========================================
# 6. SYSTEM LOG SERIALIZER (For Super Admin Dashboard)
# ==========================================
class SystemLogSerializer(serializers.ModelSerializer):
    # Format the timestamp nicely for the React frontend
    timestamp = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    
    class Meta:
        model = SystemLog
        fields = ['id', 'timestamp', 'level', 'source', 'message', 'context']


# ==========================================
# 7. CONTACT MESSAGE SERIALIZER (For Contact Us Form)
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