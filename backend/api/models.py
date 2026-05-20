from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta
from django.core.validators import RegexValidator

# ==========================================
# GLOBAL VALIDATORS
# ==========================================
phone_regex = RegexValidator(
    regex=r'^\+?1?\d{9,15}$',
    message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
)

# ==========================================
# 1. GEOGRAPHIC MASTER DATA (The "Locks")
# ==========================================

class MasterCountry(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=5, unique=True, help_text="e.g., IN, US")
    timezone_offset = models.CharField(max_length=50, default="UTC", help_text="e.g., Asia/Kolkata")
    is_whitelisted = models.BooleanField(default=False, help_text="SuperAdmin must enable this for registration")

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Master Countries"


class MasterState(models.Model):
    country = models.ForeignKey(MasterCountry, on_delete=models.CASCADE, related_name='states')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name}, {self.country.code}"


class MasterDistrict(models.Model):
    state = models.ForeignKey(MasterState, on_delete=models.CASCADE, related_name='districts')
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# ==========================================
# 2. CUSTOM USER (Handles Authentication & OTP)
# ==========================================

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('SUPER_ADMIN', 'Super Admin'),
        ('ORG_ADMIN', 'Organization Admin'),
        ('ORG_STAFF', 'Organization Staff'),
        ('PUBLIC_USER', 'Public User / Donor'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='PUBLIC_USER')
    phone_number = models.CharField(validators=[phone_regex], max_length=20, unique=True, null=True, blank=True)
    
    # Verification Flags (For OTP Step)
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    
    # The organization this user belongs to (Null for SuperAdmins and Public Users)
    organization = models.ForeignKey('Organization', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')

    def __str__(self):
        return self.email or self.username


# ==========================================
# 3. ORGANIZATION (The SaaS Tenant)
# ==========================================

class Organization(models.Model):
    ORG_TYPE_CHOICES = (
        ('HOSPITAL', 'Hospital'),
        ('BLOOD_BANK', 'Blood Bank'),
        ('NGO', 'NGO / Volunteer Group'),
        ('CLINIC', 'Private Clinic'),
    )
    
    PLAN_CHOICES = (
        ('FREE', 'Free (NGO)'),
        ('BASIC', 'Basic'),
        ('PREMIUM', 'Premium'),
    )
    
    STATUS_CHOICES = (
        ('PENDING', 'Pending SuperAdmin Approval'),
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
    )

    name = models.CharField(max_length=255)
    org_type = models.CharField(max_length=20, choices=ORG_TYPE_CHOICES)
    contact_email = models.EmailField(unique=True)
    contact_phone = models.CharField(validators=[phone_regex], max_length=20)
    description = models.TextField(blank=True, null=True)
    
    # Geographic Locking (Tenant is locked to these)
    country = models.ForeignKey(MasterCountry, on_delete=models.PROTECT)
    state = models.ForeignKey(MasterState, on_delete=models.PROTECT)
    district = models.ForeignKey(MasterDistrict, on_delete=models.PROTECT)
    address_line = models.TextField()

    # SaaS Management
    plan_tier = models.CharField(max_length=20, choices=PLAN_CHOICES, default='FREE')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_org_type_display()})"


# ==========================================
# 4. DONOR (Managed by Organizations)
# ==========================================

class Donor(models.Model):
    BLOOD_GROUP_CHOICES = (
        ('A+', 'A Positive'), ('A-', 'A Negative'),
        ('A1+', 'A1 Positive'), ('A1-', 'A1 Negative'),
        ('A1B+', 'A1B Positive'), ('A1B-', 'A1B Negative'),
        ('A2+', 'A2 Positive'), ('A2-', 'A2 Negative'),
        ('A2B+', 'A2B Positive'), ('A2B-', 'A2B Negative'),
        ('AB+', 'AB Positive'), ('AB-', 'AB Negative'),
        ('B+', 'B Positive'), ('B-', 'B Negative'),
        ('BBG', 'Bombay Blood Group'), ('INRA', 'INRA'),
        ('O+', 'O Positive'), ('O-', 'O Negative'),
    )
    
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )

    # Multi-Tenant Link: Which org owns this donor record?
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='donors')
    
    # Personal Info
    full_name = models.CharField(max_length=255)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    phone_number = models.CharField(validators=[phone_regex], max_length=20) 
    
    # Geographic Locking
    country = models.ForeignKey(MasterCountry, on_delete=models.PROTECT)
    state = models.ForeignKey(MasterState, on_delete=models.PROTECT)
    district = models.ForeignKey(MasterDistrict, on_delete=models.PROTECT)
    
    # Medical & Availability Tracking
    last_donation_date = models.DateField(null=True, blank=True)
    is_permanently_deferred = models.BooleanField(default=False)
    deferral_reason = models.TextField(blank=True, null=True, help_text="e.g., Medical condition, recent tattoo")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.blood_group})"

    @property
    def is_available_now(self):
        """
        Dynamically calculates if the donor is available based on:
        - Permanent deferral status
        - Gender specific wait times (Male: 90 days, Female: 120 days)
        """
        if self.is_permanently_deferred:
            return False
            
        if not self.last_donation_date:
            return True
            
        wait_days = 90 if self.gender == 'M' else 120
        next_eligible_date = self.last_donation_date + timedelta(days=wait_days)
        
        return timezone.now().date() >= next_eligible_date


# ==========================================
# 5. ADVERTISEMENT (Managed by Super Admin)
# ==========================================

class Advertisement(models.Model):
    title = models.CharField(max_length=255)
    image_url = models.URLField()
    target_link = models.URLField()
    
    # Geo-Targeting
    target_country = models.ForeignKey(MasterCountry, on_delete=models.CASCADE, related_name='ads')
    target_state = models.ForeignKey(MasterState, on_delete=models.CASCADE, null=True, blank=True, help_text="Leave blank to target whole country")
    
    is_active = models.BooleanField(default=True)
    clicks = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ad: {self.title} ({self.target_country.code})"


# ==========================================
# 6. SYSTEM LOGS (Super Admin Audit Trail)
# ==========================================

class SystemLog(models.Model):
    LEVEL_CHOICES = (
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('CRITICAL', 'Critical'),
    )
    
    timestamp = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='INFO')
    source = models.CharField(max_length=50) # e.g., 'SYSTEM', 'AUTH', 'BILLING'
    message = models.TextField()
    context = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"[{self.level}] {self.source} - {self.timestamp}"
    

# ==========================================
# 7. PUBLIC CONTACT MESSAGES
# ==========================================

class ContactMessage(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.subject} - {self.email}"