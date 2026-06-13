from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.pagination import PageNumberPagination
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.db.models import F
from django.utils import timezone

from ..models import MasterCountry, MasterState, MasterDistrict, Donor, Advertisement, ContactMessage, Organization, DonationRecord
from ..serializers import (
    MasterCountrySerializer, MasterStateSerializer, MasterDistrictSerializer,
    DonorSerializer, AdvertisementSerializer, ContactMessageSerializer, OrganizationSerializer, PublicDonorSearchSerializer
)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class MasterCountryListView(generics.ListAPIView):
    queryset = MasterCountry.objects.filter(is_whitelisted=True)
    serializer_class = MasterCountrySerializer
    permission_classes = [permissions.AllowAny]

class MasterStateListView(generics.ListAPIView):
    serializer_class = MasterStateSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        country_id = self.request.query_params.get('country')
        if country_id:
            return MasterState.objects.select_related('country').filter(country_id=country_id)
        return MasterState.objects.none()

class MasterDistrictListView(generics.ListAPIView):
    serializer_class = MasterDistrictSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        state_id = self.request.query_params.get('state')
        if state_id:
            return MasterDistrict.objects.select_related('state').filter(state_id=state_id)
        return MasterDistrict.objects.none()

class PublicDonorSearchView(generics.ListAPIView):
    serializer_class = PublicDonorSearchSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        # 1. Start with the base secure queryset (Only active, searchable organizations)
        queryset = Donor.objects.with_availability_context().select_related(
            'organization', 'country', 'state', 'district'
        ).filter(
            organization__status='ACTIVE', 
            organization__is_searchable=True
        )

        # 2. Extract query parameters sent by the React frontend
        country = self.request.query_params.get('country')
        state = self.request.query_params.get('state')
        district = self.request.query_params.get('district')
        blood_group = self.request.query_params.get('blood_group')

        # 3. Dynamically chain filters based on provided parameters
        if country:
            queryset = queryset.filter(country__name__iexact=country)
        if state:
            queryset = queryset.filter(state__name__iexact=state)
        if district:
            queryset = queryset.filter(district__name__iexact=district)
        if blood_group:
            queryset = queryset.filter(blood_group__iexact=blood_group)

        return queryset

class ActiveAdvertisementView(generics.ListAPIView):
    serializer_class = AdvertisementSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Advertisement.objects.filter(
            is_active=True, 
            expires_at__gt=timezone.now()
        ).order_by('-created_at')
 
class ContactMessageCreateView(generics.CreateAPIView):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

class AdViewTrackingView(APIView):
    """Silent endpoint to increment ad impressions"""
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        # Using F() avoids race conditions when multiple users view at the same time
        Advertisement.objects.filter(pk=pk).update(views=F('views') + 1)
        return Response({'status': 'view recorded'}, status=status.HTTP_200_OK)

class AdClickRedirectView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        ad = get_object_or_404(Advertisement, pk=pk)
        
        Advertisement.objects.filter(pk=pk).update(clicks=F('clicks') + 1)
        
        return HttpResponseRedirect(redirect_to=ad.target_link)

class PublicOrganizationDetailView(generics.RetrieveAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    
    def get_queryset(self):
        return Organization.objects.select_related(
            'country', 'state', 'district'
        ).filter(status='ACTIVE', is_searchable=True)