# BlooDonate 🩸

BlooDonate is a secure multi-tenant SaaS platform designed to connect blood donors, hospitals, blood banks, NGOs, and the general public through a geographically aware donor management ecosystem.

The platform enables verified medical organizations to manage isolated donor databases, track donation history, monitor analytics, and securely coordinate blood donation workflows while maintaining strong privacy and access control standards.

---

# 🌍 Problem Statement

Traditional blood donation management systems are often fragmented, manually maintained, and geographically inefficient. BlooDonate solves this by providing:
- Localized donor discovery
- Secure organization-specific donor management
- Real-time donation tracking
- Centralized administrative oversight
- Public donor accessibility with privacy controls

---

# ✨ Core Features

## 🏢 Multi-Tenant SaaS Architecture
Each organization operates inside its own isolated tenant workspace while sharing a unified infrastructure.
- Tenant-specific donor databases
- Isolated analytics and records
- Role-based workspace permissions
- Organization approval workflows

## 🌎 Geographic Data Locking
The platform uses a hierarchical location structure: Country → State → District.
- Highly localized donor matching
- Region-specific organization management
- Accurate public donor searches
- Administrative geographic control

## 🔐 Advanced Security
- HTTP-only JWT authentication & refresh token rotation
- CSRF protection & secure cookie configurations
- Email OTP verification & TOTP 2FA support
- Role-Based Access Control (RBAC)
- Global platform tracking powered by `django-simple-history`
- Soft deletion recovery & strict tenant-isolated query boundaries

---

# 👥 Role-Based Access Control (RBAC)

### 🛡️ Super Admin
Global platform management and oversight.
- Approve or suspend organizations (`PENDING`, `ACTIVE`, `SUSPENDED` statuses)
- Manage geographic master data
- View system audit logs & respond to support tickets
- Manage public advertisements & review incoming contact forms

### 🏥 Organization Admin
Tenant-level management for approved hospitals, NGOs, and blood banks.
- Manage isolated donor records & log donations (Whole Blood, Plasma, Platelets)
- Perform bulk donor uploads via CSV/Excel sheets
- Track real-time donor operational analytics & manage payment configurations
- Open technical support tickets directly to Super Admins

### 🙋 Public Users & Donors
Unauthenticated, rate-limited public access.
- Search eligible local donors using Blood Group, State, and District filters
- View public profiles of verified medical organizations
- Submit public contact forms

---

# 🏗️ System Architecture

BlooDonate is architected as a cohesive application optimized for unified deployments:
- **Backend:** Python 3.12, Django 5.2, and Django REST Framework packaged as a unified monolithic application (`api/`).
- **Frontend:** React 19, Vite, and TailwindCSS v4 compiled into an optimized Single Page Application (SPA).
- **Production Integration:** Built via a multi-stage Docker environment. The frontend is compiled via Node.js and injected directly into the Django backend container. Production routing uses WhiteNoise along with a custom Django URL regex catch-all to gracefully handle React SPA routing text fallbacks without requiring a separate frontend server instance.

---

# 📁 Project Structure

```text
blood-connect/
├── backend/
│   ├── api/                  # Main monolithic application handling all modules
│   │   ├── management/       # Custom commands (e.g., populate_geo, seed_database)
│   │   ├── migrations/       # Database evolution histories
│   │   ├── tests/            # Automated test matrices
│   │   ├── views/            # Functional endpoints divided by domain boundaries
│   │   ├── models.py         # Central database layout & business logic
│   │   ├── serializers.py    # DRF request/response transforms
│   │   └── urls.py           # Dedicated core route maps
│   │
│   ├── config/               # Project-wide settings, WSGI/ASGI configurations
│   │   ├── settings.py       # Security, cookie setups, database connections
│   │   └── urls.py           # Global root router with OpenAPI & React SPA catch-all
│   │
│   ├── requirements.txt      # Main Python dependencies
│   └── manage.py             # Django entry point
│
├── frontend/
│   ├── src/                  # Core React source code
│   │   ├── components/       # Visual components (Layouts, UI, Auth wrappers)
│   │   └── pages/            # View routing targets (Public, Admin, Superadmin dashboards)
│   ├── public/               # Public assets
│   ├── package.json          # UI dependencies and configuration
│   └── vite.config.js        # Vite compilation pipeline
│
├── docker-compose.yml        # Multi-container orchestration (db, web)
└── Dockerfile                # Production multi-stage build schema

```

---

# 🚀 Quick Start (Dockerized Production Deployment)

## 1. Clone the Repository

```bash
git clone https://github.com/navafv/blood-connect.git
cd blood-connect

```

## 2. Configure Environment Variables

Create a `.env` file in the root directory following the definitions specified inside `DEPLOYMENT.md`.

## 3. Build & Run the Combined Containers

```bash
docker-compose up -d --build

```

## 4. Execute Initial Core Setup

Run the migrations, load static geographic baseline hierarchies, and instantiate the root administrator:

```bash
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py populate_geo
docker-compose exec web python manage.py createsuperuser

```

---

# 🌐 Access Routing Map

Because the platform utilizes an integrated deployment pipeline, a single active port manages both server requirements and interactive user actions:

| Layer | URL Pattern / Endpoint | Handled By |
| --- | --- | --- |
| **Combined Frontend SPA** | `http://localhost:8000/` | WhiteNoise / Django SPA Fallback Engine |
| **Core Core REST API** | `http://localhost:8000/api/` | Django REST Framework (`api.urls`) |
| **OpenAPI / Swagger Specs** | `http://localhost:8000/api/schema/swagger-ui/` | drf-spectacular |
| **Django Administration** | `http://localhost:8000/admin/` | Core Django Admin Panel |
| **PostgreSQL Database** | `localhost:5432` | Isolated Database Instance |

---

# 🧪 Independent Development Workflow

For active platform modifications, you can spin up the individual layers isolated from each other:

### Running the Backend Engine Independently

```bash
cd backend
python manage.py runserver

```

### Running the Interactive UI Development Server

```bash
cd frontend
npm install
npm run dev

```

---

# 📄 Accompanying Project References

| File Reference | Scope & Intended Target audience |
| --- | --- |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | Core routing definitions, schemas, and API validation maps. |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Server metrics, environment layouts, SSL adjustments, and production security rules. |
| [USER_GUIDE.md](USER_GUIDE.md) | Workflow walkthroughs tailored specifically for Donors, Tenant Admins, and Super Admins. |

---

# 📜 License

This project is licensed under the MIT License.