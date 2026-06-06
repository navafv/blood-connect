import secrets
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes

from ..tasks import send_async_email
from ..models import CustomUser, Organization

class CookieTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            user = CustomUser.objects.filter(email=request.data.get('email')).first()
            actual_role = user.role if user else 'PUBLIC_USER'
            
            if user and user.is_superuser:
                actual_role = 'SUPER_ADMIN'
            
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=access_token,
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=refresh_token,
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
            
            del response.data['access']
            del response.data['refresh']
            
            response.data['message'] = 'Login successful.'
            response.data['role'] = actual_role

        return response
    
class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        if refresh_token:
            request.data['refresh'] = refresh_token
            
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=response.data.get('access'),
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
            del response.data['access']

            if 'refresh' in response.data:
                response.set_cookie(
                    key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                    value=response.data['refresh'],
                    expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                    secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                    httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                    samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
                )
                del response.data['refresh']
                
            response.data['message'] = 'Session extended.'
            
        return response
    
class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        org_data = None
        
        if getattr(user, 'organization', None):
            org_data = {
                "id": user.organization.id,
                "name": user.organization.name,
                "status": user.organization.status,
            }

        return Response({
            "id": user.id,
            "email": user.email,
            "role": getattr(user, 'role', 'PUBLIC_USER'),
            "organization": org_data
        }, status=status.HTTP_200_OK)
    
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        response = Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        
        cookie_kwargs = {
            'path': settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
            'samesite': settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
        }
        
        if settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE'):
            cookie_kwargs['secure'] = True
            
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'], **cookie_kwargs)
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'], **cookie_kwargs)
        
        return response

class RegisterOrganizationView(APIView):
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data
        try:
            organization = Organization.objects.create(
                name=data.get('orgName'),
                org_type=data.get('orgType', 'NGO'),
                contact_email=data.get('email'),
                country_id=data.get('country_id'),
                state_id=data.get('state_id'),
                district_id=data.get('district_id'),
                address_line="Pending Address...",
                is_searchable=data.get('is_searchable', True),
                status='PENDING'
            )

            # Secure OTP Generation
            otp_code = str(secrets.randbelow(900000) + 100000)

            admin_user = CustomUser.objects.create_user(
                email=data.get('email'),
                password=data.get('password'),
                first_name=data.get('contactName', ''),
                role='ORG_ADMIN',
                organization=organization,
                email_verification_otp=otp_code,
                email_otp_expires_at=timezone.now() + timedelta(minutes=10)
            )

            subject = f"Verify your BloodConnect Organization: {otp_code}"
            plain_message = f"Your verification code is: {otp_code}. This code expires in 10 minutes."
            html_message = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Welcome to BloodConnect! 🩸</h2>
                <p>To complete your organization's registration, please enter the verification code below:</p>
                <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 15px; background: #f1f5f9; display: inline-block; border-radius: 8px;">
                    {otp_code}
                </div>
                <p style="color: #64748b; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes.</p>
            </div>
            """
            send_async_email(
                subject=subject, 
                plain_message=plain_message, 
                recipient_list=[data.get('email')], 
                html_message=html_message
            )

            return Response({
                "message": "Organization registered successfully. Please check your email for the verification code.",
                "organization_id": organization.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class VerifyEmailOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp'

    @transaction.atomic
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.filter(email=email).select_for_update().first()
        
        if not user:
            return Response({"error": "No account found with this email."}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified:
            return Response({"message": "Email is already verified."}, status=status.HTTP_200_OK)

        if user.email_verification_otp != otp:
            return Response({"error": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)

        if user.email_otp_expires_at and user.email_otp_expires_at < timezone.now():
            return Response({"error": "Verification code has expired."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_email_verified = True
        user.email_verification_otp = None
        user.email_otp_expires_at = None
        user.save()

        return Response({"message": "Email verified successfully!"}, status=status.HTTP_200_OK)

class ResendEmailOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'otp'

    @transaction.atomic
    def post(self, request):
        email = request.data.get('email')
        user = CustomUser.objects.filter(email=email).select_for_update().first()

        if not user:
            return Response({"error": "No account found."}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified:
            return Response({"error": "Email already verified."}, status=status.HTTP_400_BAD_REQUEST)

        if user.email_otp_expires_at and user.email_otp_expires_at > (timezone.now() + timedelta(minutes=9)):
            return Response({"error": "Please wait before requesting another code."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        new_otp = str(secrets.randbelow(900000) + 100000)
        user.email_verification_otp = new_otp
        user.email_otp_expires_at = timezone.now() + timedelta(minutes=10)
        user.save()

        send_async_email(
            subject=f"Verification Code: {new_otp}", 
            plain_message=f"Your new verification code is: {new_otp}", 
            recipient_list=[email], 
            html_message=f"<p>Your code is <b>{new_otp}</b>. It expires in 10 minutes.</p>"
        )

        return Response({"message": "Verification code dispatched."}, status=status.HTTP_200_OK)

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        email = request.data.get('email')
        user = CustomUser.objects.filter(email=email).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

            subject = "Reset your BloodConnect Password"
            plain_message = f"Click the link below to reset your password: {reset_link}"
            html_message = f"""
            <div style="font-family: Arial; padding: 20px;">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. Click the button below to proceed:</p>
                <a href="{reset_link}" style="background-color: #e11d48; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    Reset Password
                </a>
                <p style="margin-top: 20px; color: #666;">If you did not request this, please ignore this email.</p>
            </div>
            """
            send_async_email(
                subject=subject, 
                plain_message=plain_message, 
                recipient_list=[email], 
                html_message=html_message
            )

        return Response(
            {"message": "If an account exists, a password reset link has been sent."}, 
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uidb64 or not token or not new_password:
            return Response(
                {"error": "Missing required parameters."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            try:
                validate_password(new_password, user=user)
            except ValidationError as e:
                return Response(
                    {"error": list(e.messages)[0]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_password)
            user.save()
            return Response(
                {"message": "Credential updated securely."}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "The security token is invalid or has expired. Please request a new recovery link."}, 
                status=status.HTTP_400_BAD_REQUEST
            )