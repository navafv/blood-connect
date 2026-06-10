# Blood Connect - User Guide

Welcome to Blood Connect 🩸

Blood Connect is a secure multi-tenant SaaS blood donor management and coordination platform designed for hospitals, blood banks, NGOs, and the general public.

This guide explains how each user role interacts with the platform and how to use its core features effectively.

---

# 🌍 Platform Overview

Blood Connect connects:
* Public Users & Blood Donors
* Medical Organizations (Hospitals, Blood Banks, Private Clinics)
* NGOs / Volunteer Groups
* Super Administrators

The platform uses geographic master data constraints (Country → State → District) to perform localized donor matching, helping organizations manage blood donation workflows more efficiently and securely.

---

# 👥 User Roles

The platform enforces three primary user roles:

| Role | Access Level & Scope |
| :--- | :--- |
| **Public User / Donor** | Public local donor search, organization public profiles, and contact discovery. |
| **Organization Admin** | Tenant-specific dashboard, donor management, donation logs, and billing/support within an isolated workspace. |
| **Super Admin** | Platform-wide administrative oversight, organization verification, geographic control, audit logs, and global analytics. |

---

# 🙋‍♂️ 1. Public Users & Donors

Public users can access several platform features without requiring registration or authentication.

---

# 🔎 Search for Blood Donors

Use the **Search Donors** feature on the platform's homepage or search portal.

### Search Filters
* **Blood Group** (Required) - Supports multi-type classification (e.g., A+, O-, Bombay Blood Group, INRA, etc.)
* **State** (Optional) - Narrows down results to a specific region
* **District** (Optional) - Localizes results to a specific district

The system filters out unavailable, deferred, or unconsented profiles, returning a real-time list of active, eligible, and organization-managed local donors.

---

# 🏥 Browse Verified Organizations

Users can explore the public directories of approved medical entities. Clicking on an organization profile displays:
* Organization type and description
* Direct contact details (verified email and phone number)
* Complete geographical address

---

# 📩 Contact Platform Administrators

For issues, partnerships, or general platform inquiries, public users can use the global **Contact Us** form. Submitting a message transmits it straight to the Super Admin panel for review.

---

# 🔒 Public Privacy & Security

Blood Connect implements rigorous privacy checks on public pathways:
* Sensitive donor information (such as exact date of birth or direct contact history) is never exposed globally.
* Public donor search routes are explicitly rate-limited to avoid scraping and bot spam.
* Only donors whose managing organizations are set to `is_searchable=True` are indexed in public searches.

---

# 🏥 2. Organization Admins (Tenants)

Organization Administrators operate inside strictly isolated SaaS tenant workspaces. An organization can only interact with its own records, staff, and analytics dashboards.

---

# 🚀 Getting Started

### Step 1 — Register Your Organization
Click on **Register Organization**. You will be prompted to enter:
* Organization Name & Type (Hospital, Blood Bank, NGO, Clinic)
* Core Contact Information (Email & Phone Number)
* Geographic Workspace Lock (Country, State, District, and physical address line)

### Step 2 — Verification Process
Upon registration, your workspace enters a `PENDING` state. Super Administrators review submissions to ensure operational legitimacy and regional authenticity before granting activation.

### Step 3 — Login & Setup
Once activated to `ACTIVE` status:
* Authenticate using your credentials (secure JWT tokens are issued via HTTP-only cookies).
* Navigate to your **Security Settings** to optionally set up Time-based One-Time Password (TOTP) 2FA for enhanced protection.

---

# 📊 Dashboard & Analytics

The tenant dashboard generates live analytics tailored to your organization's operations:
* Total versus medically active donor breakdowns
* Blood group composition charts
* Historical donation graphs and regional trend tracking

---

# 👥 Tenant Donor Management

### Add Donors Manually
Create individual donor profiles inside your workspace by filling out full name, blood group classification, gender, date of birth, contact number, and geographical identifiers. Donors must explicitly provide consent for record-keeping and communications.

### Bulk Upload Donors
If importing existing records, use the **Bulk Upload** tool to upload clean CSV files or Excel spreadsheets. The backend validates records automatically prior to committing them to the database.

### Donor Availability & Cooldowns
The platform evaluates donor eligibility dynamically every time a record is viewed based on gender and donation types:
* **Whole Blood:** 90 days cooldown for Male donors; 120 days for Female donors.
* **Platelets:** 14 days cooldown.
* **Plasma:** 28 days cooldown.
* **Deferrals:** Donors marked as permanently deferred with a specific reason are automatically blocked from eligibility checks.

---

# 🩸 Logging Donations

When a blood donation workflow finishes successfully:
1. Locate the donor profile inside your workspace.
2. Click **Log Donation**.
3. Select the donation category (Whole Blood, Platelets, or Plasma) and add structural clinical notes if necessary.
4. Save the form. The system will automatically log the historical event and push the donor's next eligibility milestone outward.

---

# 💳 Subscription & UPI Payments

To keep workspace capabilities active, organizations manage subscriptions through payment submission logs:
* Submit transaction logs by providing the exact UTR / Reference Number from your UPI application.
* Payments enter a `PENDING` validation step until cross-referenced and approved by a Super Admin.

---

# 🎫 Support Tickets

If you encounter technical performance anomalies, billing questions, or structural errors, open a support ticket under the **Support Tickets** dashboard portal. You can exchange interactive replies with Super Admins directly through the workspace application.

---

# 🛡️ 3. Super Admins

Super Administrators hold global platform credentials and orchestrate system-wide governance across all tenant structures.

---

# ✅ Organization Management & Approvals

Super Admins handle organization onboarding and tracking. They view all profiles and update tenant system access flags through the following structural states:
* `PENDING`: Newly registered organizations awaiting validation.
* `ACTIVE`: Fully approved workspaces authorized to use the platform.
* `SUSPENDED`: Temporarily or permanently restricted organizations blocked from logging into the tenant space or displaying donors publicly.

Super Admins also have the capability to manually extend an organization's subscription timeline after verifying UPI payment UTR logs.

---

# 🌍 Geographic Master Data Controls

Super Admins maintain the regional baseline hierarchical datasets (`Country` → `State` → `District`). This administrative locking ensures clean drop-down dependencies on frontend views and prevents geographic fragmentation or spelling mismatches across tenant records.

---

# 📜 System Logs & Audit Trails

To guarantee maximum transparency and platform accountability, Super Admins have visibility into:
* **System Logs:** Centralized operational telemetry catching informational notices, warnings, and critical system anomalies.
* **Historical Audit Trails:** Comprehensive record timelines managed via `django-simple-history`, keeping track of modifications, donor edits, and soft-deletion activities.

---

# 📢 Advertisement Management

Super Admins supervise public-facing banner spaces:
* Upload visual banner files and set destination redirection URLs.
* Set calendar expiration rules.
* Monitor interaction volume using real-time automated click-count tracking.

---

# 🔒 Security Best Practices for All Roles

1. **Enable Multi-Factor Authentication:** All administrators should enable TOTP 2FA via their security preferences.
2. **Handle Data with Care:** Tenant data isolation is strictly guarded, but workspace staff must ensure accurate contact logging and explicit donor consent.
3. **Session Awareness:** Log out when using shared workstations to clear local state and HTTP-only session footprints.