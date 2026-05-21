from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class CustomCookieJWTAuthentication(JWTAuthentication):
    """
    Custom authentication class that reads the JWT from an HttpOnly cookie 
    instead of the Authorization header.
    """
    def authenticate(self, request):
        # 1. Look for the cookie defined in settings
        raw_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'))
        
        # 2. If no cookie is found, return None (User is unauthenticated)
        if raw_token is None:
            return None
        
        # 3. If found, validate it using SimpleJWT's built-in engine
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token