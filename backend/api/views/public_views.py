from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from rest_framework.pagination import PageNumberPagination
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.db.models import F
from django.utils import timezone

from ..models import MasterCountry, MasterState, MasterDistrict, Donor, Advertisement, ContactMessage
from ..serializers import (
    MasterCountrySerializer, MasterStateSerializer, MasterDistrictSerializer,
    DonorSerializer, AdvertisementSerializer, ContactMessageSerializer
)

class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination class for large public datasets (like donor search).
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class MasterCountryListView(generics.ListAPIView):
    """Returns only countries whitelisted by the Super Admin"""
    queryset = MasterCountry.objects.filter(is_whitelisted=True)
    serializer_class = MasterCountrySerializer
    permission_classes = [permissions.AllowAny]

class MasterStateListView(generics.ListAPIView):
    """Returns states filtered by a specific country ID"""
    serializer_class = MasterStateSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        country_id = self.request.query_params.get('country')
        if country_id:
            return MasterState.objects.select_related('country').filter(country_id=country_id)
        return MasterState.objects.none()

class MasterDistrictListView(generics.ListAPIView):
    """Returns districts filtered by a specific state ID"""
    serializer_class = MasterDistrictSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        state_id = self.request.query_params.get('state')
        if state_id:
            return MasterDistrict.objects.select_related('state').filter(state_id=state_id)
        return MasterDistrict.objects.none()

class PublicDonorSearchView(generics.ListAPIView):
    """
    Handles the public cascading search. 
    Only returns donors belonging to 'ACTIVE' organizations.
    """
    serializer_class = DonorSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Donor.objects.select_related(
            'organization', 'country', 'state', 'district'
        ).filter(organization__status='ACTIVE')

        # Grab search parameters from the URL (e.g., ?blood_group=O+&district=5)
        blood_group = self.request.query_params.get('blood_group')
        country = self.request.query_params.get('country')
        state = self.request.query_params.get('state')
        district = self.request.query_params.get('district')

        # Apply filters if the user provided them
        if blood_group:
            queryset = queryset.filter(blood_group=blood_group)
        if country:
            queryset = queryset.filter(country__name=country)
        if state:
            queryset = queryset.filter(state__name=state)
        if district:
            queryset = queryset.filter(district__name=district)

        return queryset

class ActiveAdvertisementView(generics.ListAPIView):
    """Public view to fetch ALL active and non-expired ads."""
    serializer_class = AdvertisementSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Advertisement.objects.filter(
            is_active=True, 
            expires_at__gt=timezone.now()
        ).order_by('-created_at')
 
class ContactMessageCreateView(generics.CreateAPIView):
    """Allows the public to submit contact forms to the Super Admin."""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]


class AdClickRedirectView(APIView):
    """
    Public endpoint to track advertisement clicks. 
    Increments the click counter securely and redirects the user.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        ad = get_object_or_404(Advertisement, pk=pk)
        
        Advertisement.objects.filter(pk=pk).update(clicks=F('clicks') + 1)
        
        return HttpResponseRedirect(redirect_to=ad.target_link)