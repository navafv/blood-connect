from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from .models import Donor, Organization, DonationRecord, MasterCountry, MasterState, MasterDistrict

class TestDonorAvailability(TestCase):
    def setUp(self):
        # 1. Create mock geographic data
        self.country = MasterCountry.objects.create(name="Test Country")
        self.state = MasterState.objects.create(name="Test State", country=self.country)
        self.district = MasterDistrict.objects.create(name="Test District", state=self.state)

        # 2. Assign them to the organization
        self.org = Organization.objects.create(
            name="Test Hospital", 
            org_type="HOSPITAL", 
            contact_email="test@hospital.com",
            country=self.country,
            state=self.state,
            district=self.district,
            address_line="123 Test St"
        )

        self.base_donor = {
            "organization": self.org,
            "country": self.country,
            "state": self.state,
            "district": self.district,
            "full_name": "Test Donor",
            "phone_number": "+1234567890",
            "date_of_birth": "1990-01-01",
            "blood_group": "A+",
        }

    def test_never_donated_is_available(self):
        donor = Donor.objects.create(**self.base_donor, gender='M')
        self.assertTrue(donor.is_available_now, "A donor with no history should be available.")

    def test_permanently_deferred_is_not_available(self):
        donor = Donor.objects.create(**self.base_donor, gender='M', is_permanently_deferred=True)
        self.assertFalse(donor.is_available_now, "Deferred donors must never be available.")

    def test_whole_blood_male_cooldown(self):
        donor = Donor.objects.create(**self.base_donor, gender='M')
        DonationRecord.objects.create(
            donor=donor, donation_type='WHOLE_BLOOD', 
            donation_date=timezone.now().date() - timedelta(days=89)
        )
        self.assertFalse(donor.is_available_now, "Male WB donor should NOT be available at 89 days.")

        record = donor.donation_records.first()
        record.donation_date = timezone.now().date() - timedelta(days=90)
        record.save()
        self.assertTrue(donor.is_available_now, "Male WB donor SHOULD be available at 90 days.")

    def test_whole_blood_female_cooldown(self):
        donor = Donor.objects.create(**self.base_donor, gender='F')
        DonationRecord.objects.create(
            donor=donor, donation_type='WHOLE_BLOOD', 
            donation_date=timezone.now().date() - timedelta(days=119)
        )
        self.assertFalse(donor.is_available_now, "Female WB donor should NOT be available at 119 days.")

        record = donor.donation_records.first()
        record.donation_date = timezone.now().date() - timedelta(days=120)
        record.save()
        self.assertTrue(donor.is_available_now, "Female WB donor SHOULD be available at 120 days.")

    def test_platelet_apheresis_cooldown(self):
        donor = Donor.objects.create(**self.base_donor, gender='M')
        DonationRecord.objects.create(
            donor=donor, donation_type='PLATELETS', 
            donation_date=timezone.now().date() - timedelta(days=13)
        )
        self.assertFalse(donor.is_available_now, "Platelet donor should NOT be available at 13 days.")

        record = donor.donation_records.first()
        record.donation_date = timezone.now().date() - timedelta(days=14)
        record.save()
        self.assertTrue(donor.is_available_now, "Platelet donor SHOULD be available at 14 days.")


from .serializers import PublicDonorSearchSerializer

class TestPublicDonorSearchSerializer(TestCase):
    def setUp(self):
        self.country = MasterCountry.objects.create(name="Test Country")
        self.state = MasterState.objects.create(name="Test State", country=self.country)
        self.district = MasterDistrict.objects.create(name="Test District", state=self.state)

        self.org = Organization.objects.create(
            name="City Blood Bank", 
            org_type="BLOOD_BANK", 
            contact_email="contact@cityblood.com",
            country=self.country,
            state=self.state,
            district=self.district,
            address_line="123 Test St"
        )
        
        self.donor = Donor.objects.create(
            organization=self.org,
            country=self.country,
            state=self.state,
            district=self.district,
            full_name="John Doe Secret",
            phone_number="+9999999999",
            date_of_birth="1985-05-15",
            gender="M",
            blood_group="O-"
        )

    def test_serializer_strips_personally_identifiable_information(self):
        serializer = PublicDonorSearchSerializer(self.donor)
        data = serializer.data
        self.assertNotIn('full_name', data, "CRITICAL PRIVACY LEAK: full_name is exposed!")
        self.assertNotIn('phone_number', data, "CRITICAL PRIVACY LEAK: phone_number is exposed!")
        self.assertNotIn('date_of_birth', data, "CRITICAL PRIVACY LEAK: date_of_birth is exposed!")
        for key, value in data.items():
            self.assertNotEqual(value, "John Doe Secret", f"Leak found in field {key}")
            self.assertNotEqual(value, "+9999999999", f"Leak found in field {key}")

    def test_serializer_generates_correct_anonymous_label(self):
        serializer = PublicDonorSearchSerializer(self.donor)
        data = serializer.data
        expected_label = f"O- Donor (ID: #{self.donor.id})"
        self.assertEqual(data['anonymous_label'], expected_label)

    def test_serializer_returns_proxy_organization_contact(self):
        serializer = PublicDonorSearchSerializer(self.donor)
        data = serializer.data
        self.assertEqual(data['organization_name'], "City Blood Bank")