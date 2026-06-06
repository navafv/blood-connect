import random
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import (
    MasterCountry, MasterState, MasterDistrict, CustomUser, 
    Organization, Donor, PaymentTransaction, DonationRecord # <-- Added DonationRecord
)

class Command(BaseCommand):
    help = 'Seeds the database with a SuperAdmin, an Organization, and 250 Mock Donors spanning over 2 years of history.'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Clearing old test data..."))
        
        # Clear data in reverse dependency order
        PaymentTransaction.objects.all().delete()
        DonationRecord.objects.all().delete()
        
        Donor.all_objects.all().hard_delete()
        CustomUser.objects.all().delete()
        Organization.objects.all().delete()

        # 1. Geographic Setup
        self.stdout.write("Setting up Geographic Data...")
        country, _ = MasterCountry.objects.get_or_create(name="India", code="IN", timezone_offset="Asia/Kolkata", is_whitelisted=True)
        state, _ = MasterState.objects.get_or_create(name="Kerala", country=country)
        
        districts = {
            "Kannur": MasterDistrict.objects.get_or_create(name="Kannur", state=state)[0],
            "Kozhikode": MasterDistrict.objects.get_or_create(name="Kozhikode", state=state)[0],
            "Wayanad": MasterDistrict.objects.get_or_create(name="Wayanad", state=state)[0],
            "Ernakulam": MasterDistrict.objects.get_or_create(name="Ernakulam", state=state)[0]
        }

        # 2. Super Admin Setup
        self.stdout.write("Creating Super Admin...")
        CustomUser.objects.create_superuser(
            username="admin@bloodconnect.com",
            email="admin@bloodconnect.com",
            password="adminpassword123",
            role="SUPER_ADMIN",
            is_email_verified=True
        )

        # 3. Organization Setup
        self.stdout.write("Creating Hospital Organization...")
        org = Organization.objects.create(
            name="City General Hospital",
            org_type="HOSPITAL",
            contact_email="contact@citygeneral.com",
            contact_phone="+919876543210",
            country=country,
            state=state,
            district=districts["Kannur"],
            address_line="Main Road, Healthcare District",
            status="ACTIVE",
            is_paid=True,
            is_searchable=True,
            subscription_expires_at=timezone.now() + timedelta(days=365)
        )

        # 4. Org Admin Setup
        self.stdout.write("Creating Organization Admin...")
        org_admin = CustomUser.objects.create_user(
            username="staff@citygeneral.com",
            email="staff@citygeneral.com",
            password="staffpassword123",
            role="ORG_ADMIN",
            organization=org,
            is_email_verified=True,
            first_name="Dr. Sarah"
        )

        # 5. Mock Payment History (For the billing tab)
        self.stdout.write("Generating Payment History...")
        PaymentTransaction.objects.create(
            organization=org,
            amount=999.00,
            upi_reference="UPI987654321012",
            status="APPROVED",
            submitted_by=org_admin,
            verified_at=timezone.now() - timedelta(days=5)
        )

        # 6. Populate Donors with 2+ Years of History
        self.stdout.write("Generating 250 Historical Donors (Spanning 800 days)...")
        blood_groups = [bg[0] for bg in Donor.BLOOD_GROUP_CHOICES] if hasattr(Donor, 'BLOOD_GROUP_CHOICES') else ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
        first_names = ["Rahul", "Aisha", "Mohammed", "Priya", "Arjun", "Kavya", "Sanjay", "Anjali", "Vishnu", "Meera", "David", "Fatima", "Rohan"]
        last_names = ["Nair", "Menon", "Kumar", "V", "Pillai", "Das", "Joseph", "George", "Iyer", "Rahman"]
        
        donors_to_create = []
        historical_timestamps = []
        now = timezone.now()
        today = now.date()

        for i in range(250):
            days_since_registered = random.randint(0, 800)
            registered_at = now - timedelta(days=days_since_registered)
            assigned_district = random.choice(list(districts.values()))

            # Create the donor WITHOUT last_donation_date
            donor = Donor(
                organization=org,
                full_name=f"{random.choice(first_names)} {random.choice(last_names)}",
                blood_group=random.choice(blood_groups),
                gender=random.choice(['M', 'F']),
                date_of_birth=today - timedelta(days=random.randint(6570, 18250)), # 18 to 50 years old
                phone_number=f"+9180{random.randint(10000000, 99999999)}",
                country=country,
                state=state,
                district=assigned_district,
                is_permanently_deferred=random.random() < 0.05,
                has_consented=True
            )
            
            donors_to_create.append(donor)
            historical_timestamps.append(registered_at)

        # Bulk create the Donors
        Donor.objects.bulk_create(donors_to_create)

        # 7. Force overwrite created_at timestamps & Generate Clinical Ledger
        self.stdout.write("Applying historical timeline and clinical ledgers...")
        
        saved_donors = Donor.objects.filter(organization=org).order_by('id')
        donation_records_to_create = []

        for donor, registered_at in zip(saved_donors, historical_timestamps):
            # Bypass auto_now_add to set the true historical registration date
            Donor.objects.filter(id=donor.id).update(created_at=registered_at)

            # 70% chance of having donated previously
            if random.random() < 0.70:
                days_since_registered = (now - registered_at).days
                if days_since_registered >= 0:
                    days_since_donation = random.randint(0, days_since_registered)
                    last_donation_date = (now - timedelta(days=days_since_donation)).date()
                    
                    # Weighted randomness: mostly whole blood, some platelets/plasma
                    donation_type = random.choices(
                        ['WHOLE_BLOOD', 'PLATELETS', 'PLASMA'], 
                        weights=[0.80, 0.15, 0.05]
                    )[0]

                    donation_records_to_create.append(
                        DonationRecord(
                            donor=donor,
                            organization=org,
                            donation_type=donation_type,
                            donation_date=last_donation_date,
                            clinical_notes="Seeded historical record."
                        )
                    )

        # Bulk create the clinical history
        DonationRecord.objects.bulk_create(donation_records_to_create)

        self.stdout.write(self.style.SUCCESS("-" * 50))
        self.stdout.write(self.style.SUCCESS(f"✅ Database seeded successfully with {len(saved_donors)} Donors and {len(donation_records_to_create)} Clinical Records!"))
        self.stdout.write(self.style.SUCCESS("SuperAdmin Login : admin@bloodconnect.com / adminpassword123"))
        self.stdout.write(self.style.SUCCESS("Hospital Login   : staff@citygeneral.com / staffpassword123"))
        self.stdout.write(self.style.SUCCESS("-" * 50))