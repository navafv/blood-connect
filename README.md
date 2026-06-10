# Blood Connect 🩸

Blood Connect is a secure multi-tenant SaaS platform designed to connect blood donors, hospitals, blood banks, NGOs, and the general public through a geographically aware donor management ecosystem.

The platform enables verified medical organizations to manage isolated donor databases, track donation history, monitor analytics, and securely coordinate blood donation workflows while maintaining strong privacy and access control standards.

---

# 🌍 Problem Statement

Traditional blood donation management systems are often fragmented, manually maintained, and geographically inefficient. Blood Connect solves this by providing:

- Localized donor discovery
- Secure organization-specific donor management
- Real-time donation tracking
- Centralized administrative oversight
- Public donor accessibility with privacy controls

---

# ✨ Core Features

## 🏢 Multi-Tenant SaaS Architecture

Each organization operates inside its own isolated tenant workspace while sharing a unified infrastructure.

Features include:

- Tenant-specific donor databases
- Isolated analytics and records
- Role-based workspace permissions
- Organization approval workflows

---

## 🌎 Geographic Data Locking

The platform uses a hierarchical location structure:

Country → State → District

This enables:

- Highly localized donor matching
- Region-specific organization management
- Accurate public donor searches
- Administrative geographic control

---

## 🔐 Advanced Security

Blood Connect is designed with security-first principles.

### Security Features

- HTTP-only JWT authentication
- Refresh token rotation
- CSRF protection
- Email OTP verification
- Phone OTP verification
- TOTP 2FA support
- Role-based authorization
- Rate limiting
- Secure password hashing
- Audit logging
- Soft deletion recovery
- Permission-based API boundaries

---

## 👥 Role-Based Access Control (RBAC)

### 🛡 Super Admin

Global platform management and oversight.

Capabilities:

- Approve or suspend organizations
- Manage geographic master data
- View system logs
- Manage advertisements
- Monitor analytics
- Respond to support tickets

---

### 🏥 Organization Admin

Tenant-level management for hospitals, NGOs, and blood banks.

Capabilities:

- Manage donor records
- Upload donors in bulk
- Log blood donations
- View analytics dashboards
- Manage staff access
- Create support tickets

---

### 🙋 Public Users & Donors

Accessible public-facing features without requiring authentication.

Capabilities:

- Search eligible donors
- View verified organizations
- Contact administrators
- Access public awareness information

---

# 📊 Platform Benefits

- Faster donor discovery
- Improved regional blood availability coordination
- Better operational efficiency for organizations
- Secure medical record tracking
- Transparent audit history
- Scalable SaaS infrastructure
- Reduced manual administrative overhead

---

# 🏗 System Architecture

## Backend

- Python
- Django
- Django REST Framework
- PostgreSQL
- django-simple-history

## Frontend

- React 19
- Vite
- TailwindCSS v4
- React Router v7
- React Query
- Recharts

## Infrastructure

- Docker
- Docker Compose
- Gunicorn
- Nginx Reverse Proxy

---

# 📈 Scalability Considerations

The platform is designed with long-term scalability in mind.

Current architectural considerations include:

- Tenant-isolated query patterns
- Indexed geographic filtering
- Optimized donor search operations
- Stateless containerized deployment
- Horizontal deployment readiness
- API-first backend structure

---

# 📁 Project Structure

```text
blood-connect/
├── backend/
│   ├── apps/
│   ├── authentication/
│   ├── organizations/
│   ├── donors/
│   ├── analytics/
│   ├── locations/
│   ├── support/
│   ├── config/
│   ├── requirements/
│   ├── Dockerfile
│   └── manage.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── layouts/
│   ├── assets/
│   └── vite.config.js
│
├── docs/
│   ├── screenshots/
│   └── architecture/
│
├── docker-compose.yml
├── README.md
├── API_DOCUMENTATION.md
├── DEPLOYMENT.md
└── USER_GUIDE.md
```

---

# 🚀 Quick Start

## 1. Clone the Repository

```bash
git clone https://github.com/navafv/blood-connect.git
cd blood-connect
```

---

## 2. Configure Environment Variables

Create a `.env` file in the root directory using:

```bash
backend/.env.example
```

---

## 3. Start the Application

```bash
docker-compose up -d --build
```

---

## 4. Run Database Migrations

```bash
docker-compose exec web python manage.py migrate
```

---

## 5. Populate Geographic Master Data

```bash
docker-compose exec web python manage.py populate_geo
```

---

## 6. Create Initial Super Admin

```bash
docker-compose exec web python manage.py createsuperuser
```

---

# 🌐 Access URLs

| Service    | URL                       |
| ---------- | ------------------------- |
| Frontend   | http://localhost:8000     |
| API        | http://localhost:8000/api |
| PostgreSQL | localhost:5432            |

---

# 🧪 Development Workflow

## Backend

```bash
cd backend
python manage.py runserver
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 🔌 API Design Principles

- RESTful architecture
- JWT cookie authentication
- Permission-based endpoint protection
- Standardized JSON responses
- Pagination support
- Secure tenant isolation
- Rate-limited public endpoints

---

# 📦 Deployment

The application supports production deployment using:

- Docker
- Docker Compose
- Gunicorn
- Nginx
- PostgreSQL

See:

```text
DEPLOYMENT.md
```

for complete deployment instructions.

---

# 📄 Documentation

| File                 | Description             |
| -------------------- | ----------------------- |
| README.md            | Project overview        |
| API_DOCUMENTATION.md | API reference           |
| DEPLOYMENT.md        | Deployment guide        |
| USER_GUIDE.md        | End-user platform guide |

---

# 📜 License

This project is licensed under the MIT License.

---

# 🤝 Contributing

Contributions, feature suggestions, and issue reports are welcome.

Please open an issue or submit a pull request.

---

# ❤️ Mission

Blood Connect aims to improve regional blood accessibility by providing secure, scalable, and efficient donor management infrastructure for medical organizations and communities.
