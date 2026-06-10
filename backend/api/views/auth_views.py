import secrets
import pyotp
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.signing import dumps, loads, BadSignature, SignatureExpired

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
            
            # Fetch user to assign role and check 2FA
            email = request.data.get('email') or request.data.get('username')
            user = CustomUser.objects.filter(email=email).first()
            actual_role = getattr(user, 'role', 'PUBLIC_USER') if user else 'PUBLIC_USER'
            
            if user and user.is_superuser:
                actual_role = 'SUPER_ADMIN'
                
            # --- 2FA INTERCEPTION GATEWAY ---
            if user and getattr(user, 'is_2fa_enabled', False):
                temp_token = dumps({'user_id': user.id}, salt='2fa-login')
                return Response({
                    "requires_2fa": True,
                    "temp_token": temp_token,
                    "message": "2FA verification required."
                }, status=status.HTTP_200_OK)
            
            # Reusable cookie kwargs (Safe Fallbacks applied)
            cookie_kwargs = {
                'secure': settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                'httponly': settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
                'samesite': settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
                'path': settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')
            }
            
            # Use max_age and convert timedelta to seconds
            access_max_age = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
            refresh_max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
            
            # Access Token Cookie
            response.set_cookie(
                key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
                value=access_token,
                max_age=access_max_age,
                **cookie_kwargs
            )
            
            # Refresh Token Cookie
            response.set_cookie(
                key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
                value=refresh_token,
                max_age=refresh_max_age,
                **cookie_kwargs
            )
            
            # Remove tokens from JSON body for security
            del response.data['access']
            del response.data['refresh']
            
            response.data['message'] = 'Login successful.'
            response.data['role'] = actual_role

        return response
    
class Verify2FALoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        temp_token = request.data.get('temp_token')
        code = request.data.get('code')

        try:
            data = loads(temp_token, salt='2fa-login', max_age=300)
            user = CustomUser.objects.get(id=data['user_id'])
        except (BadSignature, SignatureExpired, CustomUser.DoesNotExist):
            return Response({"error": "Session expired or invalid. Please login again."}, status=status.HTTP_401_UNAUTHORIZED)

        totp = pyotp.TOTP(user.totp_secret)
        
        if totp.verify(code, valid_window=1):
            refresh = RefreshToken.for_user(user)
            actual_role = getattr(user, 'role', 'PUBLIC_USER')
            if user.is_superuser:
                actual_role = 'SUPER_ADMIN'

            cookie_kwargs = {
                'expires': settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                'secure': settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                'httponly': settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
                'samesite': settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
                'path': settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')
            }

            access_max_age = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
            refresh_max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())

            response = Response({
                "message": "2FA successful",
                "role": actual_role,
            }, status=status.HTTP_200_OK)

            response.set_cookie(
                key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
                value=str(refresh.access_token),
                max_age=access_max_age,
                **cookie_kwargs
            )
            
            response.set_cookie(
                key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
                value=str(refresh),
                max_age=refresh_max_age,
                **cookie_kwargs
            )
            return response

        return Response({"error": "Invalid 2FA code. Check your device clock."}, status=status.HTTP_400_BAD_REQUEST)

class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'))
        
        if not refresh_token:
            return Response(
                {"error": "Refresh token cookie not found."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        mutable_data = request.data.copy() if hasattr(request.data, 'copy') else {}
        mutable_data['refresh'] = refresh_token
        
        serializer = self.get_serializer(data=mutable_data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
            
        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        
        if response.status_code == 200:
            cookie_kwargs = {
                'secure': settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
                'httponly': settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
                'samesite': settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
                'path': settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')
            }
            
            # Use max_age and convert timedelta to seconds
            access_max_age = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
            
            response.set_cookie(
                key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
                value=response.data.get('access'),
                max_age=access_max_age,
                **cookie_kwargs
            )
            
            if 'access' in response.data:
                del response.data['access']

            if 'refresh' in response.data:
                refresh_max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
                response.set_cookie(
                    key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
                    value=response.data['refresh'],
                    max_age=refresh_max_age,
                    **cookie_kwargs
                )
                del response.data['refresh']
                
            response.data['message'] = 'Session extended.'
            
        return response
    
class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = CustomUser.objects.select_related('organization').get(pk=request.user.pk)
        
        org_data = None
        if user.organization:
            org_data = {
                "id": user.organization.id,
                "name": user.organization.name,
                "status": user.organization.status,
            }

        return Response({
            "id": user.id,
            "email": user.email,
            "role": getattr(user, 'role', 'PUBLIC_USER'),
            "organization": org_data,
            "is_email_verified": user.is_email_verified # Exposing to the frontend context
        }, status=status.HTTP_200_OK)
    
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'))
            if refresh_token:
                token = RefreshToken(refresh_token)
                if hasattr(token, 'blacklist'):
                    token.blacklist()
        except Exception as e:
            pass

        response = Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        
        cookie_kwargs = {
            'path': settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
            'samesite': settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
        }
        
        if settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE'):
            cookie_kwargs['secure'] = True
            
        response.delete_cookie(settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'), **cookie_kwargs)
        response.delete_cookie(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'), **cookie_kwargs)
        
        return response

class RegisterOrganizationView(APIView):
    permission_classes = [permissions.AllowAny]
    # Explicitly define Parsers to allow processing of multipart/form-data containing files
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        data = request.data
        email = data.get('email', '').strip().lower()

        if not data.get('country_id') or not data.get('state_id') or not data.get('district_id'):
            return Response(
                {"error": "Operational jurisdiction (Country, State, and District) must be selected."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {"error": "An account with this email address already exists. Please sign in or use a different email."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            with transaction.atomic():
                # Form data usually converts booleans to strings, let's parse it safely
                is_searchable_val = data.get('is_searchable', 'true')
                is_searchable = str(is_searchable_val).lower() == 'true'

                # 1. Create Organization with new fields
                organization = Organization.objects.create(
                    name=data.get('orgName'),
                    org_type=data.get('orgType', 'NGO'),
                    contact_email=email,
                    contact_phone=data.get('contact_phone', ''),
                    country_id=data.get('country_id'),
                    state_id=data.get('state_id'),
                    district_id=data.get('district_id'),
                    address_line=data.get('address_line', ''),
                    is_searchable=is_searchable,
                    status='PENDING'
                )

                # Handle Logo Upload explicitly
                if 'logo' in request.FILES:
                    organization.logo = request.FILES['logo']
                    organization.save()

                # 2. Create the Admin User
                otp_code = str(secrets.randbelow(900000) + 100000)

                admin_user = CustomUser.objects.create_user(
                    email=email,
                    password=data.get('password'),
                    first_name=data.get('contactName', ''),
                    role='ORG_ADMIN',
                    organization=organization,
                    email_verification_otp=otp_code,
                    email_otp_expires_at=timezone.now() + timedelta(minutes=10)
                )

            # 3. Fire Email Notification
            subject = "Verify your BlooDonate Workspace"
            plain_message = f"Hello {data.get('contactName', '')},\n\nYour BlooDonate verification code is: {otp_code}.\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email."
            
            html_message = f"""
            <!doctype html>
            <html>

            <body style="
                margin: 0;
                padding: 0;
                background: #f8fafc;
                font-family: Arial, sans-serif;
                ">
                <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px; background: #f8fafc">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="
                        max-width: 600px;
                        background: #ffffff;
                        border-radius: 16px;
                        overflow: hidden;
                        border: 1px solid #e2e8f0;
                        ">
                                <tr>
                                    <td align="center" style="
                            background: #0f172a;
                            padding: 36px 24px;
                            border-bottom: 4px solid #e11d48;
                            ">
                                        <div style="font-size: 42px; margin-bottom: 12px">🩸</div>

                                        <h1 style="
                                margin: 0;
                                color: #ffffff;
                                font-size: 28px;
                                font-weight: 800;
                            ">
                                            BlooDonate
                                        </h1>

                                        <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px">
                                            Email Verification
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 40px 32px">
                                        <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 24px">
                                            Welcome, {data.get('contactName', 'Administrator')}
                                        </h2>

                                        <p style="
                                margin: 0 0 28px;
                                color: #475569;
                                font-size: 16px;
                                line-height: 1.7;
                            ">
                                            Verify your email address to activate the BlooDonate
                                            workspace for
                                            <strong>{data.get('orgName')}</strong>.
                                        </p>

                                        <div style="text-align: center; margin: 40px 0">
                                            <div style="
                                display: inline-block;
                                background: #f8fafc;
                                border: 1px solid #cbd5e1;
                                border-radius: 14px;
                                padding: 20px 28px;
                                ">
                                                <span style="
                                    font-size: 34px;
                                    letter-spacing: 10px;
                                    font-weight: 700;
                                    color: #0f172a;
                                    font-family: monospace;
                                ">
                                                    {otp_code}
                                                </span>
                                            </div>
                                        </div>

                                        <p style="
                                text-align: center;
                                color: #64748b;
                                font-size: 15px;
                                margin: 0 0 30px;
                            ">
                                            This verification code expires in
                                            <strong style="color: #e11d48">10 minutes</strong>.
                                        </p>

                                        <hr style="
                                border: none;
                                border-top: 1px solid #e2e8f0;
                                margin: 32px 0;
                            " />

                                        <p style="
                                margin: 0;
                                color: #64748b;
                                font-size: 13px;
                                line-height: 1.6;
                            ">
                                            <strong>Security Notice:</strong>
                                            Never share this code with anyone. If you did not request this
                                            verification, you can safely ignore this email.
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="
                            padding: 24px;
                            color: #94a3b8;
                            font-size: 12px;
                            background: #f8fafc;
                            ">
                                        © {timezone.now().year} BlooDonate. All rights reserved.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>

            </html>
            """
            
            send_async_email(
                subject=subject, 
                plain_message=plain_message, 
                recipient_list=[email], 
                html_message=html_message
            )

            return Response({
                "message": "Organization registered successfully. Please check your email for the verification code.",
                "organization_id": organization.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Registration failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
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

        subject = "New Verification Code for BlooDonate"
        plain_message = f"Hello {user.first_name or 'Administrator'},\n\nYour new BlooDonate verification code is: {new_otp}.\nThis code expires in 10 minutes."
        
        html_message = f"""
        <!doctype html>
        <html>

        <body style="
                    margin: 0;
                    padding: 0;
                    background: #f8fafc;
                    font-family: Arial, sans-serif;
                    ">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="
                            max-width: 600px;
                            background: #ffffff;
                            border-radius: 16px;
                            overflow: hidden;
                            border: 1px solid #e2e8f0;
                            ">
                            <tr>
                                <td align="center" style="
                                background: #0f172a;
                                padding: 36px 24px;
                                border-bottom: 4px solid #10b981;
                                ">
                                    <div style="font-size: 42px; margin-bottom: 12px">🩸</div>

                                    <h1 style="
                                    margin: 0;
                                    color: #ffffff;
                                    font-size: 28px;
                                    font-weight: 800;
                                ">
                                        BlooDonate
                                    </h1>

                                    <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px">
                                        New Verification Code
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 40px 32px">
                                    <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 24px">
                                        Hello, {user.first_name or 'Administrator'}
                                    </h2>

                                    <p style="
                                    margin: 0 0 28px;
                                    color: #475569;
                                    font-size: 16px;
                                    line-height: 1.7;
                                ">
                                        You requested a new verification code for your BlooDonate
                                        account.
                                    </p>

                                    <div style="text-align: center; margin: 40px 0">
                                        <div style="
                                    display: inline-block;
                                    background: #f8fafc;
                                    border: 1px solid #cbd5e1;
                                    border-radius: 14px;
                                    padding: 20px 28px;
                                    ">
                                            <span style="
                                        font-size: 34px;
                                        letter-spacing: 10px;
                                        font-weight: 700;
                                        color: #0f172a;
                                        font-family: monospace;
                                    ">
                                                {new_otp}
                                            </span>
                                        </div>
                                    </div>

                                    <p style="text-align: center; color: #64748b; font-size: 15px">
                                        This code expires in
                                        <strong style="color: #10b981">10 minutes</strong>.
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td align="center" style="
                                padding: 24px;
                                color: #94a3b8;
                                font-size: 12px;
                                background: #f8fafc;
                                ">
                                    © {timezone.now().year} BlooDonate. All rights reserved.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>

        </html>
        """

        send_async_email(
            subject=subject, 
            plain_message=plain_message, 
            recipient_list=[email], 
            html_message=html_message
        )

        return Response({"message": "Verification code dispatched."}, status=status.HTTP_200_OK)

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset'

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({"error": "Email address is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.filter(email=email).first()

        if user and user.is_active:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

            subject = "BlooDonate Security: Password Reset Request"
            plain_message = f"Hello {user.first_name or 'Administrator'},\n\nWe received a request to reset your BlooDonate password. Click the link below to proceed:\n{reset_link}\n\nThis link will expire shortly. If you did not request this, please ignore this email."
            
            html_message = f"""
            <!doctype html>
            <html>

            <body style="
                            margin: 0;
                            padding: 0;
                            background: #f8fafc;
                            font-family: Arial, sans-serif;
                            ">
                <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="
                                    max-width: 600px;
                                    background: #ffffff;
                                    border-radius: 16px;
                                    overflow: hidden;
                                    border: 1px solid #e2e8f0;
                                    ">
                                <tr>
                                    <td align="center" style="
                                        background: #0f172a;
                                        padding: 36px 24px;
                                        border-bottom: 4px solid #e11d48;
                                        ">
                                        <div style="font-size: 42px; margin-bottom: 12px">🩸</div>

                                        <h1 style="
                                            margin: 0;
                                            color: #ffffff;
                                            font-size: 28px;
                                            font-weight: 800;
                                        ">
                                            BlooDonate
                                        </h1>

                                        <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px">
                                            Password Reset
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 40px 32px">
                                        <h2 style="margin: 0 0 20px; color: #0f172a; font-size: 24px">
                                            Hello, {user.first_name or 'Administrator'}
                                        </h2>

                                        <p style="
                                            margin: 0 0 28px;
                                            color: #475569;
                                            font-size: 16px;
                                            line-height: 1.7;
                                        ">
                                            We received a request to reset the password for your
                                            BlooDonate account.
                                        </p>

                                        <div style="text-align: center; margin: 40px 0">
                                            <a href="{reset_link}" style="
                                            display: inline-block;
                                            background: #e11d48;
                                            color: #ffffff;
                                            text-decoration: none;
                                            padding: 16px 30px;
                                            border-radius: 10px;
                                            font-size: 16px;
                                            font-weight: 600;
                                            ">
                                                Reset Password
                                            </a>
                                        </div>

                                        <p style="
                                            margin: 0 0 28px;
                                            color: #64748b;
                                            font-size: 14px;
                                            line-height: 1.7;
                                        ">
                                            If the button above does not work, copy and paste this link
                                            into your browser:
                                            <br /><br />

                                            <a href="{reset_link}" style="color: #2563eb; word-break: break-all">
                                                {reset_link}
                                            </a>
                                        </p>

                                        <hr style="
                                            border: none;
                                            border-top: 1px solid #e2e8f0;
                                            margin: 32px 0;
                                        " />

                                        <p style="
                                            margin: 0;
                                            color: #64748b;
                                            font-size: 13px;
                                            line-height: 1.6;
                                        ">
                                            <strong>Security Notice:</strong>
                                            If you did not request a password reset, you can safely ignore
                                            this email.
                                        </p>
                                    </td>
                                </tr>

                                <tr>
                                    <td align="center" style="
                                        padding: 24px;
                                        color: #94a3b8;
                                        font-size: 12px;
                                        background: #f8fafc;
                                        ">
                                        © {timezone.now().year} BlooDonate. All rights reserved.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>

            </html>
            """
            
            send_async_email(
                subject=subject, 
                plain_message=plain_message, 
                recipient_list=[email], 
                html_message=html_message
            )

        return Response(
            {"message": "If an authorized account exists, a recovery payload has been dispatched."}, 
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'password_reset_confirm'

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uidb64 or not token or not new_password:
            return Response(
                {"error": "Missing required cryptographic parameters."}, 
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

class SecuritySettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"is_2fa_enabled": getattr(request.user, 'is_2fa_enabled', False)})

    def post(self, request):
        user = request.user
        old_pass = request.data.get('old_password')
        new_pass = request.data.get('new_password')

        if not user.check_password(old_pass):
            return Response({"error": "Incorrect current password."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_password(new_pass, user=user)
        except ValidationError as e:
            return Response({"error": list(e.messages)[0]}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_pass)
        user.save()
        return Response({"message": "Password updated securely."})

class Setup2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        
        # Guarantee a fresh secret is generated every setup attempt
        user.totp_secret = pyotp.random_base32()
        user.save()

        totp = pyotp.TOTP(user.totp_secret)
        uri = totp.provisioning_uri(name=user.email, issuer_name="BlooDonate")
        return Response({"qr_uri": uri})

class Toggle2FAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        action = request.data.get('action')

        if action == 'disable':
            user.is_2fa_enabled = False
            user.save()
            return Response({"message": "2FA has been disabled."})
        
        elif action == 'enable':
            code = request.data.get('code')
            if not getattr(user, 'totp_secret', None):
                return Response({"error": "2FA not initialized."}, status=status.HTTP_400_BAD_REQUEST)
                
            totp = pyotp.TOTP(user.totp_secret)
            
            if totp.verify(code, valid_window=1):
                user.is_2fa_enabled = True
                user.save()
                return Response({"message": "2FA successfully enabled."})
                
            return Response({"error": "Invalid verification code. Try again."}, status=status.HTTP_400_BAD_REQUEST)