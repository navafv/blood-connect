# Blood Connect - API Documentation

The Blood Connect REST API is built using Django REST Framework (DRF) and follows RESTful design principles with secure multi-tenant access boundaries.

The API provides endpoints for:

* Authentication
* Public donor discovery
* Geographic master data
* Tenant workspace operations
* Global administrative management

---

# 🔐 Authentication & Security

The platform uses JWT authentication stored in secure HTTP-only cookies.

## Authentication Flow

1. User logs in with email/password
2. JWT access and refresh tokens are issued
3. Tokens are stored in HTTP-only cookies
4. Browser automatically attaches cookies to future requests
5. Optional TOTP 2FA verification completes authentication

---

## Security Features

* HTTP-only JWT cookies
* CSRF protection
* Refresh token rotation
* Email OTP verification
* TOTP 2FA authentication
* Role-based endpoint permissions
* Tenant-level access isolation
* Audit logging
* Rate limiting on public endpoints

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

---

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

# 1️⃣ Authentication Endpoints

Base Path:

```text
/api/auth/
```

Handles authentication, registration, verification, and session management.

---

## Login

```http
POST /api/auth/login/
```

Authenticates the user and issues JWT cookies.

### Request Body

```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

---

## Verify 2FA

```http
POST /api/auth/login/2fa/
```

Verifies TOTP code for accounts with 2FA enabled.

---

## Register Organization

```http
POST /api/auth/register/
```

Registers a new tenant organization.

---

## Logout

```http
POST /api/auth/logout/
```

Clears authentication cookies and invalidates session tokens.

---

## Current User

```http
GET /api/auth/me/
```

Returns the currently authenticated user's profile and permissions.

---

## Verify Email

```http
POST /api/auth/verify-email/
```

Verifies user email using OTP.

---

# 2️⃣ Public Endpoints

Base Path:

```text
/api/public/
```

Public endpoints are accessible without authentication and protected using rate limiting.

---

## Search Donors

```http
GET /api/public/donors/search/
```

Search active and publicly searchable donors.

### Query Parameters

| Parameter   | Type   | Required |
| ----------- | ------ | -------- |
| blood_group | string | Yes      |
| state       | string | No       |
| district    | string | No       |

---

## Organization Public Profile

```http
GET /api/public/organizations/{slug}/
```

Returns the public profile of an approved organization.

---

## Advertisements

```http
GET /api/public/advertisements/
```

Fetches active public advertisements.

---

## Public Contact Form

```http
POST /api/public/contact/
```

Submits a public contact message.

---

# 3️⃣ Geographic Master Data

Base Path:

```text
/api/locations/
```

Read-only endpoints used for geographic selection and filtering.

---

## Countries

```http
GET /api/locations/countries/
```

---

## States

```http
GET /api/locations/states/
```

---

## Districts

```http
GET /api/locations/districts/
```

---

# 4️⃣ Tenant Workspace API

Base Path:

```text
/api/tenant/
```

Requires:

```text
ORG_ADMIN
```

All tenant endpoints are automatically scoped to the authenticated organization.

---

## Dashboard Statistics

```http
GET /api/tenant/dashboard-stats/
```

Returns organization-specific analytics and donor metrics.

---

## Donor Management

```http
GET /api/tenant/donors/
POST /api/tenant/donors/
```

Manage tenant donor records.

---

## Bulk Donor Upload

```http
POST /api/tenant/donors/bulk-upload/
```

Supports CSV and Excel uploads.

---

## Log Donation

```http
POST /api/tenant/donors/{id}/log-donation/
```

Logs a blood donation event.

### Supported Donation Types

* Whole Blood
* Plasma
* Platelets

---

## Support Tickets

```http
GET /api/tenant/support-tickets/
POST /api/tenant/support-tickets/
```

Allows tenants to communicate with Super Admins.

---

# 5️⃣ Super Admin API

Base Path:

```text
/api/superadmin/
```

Requires:

```text
SUPER_ADMIN
```

Provides global platform management capabilities.

---

## Global Dashboard Statistics

```http
GET /api/superadmin/dashboard-stats/
```

Returns platform-wide metrics.

---

## Organizations

```http
GET /api/superadmin/organizations/
```

Lists all tenant organizations.

---

## Approve or Suspend Organizations

```http
PATCH /api/superadmin/organizations/{id}/status/
```

Changes organization status.

### Supported Status Values

* PENDING
* ACTIVE
* SUSPENDED
* REJECTED

---

## System Logs

```http
GET /api/superadmin/logs/
```

Returns audit and activity logs.

---

## Advertisement Management

```http
GET /api/superadmin/ads/
POST /api/superadmin/ads/
```

Manages public advertisements.

---

# ⚡ Rate Limiting

Public endpoints are rate-limited to reduce abuse and spam attacks.

Examples:

* Public donor search
* Contact forms
* Authentication endpoints

---

# 🧾 Audit & History Tracking

Critical actions are tracked for security and accountability.

Tracked events include:

* Authentication activity
* Organization approval changes
* Donor modifications
* Donation records
* Administrative actions

Historical record tracking is implemented using:

```text
django-simple-history
```

---

# 🔒 Multi-Tenant Isolation

The API enforces strict tenant-level isolation.

Organization administrators:

* Cannot access data from other organizations
* Are automatically scoped using organization-aware query filtering
* Operate inside isolated permission boundaries

---

# 📄 API Versioning

Current API Version:

```text
v1
```

Future versions will maintain backward compatibility where possible.
