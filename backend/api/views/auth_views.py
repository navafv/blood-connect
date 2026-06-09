import secrets
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
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
            
            # Fetch user to assign role
            email = request.data.get('email') or request.data.get('username')
            user = CustomUser.objects.filter(email=email).first()
            actual_role = user.role if user else 'PUBLIC_USER'
            
            if user and user.is_superuser:
                actual_role = 'SUPER_ADMIN'
            
            # Reusable cookie kwargs to prevent typos
            cookie_kwargs = {
                'expires': settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                'secure': settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                'httponly': settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                'samesite': settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                'path': settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/') # Added missing path!
            }
            
            # Access Token Cookie
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=access_token,
                **cookie_kwargs
            )
            
            # Refresh Token Cookie (Overwrite expiration for refresh token)
            cookie_kwargs['expires'] = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=refresh_token,
                **cookie_kwargs
            )
            
            # Remove tokens from JSON body for security
            del response.data['access']
            del response.data['refresh']
            
            response.data['message'] = 'Login successful.'
            response.data['role'] = actual_role

        return response
    
class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        
        if not refresh_token:
            return Response(
                {"error": "Refresh token cookie not found."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        # Make a mutable copy of the request data to avoid Immutability crashes
        mutable_data = request.data.copy() if hasattr(request.data, 'copy') else {}
        mutable_data['refresh'] = refresh_token
        
        # We must override the request.data behavior for the parent class
        # by passing the modified data directly to the serializer
        serializer = self.get_serializer(data=mutable_data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
            
        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        
        if response.status_code == 200:
            cookie_kwargs = {
                'secure': settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                'httponly': settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                'samesite': settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE'],
                'path': settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/')
            }
            
            # Set new access token
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=response.data.get('access'),
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                **cookie_kwargs
            )
            del response.data['access']

            # Set new refresh token (if rotation is enabled)
            if 'refresh' in response.data:
                response.set_cookie(
                    key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                    value=response.data['refresh'],
                    expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
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
            "organization": org_data
        }, status=status.HTTP_200_OK)
    
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # 1. Extract the refresh token from the HttpOnly cookie
            refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
            
            if refresh_token:
                token = RefreshToken(refresh_token)
                
                # 2. Safely attempt to blacklist (prevents the AttributeError)
                if hasattr(token, 'blacklist'):
                    token.blacklist()
        except Exception as e:
            # Catch TokenError, AttributeError, or any other issue 
            # We silently pass so we NEVER fail to log the user out
            print(f"Token blacklisting bypassed: {str(e)}")
            pass

        # 3. Build response and instruct browser to delete cookies
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

    def post(self, request):
        data = request.data
        email = data.get('email', '').strip().lower()

        # 1. Explicitly check for missing geographic data
        if not data.get('country_id') or not data.get('state_id') or not data.get('district_id'):
            return Response(
                {"error": "Operational jurisdiction (Country, State, and District) must be selected."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 2. Explicitly check for duplicate emails
        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {"error": "An account with this email address already exists. Please sign in or use a different email."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            with transaction.atomic():
                organization = Organization.objects.create(
                    name=data.get('orgName'),
                    org_type=data.get('orgType', 'NGO'),
                    contact_email=email,
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
                    email=email,
                    password=data.get('password'),
                    first_name=data.get('contactName', ''),
                    role='ORG_ADMIN',
                    organization=organization,
                    email_verification_otp=otp_code,
                    email_otp_expires_at=timezone.now() + timedelta(minutes=10)
                )

            # --- MODERN EMAIL TEMPLATE ---
            subject = "Verify your BloodConnect Workspace"
            plain_message = f"Hello {data.get('contactName', '')},\n\nYour BloodConnect verification code is: {otp_code}.\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email."
            
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                                <tr>
                                    <td align="center" style="background-color: #0f172a; padding: 30px 20px; border-bottom: 3px solid #e11d48;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">BloodConnect</h1>
                                        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Security Gateway</p>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 20px;">Welcome, {data.get('contactName', 'Administrator')}</h2>
                                        <p style="color: #475569; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
                                            You are one step away from provisioning the workspace for <strong>{data.get('orgName')}</strong>. To verify your identity and activate your account, please enter the following secure authentication code:
                                        </p>
                                        
                                        <div style="text-align: center; margin: 35px 0;">
                                            <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; display: inline-block;">
                                                <span style="font-family: monospace; font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 8px;">{otp_code}</span>
                                            </div>
                                        </div>
                                        
                                        <p style="color: #475569; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; text-align: center;">
                                            This code will expire in <strong style="color: #e11d48;">10 minutes</strong>.
                                        </p>
                                        
                                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                                        
                                        <p style="color: #64748b; margin: 0; font-size: 13px; line-height: 1.5;">
                                            <strong>Security Notice:</strong> Never share this code with anyone. BloodConnect staff will never ask for your password or verification codes. If you did not request this registration, please ignore this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
                                <tr>
                                    <td align="center" style="padding: 20px; color: #94a3b8; font-size: 12px;">
                                        &copy; {timezone.now().year} BloodConnect Global Infrastructure. All rights reserved.
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
            # Only unexpected system errors (like DB going down) will hit this now
            return Response({"error": "An unexpected error occurred during registration. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
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

        # Prevents spamming the resend button within the first minute
        if user.email_otp_expires_at and user.email_otp_expires_at > (timezone.now() + timedelta(minutes=9)):
            return Response({"error": "Please wait before requesting another code."}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        new_otp = str(secrets.randbelow(900000) + 100000)
        user.email_verification_otp = new_otp
        user.email_otp_expires_at = timezone.now() + timedelta(minutes=10)
        user.save()

        # --- MODERN RESPONSIVE EMAIL TEMPLATE ---
        subject = "New Verification Code for BloodConnect"
        plain_message = f"Hello {user.first_name or 'Administrator'},\n\nYour new BloodConnect verification code is: {new_otp}.\nThis code expires in 10 minutes."
        
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                            <tr>
                                <td align="center" style="background-color: #0f172a; padding: 30px 20px; border-bottom: 3px solid #10b981;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">BloodConnect</h1>
                                    <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Security Gateway</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 20px;">Hello, {user.first_name or 'Administrator'}</h2>
                                    <p style="color: #475569; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
                                        You requested a new verification code for your workspace. Please enter the following secure authentication code:
                                    </p>
                                    <div style="text-align: center; margin: 35px 0;">
                                        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; display: inline-block;">
                                            <span style="font-family: monospace; font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 8px;">{new_otp}</span>
                                        </div>
                                    </div>
                                    <p style="color: #475569; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; text-align: center;">
                                        This code will expire in <strong style="color: #10b981;">10 minutes</strong>.
                                    </p>
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
        # 1. Sanitize the input
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({"error": "Email address is required."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Look up the user
        user = CustomUser.objects.filter(email=email).first()

        # 3. Only process the email if the user exists and is active
        if user and user.is_active:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

            # --- MODERN RESPONSIVE EMAIL TEMPLATE ---
            subject = "BloodConnect Security: Password Reset Request"
            plain_message = f"Hello {user.first_name or 'Administrator'},\n\nWe received a request to reset your BloodConnect password. Click the link below to proceed:\n{reset_link}\n\nThis link will expire shortly. If you did not request this, please ignore this email."
            
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                                <tr>
                                    <td align="center" style="background-color: #0f172a; padding: 30px 20px; border-bottom: 3px solid #e11d48;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">BloodConnect</h1>
                                        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Security Gateway</p>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 20px;">Hello, {user.first_name or 'Administrator'}</h2>
                                        <p style="color: #475569; margin: 0 0 25px 0; font-size: 16px; line-height: 1.6;">
                                            We received a request to reset the administrative password for your BloodConnect workspace associated with <strong>{email}</strong>.
                                        </p>
                                        
                                        <div style="text-align: center; margin: 35px 0;">
                                            <a href="{reset_link}" style="background-color: #e11d48; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.2);">
                                                Authenticate & Reset Password
                                            </a>
                                        </div>
                                        
                                        <p style="color: #475569; margin: 0 0 25px 0; font-size: 14px; line-height: 1.6; text-align: center;">
                                            Or copy and paste this secure link into your browser:<br>
                                            <a href="{reset_link}" style="color: #2563eb; word-break: break-all; font-size: 13px; margin-top: 8px; display: inline-block;">{reset_link}</a>
                                        </p>
                                        
                                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                                        
                                        <p style="color: #64748b; margin: 0; font-size: 13px; line-height: 1.5;">
                                            <strong>Security Notice:</strong> This secure link is single-use and will expire shortly. If you did not initiate this request, your account is still secure. You can safely ignore and delete this email.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
                                <tr>
                                    <td align="center" style="padding: 20px; color: #94a3b8; font-size: 12px;">
                                        &copy; {timezone.now().year} BloodConnect Global Infrastructure. All rights reserved.
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

        # 4. ALWAYS return 200 OK to prevent email enumeration hacking
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

        # Constant-time comparison happens inside check_token
        if user is not None and default_token_generator.check_token(user, token):
            try:
                # Utilizes Django's built-in password validators (e.g., MinimumLengthValidator)
                validate_password(new_password, user=user)
            except ValidationError as e:
                return Response(
                    {"error": list(e.messages)[0]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # set_password hashes the password before saving it to the database
            user.set_password(new_password)
            user.save()
            
            return Response(
                {"message": "Credential updated securely."}, 
                status=status.HTTP_200_OK
            )
        else:
            # Fallback error for invalid user or bad token
            return Response(
                {"error": "The security token is invalid or has expired. Please request a new recovery link."}, 
                status=status.HTTP_400_BAD_REQUEST
            )