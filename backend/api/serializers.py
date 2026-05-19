from rest_framework import serializers
from .models import (
    ContactMessage, MasterCountry, MasterState, MasterDistrict,
    CustomUser, Organization, Donor, Advertisement, SystemLog
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
        # FIX: Ensure verification statuses cannot be modified by user requests, 
        # only by the internal OTP verification endpoint/logic.
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'read_only': True}, 
            'is_email_verified': {'read_only': True},
            'is_phone_verified': {'read_only': True}
        }

    def create(self, validated_data):
        # We must use create_user() so Django securely hashes the password!
        user = CustomUser.objects.create_user(**validated_data)
        return user


# ==========================================
# 3. ORGANIZATION SERIALIZER
# ==========================================

class OrganizationSerializer(serializers.ModelSerializer):
    # These read-only fields let React display the actual names instead of just IDs
    country_name = serializers.CharField(source='country.name', read_only=True)
    state_name = serializers.CharField(source='state.name', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'org_type', 'contact_email', 'contact_phone', 
            'description', 'country', 'country_name', 'state', 'state_name', 
            'district', 'district_name', 'address_line', 'plan_tier', 
            'status', 'created_at'
        ]
        read_only_fields = ['plan_tier', 'status', 'created_at']


# ==========================================
# 4. DONOR SERIALIZER (With Privacy Masking)
# ==========================================

class DonorSerializer(serializers.ModelSerializer):
    # This automatically grabs the output of the @property from your models.py
    is_available_now = serializers.ReadOnlyField()
    
    # We create a specific masked phone field for the public search endpoint
    masked_phone = serializers.SerializerMethodField()
    
    # FIX: Added country and state string representations for the React frontend
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
        read_only_fields = ['organization', 'country', 'state', 'district']

    def get_masked_phone(self, obj):
        """Returns the phone number with the last digits masked for public privacy"""
        if obj.phone_number:
            # Mask format logic for public safety
            return obj.phone_number[:6] + 'XXX XXXXX'
        return None


# ==========================================
# 5. ADVERTISEMENT SERIALIZER
# ==========================================

class AdvertisementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Advertisement
        fields = [
            'id', 'title', 'image_url', 'target_link', 
            'target_country', 'target_state', 'is_active', 'clicks'
        ]


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
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at']