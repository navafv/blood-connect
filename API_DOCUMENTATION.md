# Blood Connect - API Documentation

The Blood Connect REST API is built using Django REST Framework (DRF) and follows RESTful design principles with secure multi-tenant access boundaries. 

The API is centralized within a single backend application and provides endpoints for:
* Authentication & Identity
* Public Directory & Discovery
* Geographic Master Data
* Tenant Workspace Operations
* Global Administrative Management

---

# 🔐 Authentication & Security

The platform uses JWT authentication stored in secure HTTP-only cookies.

## Authentication Flow
1. User logs in with email/password.
2. JWT access and refresh tokens are issued.
3. Tokens are stored in HTTP-only cookies.
4. Browser automatically attaches cookies to future requests.
5. Optional TOTP 2FA verification completes authentication if enabled.

## Security Features
* HTTP-only JWT cookies
* CSRF protection
* Refresh token rotation
* Email OTP verification
* TOTP 2FA authentication
* Role-based endpoint permissions
* Tenant-level access isolation
* Audit logging

---

# 📦 Response Format

## Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}

```

## Error Response

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {}
}

```

---

# 🛣 API Boundaries

Base API URL:

```text
/api/

```

---

# 1️⃣ Authentication & Identity Endpoints

Base Path:

```text
/api/auth/

```

Handles authentication, registration, credential recovery, and session management.

## Authentication & Tokens

* `POST /api/auth/login/` - Authenticates the user and issues JWT cookies.
* `POST /api/auth/login/2fa/` - Verifies TOTP code for accounts with 2FA enabled.
* `POST /api/auth/logout/` - Clears authentication cookies and invalidates session tokens.
* `POST /api/auth/refresh/` - Refreshes the JWT access token using the HTTP-only refresh cookie.

## Registration & Verification

* `POST /api/auth/register/` - Registers a new tenant organization.
* `POST /api/auth/verify-email/` - Verifies user email using OTP.
* `POST /api/auth/resend-otp/` - Resends the email verification OTP.

## User Profile & Security

* `GET /api/auth/me/` - Returns the currently authenticated user's profile and permissions.
* `GET /api/auth/security/` - Retrieves user security settings.
* `POST /api/auth/2fa/setup/` - Generates a TOTP secret and QR code for 2FA setup.
* `POST /api/auth/2fa/toggle/` - Enables or disables TOTP 2FA.

## Password Management

* `POST /api/auth/password-reset-request/` - Requests a password reset link/OTP.
* `POST /api/auth/password-reset-confirm/` - Confirms the new password.

---

# 2️⃣ Public Endpoints

Base Path:

```text
/api/public/

```

Public endpoints are accessible without authentication and protected using rate limiting.

* `GET /api/public/donors/search/` - Search active and publicly searchable donors. (Filters: `blood_group`, `state`, `district`)
* `GET /api/public/organizations/{slug}/` - Returns the public profile of an approved organization.
* `GET /api/public/advertisements/` - Fetches active public advertisements.
* `POST /api/public/ads/{id}/click/` - Tracks an ad click and redirects to the target link.
* `POST /api/public/contact/` - Submits a public contact message.

---

# 3️⃣ Geographic Master Data

Base Path:

```text
/api/locations/

```

Read-only endpoints used for geographic selection and filtering. Accessible without authentication.

* `GET /api/locations/countries/`
* `GET /api/locations/states/`
* `GET /api/locations/districts/`

---

# 4️⃣ Tenant Workspace API

Base Path:

```text
/api/tenant/

```

Requires: `ORG_ADMIN`
All tenant endpoints are automatically scoped to the authenticated organization.

## Dashboard & Organization

* `GET /api/tenant/dashboard-stats/` - Returns organization-specific analytics and donor metrics.
* `GET /api/tenant/organization/` - Retrieves tenant organization details.

## Donor Management

* `GET|POST /api/tenant/donors/` - Manage tenant donor records.
* `POST /api/tenant/donors/bulk-upload/` - Bulk import donors (Supports CSV and Excel).
* `POST /api/tenant/donors/{id}/log-donation/` - Logs a blood donation event (Whole Blood, Plasma, Platelets).

## Billing & Support

* `GET /api/tenant/billing/payments/` - Retrieve organization payment history.
* `GET|POST /api/tenant/support-tickets/` - Allows tenants to communicate with Super Admins.

---

# 5️⃣ Super Admin API

Base Path:

```text
/api/superadmin/

```

Requires: `SUPER_ADMIN`
Provides global platform management capabilities.

## Global Oversight

* `GET /api/superadmin/dashboard-stats/` - Returns platform-wide metrics.
* `GET /api/superadmin/logs/` - Returns system audit and activity logs.
* `POST /api/superadmin/system/cron-webhook/` - Webhook for triggering background/scheduled tasks.

## Organization & Financial Management

* `GET /api/superadmin/organizations/` - Lists all tenant organizations.
* `PATCH /api/superadmin/organizations/{id}/status/` - Changes organization status (`PENDING`, `ACTIVE`, `SUSPENDED`).
* `POST /api/superadmin/organizations/{id}/extend-subscription/` - Manually extends a tenant's subscription.
* `GET /api/superadmin/payments/` - Manages platform payments.

## Platform Operations

* `GET|POST /api/superadmin/ads/` - Manages public advertisements.
* `GET /api/superadmin/messages/` - Reviews public contact messages.
* `GET /api/superadmin/archived-donors/` - Access globally archived/deleted donor records.
* `GET /api/superadmin/support-tickets/` - Manages and responds to tenant support tickets.

## Master Data Management

* `GET|POST /api/superadmin/locations/countries/`
* `GET|POST /api/superadmin/locations/states/`
* `GET|POST /api/superadmin/locations/districts/`

---

# 6️⃣ OpenAPI / Swagger Specifications

The API provides auto-generated OpenAPI documentation.

* `GET /api/schema/` - Raw OpenAPI YAML/JSON schema.
* `GET /api/schema/swagger-ui/` - Interactive Swagger UI documentation.
* `GET /api/schema/redoc/` - ReDoc interactive API documentation.

---

# ⚡ Rate Limiting

Public endpoints are rate-limited to reduce abuse and spam attacks. Examples include:

* Public donor search
* Contact forms
* Authentication and OTP endpoints

---

# 🧾 Audit & History Tracking

Critical actions are tracked for security and accountability using `django-simple-history`.
Tracked events include:

* Authentication activity
* Organization approval changes
* Donor modifications & Soft deletions
* Donation records
* Administrative actions

---

# 🔒 Multi-Tenant Isolation

The API enforces strict tenant-level isolation.
Organization administrators:

* Cannot access data from other organizations.
* Are automatically scoped using organization-aware query filtering (`get_for_tenant`).
* Operate inside isolated permission boundaries.

---

# 📄 API Versioning

Routing is integrated directly into the core project under the `/api/` base path. Future iteration schemas will implement explicit path versioning (e.g., `/api/v2/`) if structural deprecations occur.