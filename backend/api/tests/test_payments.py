import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from model_bakery import baker
from django.urls import reverse
from api.models import PaymentTransaction, Organization, CustomUser

@pytest.mark.django_db
class TestPaymentStateMachine:
    def setup_method(self):
        self.client = APIClient()
        self.superadmin = baker.make(CustomUser, role="SUPER_ADMIN")
        
        # Explicit name limits string length, preventing the database crash
        self.org = baker.make(
            Organization, 
            name="Test Organization",
            is_paid=False, 
            subscription_expires_at=timezone.now()
        )
        self.payment = baker.make(
            PaymentTransaction, 
            organization=self.org, 
            status="PENDING",
            amount=999.00
        )

    def test_superadmin_approval_extends_subscription(self):
        self.client.force_authenticate(user=self.superadmin)
        url = reverse('superadmin-payments-verify', kwargs={'pk': self.payment.id})
        
        # Added secure=True
        response = self.client.post(url, {"action": "APPROVE"}, secure=True)
        
        assert response.status_code == 200
        
        self.payment.refresh_from_db()
        self.org.refresh_from_db()
        
        assert self.payment.status == "APPROVED"
        assert self.payment.verified_at is not None
        assert self.org.is_paid is True
        
        days_remaining = (self.org.subscription_expires_at - timezone.now()).days
        assert 364 <= days_remaining <= 366