import pytest
from django.test import override_settings
from rest_framework.test import APIClient
from model_bakery import baker
from django.urls import reverse
from api.models import Donor, Organization, CustomUser

@pytest.fixture
def api_client():
    return APIClient()

@pytest.mark.django_db
@override_settings(SECURE_SSL_REDIRECT=False)
class TestTenantIsolation:
    def setup_method(self):
        self.org_a = baker.make(Organization, name="Hospital A", status="ACTIVE")
        self.org_b = baker.make(Organization, name="Hospital B", status="ACTIVE")
        
        self.admin_a = baker.make(CustomUser, role="ORG_ADMIN", organization=self.org_a)
        
        self.donor_a = baker.make(Donor, organization=self.org_a, full_name="Donor A")
        self.donor_b = baker.make(Donor, organization=self.org_b, full_name="Donor B")

    def test_tenant_cannot_read_other_tenant_donors(self, api_client):
        api_client.force_authenticate(user=self.admin_a)
        
        url = reverse('tenant-donor-list')
        response = api_client.get(url)
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 1
        assert data[0]['full_name'] == "Donor A"

    def test_tenant_cannot_modify_other_tenant_donors(self, api_client):
        api_client.force_authenticate(user=self.admin_a)
        
        url = reverse('tenant-donor-detail', kwargs={'pk': self.donor_b.id})
        response = api_client.delete(url)
        
        assert response.status_code == 404