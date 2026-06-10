import pytest
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIClient
from model_bakery import baker
from django.urls import reverse
from api.models import CustomUser

@pytest.mark.django_db
class TestOTPVerification:
    def setup_method(self):
        self.client = APIClient()
        self.url = reverse('verify_email')
        self.user = baker.make(
            CustomUser, 
            email="test@hospital.com", 
            is_email_verified=False,
            email_verification_otp="123456",
            email_otp_expires_at=timezone.now() + timedelta(minutes=5)
        )

    def test_successful_otp_verification(self):
        # Added secure=True to bypass SSL redirects without decorators
        response = self.client.post(self.url, {"email": self.user.email, "otp": "123456"}, secure=True)
        
        assert response.status_code == 200
        self.user.refresh_from_db()
        assert self.user.is_email_verified is True
        assert self.user.email_verification_otp is None 

    def test_expired_otp_is_rejected(self):
        self.user.email_otp_expires_at = timezone.now() - timedelta(minutes=1)
        self.user.save()

        # Added secure=True
        response = self.client.post(self.url, {"email": self.user.email, "otp": "123456"}, secure=True)
        
        assert response.status_code == 400
        assert "expired" in response.data['error'].lower()
        
        self.user.refresh_from_db()
        assert self.user.is_email_verified is False