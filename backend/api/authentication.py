from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class CustomCookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # 1. Look for the cookie name defined in settings
        cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
        
        # 2. First, try to get the token from the header
        header = self.get_header(request)
        
        if header is None:
            # 3. If no header, extract it from the HttpOnly cookie
            raw_token = request.COOKIES.get(cookie_name)
        else:
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        # 4. Validate the token and return the user
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token