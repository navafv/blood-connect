# Blood Connect - Deployment Guide

This guide explains how to deploy Blood Connect using Docker and Docker Compose in a production Linux environment.

Recommended environments:

* Ubuntu Server
* Debian
* VPS Providers
* Dedicated Servers

---

# 📋 Prerequisites

Minimum recommended server requirements:

| Resource | Recommended   |
| -------- | ------------- |
| RAM      | 2GB+          |
| CPU      | 2 vCPUs       |
| Storage  | 20GB SSD      |
| OS       | Ubuntu 22.04+ |

---

# 🐳 Required Software

Install the following:

* Docker Engine
* Docker Compose
* Git
* Nginx (Recommended)
* Certbot (HTTPS)

---

# 🌐 Domain Configuration

Point your domain DNS records to your server IP.

Example:

```text
yourdomain.com
api.yourdomain.com
```

---

# ⚙️ Environment Variables

Create a root-level `.env` file.

Example:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=bloodconnect
DATABASE_URL=postgres://postgres:your_secure_password@db:5432/bloodconnect

# Django
DJANGO_SECRET_KEY=your_very_long_secret_key_here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com

# Email SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Security
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

---

# 🚀 Build & Start Containers

Run:

```bash
docker-compose up -d --build
```

---

# 🗄 Database Migration

Run migrations manually if needed:

```bash
docker-compose exec web python manage.py migrate
```

---

# 🌍 Populate Geographic Data

```bash
docker-compose exec web python manage.py populate_geo
```

---

# 👤 Create Super Admin

```bash
docker-compose exec web python manage.py createsuperuser
```

---

# 🔍 Verify Running Containers

```bash
docker ps
```

---

# 📂 Recommended Production Stack

```text
Client
   ↓
Nginx Reverse Proxy
   ↓
Gunicorn
   ↓
Django REST API
   ↓
PostgreSQL
```

Optional services:

* Redis
* Celery
* Monitoring stack

---

# 🔐 HTTPS Setup

Install SSL certificates using Certbot.

Example:

```bash
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

# 📈 Production Recommendations

## Enable Automatic Restarts

Use restart policies inside `docker-compose.yml`.

Example:

```yaml
restart: unless-stopped
```

---

## Use Persistent Volumes

Recommended for:

* PostgreSQL
* Uploaded media
* Logs

---

## Configure Backups

Recommended backups:

* PostgreSQL dumps
* Uploaded media files
* Environment variables

---

# 🧪 CI/CD Pipeline

GitHub Actions workflow:

```text
.github/workflows/ci-cd.yml
```

---

# 🔄 Continuous Integration

On Push/Pull Request:

* Backend tests
* Frontend linting
* Docker image build validation

---

# 🚀 Continuous Deployment

Recommended deployment flow:

1. Build Docker images
2. Push images to DockerHub or GitHub Container Registry
3. Pull latest images on production server
4. Restart containers

---

# 📊 Monitoring Recommendations

Recommended tools:

* Uptime Kuma
* Grafana
* Prometheus
* Sentry

---

# 🛡 Security Recommendations

Production deployment should include:

* HTTPS enforcement
* Strong environment secrets
* Firewall configuration
* Fail2Ban
* Secure PostgreSQL credentials
* Non-root Docker usage
* Regular security updates

---

# 🔥 Firewall Example (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

# 🧹 Maintenance Commands

## Restart Containers

```bash
docker-compose restart
```

---

## View Logs

```bash
docker-compose logs -f
```

---

## Stop Services

```bash
docker-compose down
```

---

# 📦 Scaling Considerations

Future scalability options:

* Redis caching
* Celery background workers
* CDN integration
* Horizontal container scaling
* Read replicas for PostgreSQL

---

# 📄 Deployment Checklist

* [ ] Environment variables configured
* [ ] HTTPS enabled
* [ ] Database migrations completed
* [ ] Geographic data populated
* [ ] Super admin created
* [ ] Backups configured
* [ ] Firewall enabled
* [ ] Monitoring configured
* [ ] Docker restart policies enabled
