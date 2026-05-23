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
    email_verification_otp = models.CharField(max_length=6, null=True, blank=True)
    email_otp_expires_at = models.DateTimeField(null=True, blank=True)
    
    # The organization this user belongs to (Null for SuperAdmins and Public Users)
    organization = models.ForeignKey('Organization', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')

    def __str__(self):
        return self.email or self.username

    def save(self, *args, **kwargs):
        """
        If the phone_number is submitted as an empty string (""), 
        we forcefully convert it to Python's None (SQL NULL).
        This ensures multiple users without phone numbers don't violate the unique=True constraint.
        """
        if not self.phone_number:
            self.phone_number = None
            
        super().save(*args, **kwargs)


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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    is_paid = models.BooleanField(default=False, help_text="True if the organization has an active paid subscription.")
    subscription_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def has_active_subscription(self):
        if not self.is_paid or not self.subscription_expires_at:
            return False
        return self.subscription_expires_at > timezone.now()

    def __str__(self):
        return f"{self.name} ({self.get_org_type_display()})"


# ==========================================
# 4. DONOR (Managed by Organizations)
# ==========================================

class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        """
        Intercepts bulk deletions (e.g., Donor.objects.filter(...).delete())
        and executes a bulk SQL UPDATE instead.
        """
        return super().update(is_deleted=True, deleted_at=timezone.now())

class ActiveDonorManager(models.Manager):
    def get_queryset(self):
        # Return our custom QuerySet, filtering out soft-deleted records
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

class AllDonorManager(models.Manager):
    def get_queryset(self):
        # Return our custom QuerySet, but include EVERYTHING (even deleted ones)
        # This allows SuperAdmins to view deleted records or undelete them.
        return SoftDeleteQuerySet(self.model, using=self._db)

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
    has_consented = models.BooleanField(default=False, help_text="Donor explicitly consented to data storage and contact.")
    
    # Soft Delete Fields
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Managers
    objects = ActiveDonorManager()  # Default manager (hides deleted)
    all_objects = AllDonorManager() # Admin manager (shows everything, but bulk deletes still soft-delete)

    def __str__(self):
        return f"{self.full_name} ({self.blood_group})"

    def delete(self, *args, **kwargs):
        """
        Soft-delete the single instance instead of removing it from the database.
        Required for medical audit compliance (HIPAA).
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def hard_delete(self, *args, **kwargs):
        """
        Only used if a SuperAdmin legitimately needs to permanently purge a record.
        """
        super().delete(*args, **kwargs)

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
    

# ==========================================
# 8. SUBSCRIPTION & UPI PAYMENTS
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
# 9. TENANT DASHBOARD SUPPORT TICKETS
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