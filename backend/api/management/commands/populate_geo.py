from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import MasterCountry, MasterState, MasterDistrict

class Command(BaseCommand):
    help = 'Populates or updates the database with Country, State, and District data'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        # The hierarchical mock data based on your React frontend
        geo_data = {
            'India': {
                'code': 'IN',
                'timezone_offset': 'Asia/Kolkata',
                'is_whitelisted': True,
                'states': {
                    'Kerala': ['Kannur', 'Kozhikode', 'Ernakulam', 'Trivandrum'],
                    'Karnataka': ['Bangalore', 'Mysore', 'Mangalore']
                }
            },
            'UAE': {
                'code': 'AE',
                'timezone_offset': 'Asia/Dubai',
                'is_whitelisted': True,
                'states': {
                    'Dubai': ['Deira', 'Bur Dubai', 'Downtown'],
                    'Abu Dhabi': ['Al Reem', 'Yas Island']
                }
            }
        }

        self.stdout.write(self.style.WARNING('Starting geographic data population...'))

        for country_name, country_info in geo_data.items():
            # 1. Update or create the Country (Allows changing whitelist status later)
            country, created = MasterCountry.objects.update_or_create(
                name=country_name,
                defaults={
                    'code': country_info['code'],
                    'timezone_offset': country_info['timezone_offset'],
                    'is_whitelisted': country_info['is_whitelisted']
                }
            )
            
            status = "Created" if created else "Updated/Found"
            self.stdout.write(self.style.SUCCESS(f'{status} Country: {country.name}'))

            # 2. Create the States
            for state_name, districts in country_info['states'].items():
                state, state_created = MasterState.objects.get_or_create(
                    name=state_name,
                    country=country
                )
                
                # 3. Create the Districts
                for district_name in districts:
                    district, dist_created = MasterDistrict.objects.get_or_create(
                        name=district_name,
                        state=state
                    )

        self.stdout.write(self.style.SUCCESS('\nSuccessfully populated all geographic data!'))