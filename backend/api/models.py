import uuid
from django.db import models
from django.utils import timezone
from django.db.models import Prefetch
from django.utils.text import slugify
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractUser, BaseUserManager
from simple_history.models import HistoricalRecords

# ==========================================
# GLOBAL VALIDATORS
# ==========================================
phone_regex = RegexValidator(
    regex=r'^\+?1?\d{9,15}$',
    message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
)

def validate_past_date(value):
    if value > timezone.now().date():
        raise ValidationError("This date cannot be in the future.")

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
        ordering = ['name']


class MasterState(models.Model):
    country = models.ForeignKey(MasterCountry, on_delete=models.CASCADE, related_name='states')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name}, {self.country.code}"
        
    class Meta:
        ordering = ['name']
        unique_together = ('country', 'name')


class MasterDistrict(models.Model):
    state = models.ForeignKey(MasterState, on_delete=models.CASCADE, related_name='districts')
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name
        
    class Meta:
        ordering = ['name']
        unique_together = ('state', 'name')


# ==========================================
# 2. ORGANIZATION (The SaaS Tenant)
# ==========================================

class Organization(models.Model):
    ORG_TYPE_CHOICES = (
        ('HOSPITAL', 'Hospital'),
        ('BLOOD_BANK', 'Blood Bank'),
        ('NGO', 'NGO / Volunteer Group'),
        ('CLINIC', 'Private Clinic'),
    )
    
    STATUS_CHOICES = (
        ('PENDING', 'Pending SuperAdmin Approval'),
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
    )

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=150, unique=True, null=True, blank=True, help_text="Custom URL handle for the public profile.")
    org_type = models.CharField(max_length=20, choices=ORG_TYPE_CHOICES)
    contact_email = models.EmailField(unique=True)
    contact_phone = models.CharField(validators=[phone_regex], max_length=20)
    description = models.TextField(blank=True, null=True)
    
    # Geographic Locking (Tenant is locked to these)
    country = models.ForeignKey(MasterCountry, on_delete=models.PROTECT)
    state = models.ForeignKey(MasterState, on_delete=models.PROTECT)
    district = models.ForeignKey(MasterDistrict, on_delete=models.PROTECT)
    address_line = models.TextField()

    # Mini-Website Image Fields
    logo = models.ImageField(upload_to='organization/logos/', blank=True, null=True, help_text="Square logo for dashboard & public profile")
    banner_image = models.ImageField(upload_to='organization/banners/', blank=True, null=True)

    # SaaS Management & Privacy
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    is_paid = models.BooleanField(default=False, help_text="True if the organization has an active paid subscription.")
    is_searchable = models.BooleanField(default=True, help_text="If False, this organization's donors are hidden from public search.", db_index=True)
    subscription_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def has_active_subscription(self):
        if not self.is_paid or not self.subscription_expires_at:
            return False
        return self.subscription_expires_at > timezone.now()
    
    def save(self, *args, **kwargs):
        # Auto-generate a slug if the organization doesn't have one yet
        if not self.slug:
            base_slug = slugify(self.name)
            unique_id = str(uuid.uuid4())[:6]
            self.slug = f"{base_slug}-{unique_id}"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_org_type_display()})"
    
    class Meta:
        indexes = [
            models.Index(fields=['status', 'is_searchable']),
        ]


# ==========================================
# 3. CUSTOM USER (Handles Authentication & OTP)
# ==========================================

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email address must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'SUPER_ADMIN') # Automatically grant SuperAdmin role
        extra_fields.setdefault('is_email_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('SUPER_ADMIN', 'Super Admin'),
        ('ORG_ADMIN', 'Organization Admin'),
        ('PUBLIC_USER', 'Public User / Donor'),
    )
    
    username = None
    email = models.EmailField(unique=True)
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='PUBLIC_USER')
    phone_number = models.CharField(validators=[phone_regex], max_length=20, unique=True, null=True, blank=True)
    
    # Verification Flags
    is_email_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)
    email_verification_otp = models.CharField(max_length=6, null=True, blank=True)
    email_otp_expires_at = models.DateTimeField(null=True, blank=True)

    is_2fa_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=255, blank=True, null=True)
    
    organization = models.ForeignKey('Organization', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if not self.phone_number:
            self.phone_number = None
        super().save(*args, **kwargs)


# ==========================================
# 4. DONOR (Managed by Organizations)
# ==========================================

class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        batch_size = 2000
        total_updated = 0
        pks = list(self.values_list('pk', flat=True))
        
        for i in range(0, len(pks), batch_size):
            batch_pks = pks[i:i + batch_size]
            updated = self.model.all_objects.filter(pk__in=batch_pks).update(
                is_deleted=True, 
                deleted_at=timezone.now()
            )
            total_updated += updated
            
        return total_updated

    def hard_delete(self):
        return super().delete()

    def get_for_tenant(self, organization):
        return self.filter(organization=organization)

    def with_availability_context(self):
        from .models import DonationRecord # Local import to prevent circularity
        latest_donation_prefetch = Prefetch(
            'donation_records',
            queryset=DonationRecord.objects.order_by('-donation_date'),
            to_attr='prefetched_latest_donation'
        )
        return self.prefetch_related(latest_donation_prefetch)

class ActiveDonorManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class AllDonorManager(models.Manager.from_queryset(SoftDeleteQuerySet)):
    pass

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

    # Multi-Tenant Link
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='donors')
    
    # Personal Info
    full_name = models.CharField(max_length=255)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, db_index=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField(validators=[validate_past_date])
    phone_number = models.CharField(validators=[phone_regex], max_length=20)
    
    # Geographic Locking
    country = models.ForeignKey(MasterCountry, on_delete=models.PROTECT, db_index=True)
    state = models.ForeignKey(MasterState, on_delete=models.PROTECT, db_index=True)
    district = models.ForeignKey(MasterDistrict, on_delete=models.PROTECT, db_index=True)
    
    # Medical & Availability Tracking
    is_permanently_deferred = models.BooleanField(default=False)
    deferral_reason = models.TextField(blank=True, null=True, help_text="e.g., Medical condition, recent tattoo")
    has_consented = models.BooleanField(default=False, help_text="Donor explicitly consented to data storage and contact.")
    
    # Soft Delete Fields
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Managers
    objects = ActiveDonorManager()
    all_objects = AllDonorManager()

    # History Tracking
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.full_name} ({self.blood_group})"

    def delete(self, *args, **kwargs):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)

    @property
    def latest_donation(self):
        if hasattr(self, 'prefetched_latest_donation'):
            return self.prefetched_latest_donation[0] if self.prefetched_latest_donation else None        
        all_records = self.donation_records.all()[:1]
        return all_records[0] if all_records else None

    @property
    def last_donation_date(self):
        latest = self.latest_donation
        return latest.donation_date if latest else None

    @property
    def is_available_now(self):
        if self.is_permanently_deferred:
            return False
            
        latest = self.latest_donation
        if not latest:
            return True # Never donated = available
            
        today = timezone.now().date()
        days_since_donation = (today - latest.donation_date).days
        if latest.donation_type == 'PLATELETS':
            return days_since_donation >= 14
        elif latest.donation_type == 'PLASMA':
            return days_since_donation >= 28
        else: # WHOLE_BLOOD
            cooldown_days = 90 if self.gender == 'M' else 120
            return days_since_donation >= cooldown_days
        
    class Meta:
        indexes = [
            models.Index(fields=['is_deleted']),
            models.Index(fields=['organization', 'is_deleted']),
            models.Index(fields=['blood_group', 'district', 'state']),
        ]


# =========================================
# 5. DONATION RECORD
# =========================================

class DonationRecord(models.Model):
    DONATION_TYPES = (
        ('WHOLE_BLOOD', 'Whole Blood (RBC)'),
        ('PLATELETS', 'Platelets (Apheresis)'),
        ('PLASMA', 'Plasma'),
    )
    
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE, related_name='donation_records')
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    
    donation_type = models.CharField(max_length=20, choices=DONATION_TYPES, default='WHOLE_BLOOD')
    donation_date = models.DateField(default=timezone.now)
    clinical_notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    history = HistoricalRecords()

    class Meta:
        ordering = ['-donation_date', '-created_at'] # Most recent first

    def __str__(self):
        return f"{self.donor.full_name} - {self.get_donation_type_display()} on {self.donation_date}"


# ==========================================
# 6. ADVERTISEMENT (Managed by Super Admin)
# ==========================================

class Advertisement(models.Model):
    title = models.CharField(max_length=255)
    image = models.ImageField(upload_to='advertisements/', help_text="Upload the banner image")
    target_link = models.URLField()
    
    is_active = models.BooleanField(default=True)
    clicks = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return self.title
        
    @property
    def is_expired(self):
        return self.expires_at < timezone.now()


# ==========================================
# 7. SYSTEM LOGS (Super Admin Audit Trail)
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
# 8. PUBLIC CONTACT MESSAGES
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
    

# ==========================================
# 9. SUBSCRIPTION & UPI PAYMENTS
# ==========================================

class PaymentTransaction(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Verification'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected / Invalid UTR'),
    )
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=999.00)
    upi_reference = models.CharField(max_length=100, help_text="UTR / Reference Number from UPI App")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    submitted_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='submitted_payments')
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.organization.name} - ₹{self.amount} ({self.status})"


# ==========================================
# 10. TENANT DASHBOARD SUPPORT TICKETS
# ==========================================

class TenantSupportTicket(models.Model):
    STATUS_CHOICES = (
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
    )
    
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='support_tickets')
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.status}] {self.subject} - {self.organization.name}"

class TicketReply(models.Model):
    ticket = models.ForeignKey(TenantSupportTicket, on_delete=models.CASCADE, related_name='replies')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)