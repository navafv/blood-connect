# Blood Connect - Deployment Guide

This guide explains how to deploy Blood Connect using Docker and Docker Compose in a production Linux environment. 

Blood Connect uses a **unified containerized deployment architecture**. The React frontend is built dynamically in a multi-stage Docker process and served directly by the Django backend using WhiteNoise, meaning you only need to manage a single application container alongside your database.

Recommended environments:
* Ubuntu Server (22.04+)
* Debian
* VPS Providers (DigitalOcean, Linode, AWS EC2)
* Dedicated Servers

---

# 📋 Prerequisites

Minimum recommended server requirements:

| Resource | Recommended |
| :--- | :--- |
| RAM | 2GB+ |
| CPU | 2 vCPUs |
| Storage | 20GB SSD |
| OS | Ubuntu 22.04 LTS |

---

# 🐳 Required Software

Install the following on your server:
* Docker Engine
* Docker Compose plugin
* Git
* Nginx (Used as an external reverse proxy)
* Certbot (For HTTPS SSL certificates)

---

# 🌐 Domain Configuration

Point your domain's DNS `A` records to your server's public IP address.

Example:
```text
yourdomain.com
[www.yourdomain.com](https://www.yourdomain.com)

```

*(Note: Because the frontend and API share the same container, you do not strictly need a separate `api.yourdomain.com` subdomain unless you prefer to route it manually via Nginx).*

---

# ⚙️ Environment Variables

Create a `.env` file in the root directory (alongside `docker-compose.yml`). The `docker-compose.yml` file is configured to pass this file directly into the `web` container.

Example `.env`:

```env
# Database Credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=bloodconnect
# Leave this as 'db' to match the docker-compose internal network
DATABASE_URL=postgres://postgres:your_secure_password@db:5432/bloodconnect

# Django Security
DJANGO_SECRET_KEY=your_very_long_secret_key_here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=yourdomain.com,[www.yourdomain.com](https://www.yourdomain.com)

# Email SMTP (For OTP Verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Security & CORS
CORS_ALLOWED_ORIGINS=[https://yourdomain.com](https://yourdomain.com)
CSRF_TRUSTED_ORIGINS=[https://yourdomain.com](https://yourdomain.com)
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

```

---

# 🚀 Build & Start Containers

The `docker-compose.yml` uses a multi-stage `Dockerfile`. Stage 1 compiles the Vite/React frontend, and Stage 2 injects those static files into the Django application.

Run the build and start process in detached mode:

```bash
docker-compose up -d --build

```

---

# 🗄️ Initial Setup & Migrations

Once the containers are running, execute the initial structural setup inside the `web` container:

## 1. Run Database Migrations

```bash
docker-compose exec web python manage.py migrate

```

## 2. Populate Geographic Master Data

```bash
docker-compose exec web python manage.py populate_geo

```

## 3. Create Super Admin

```bash
docker-compose exec web python manage.py createsuperuser

```

---

# 📂 Production Stack Architecture

Because the frontend is bundled into the backend container, the flow looks like this:

```text
Client Request (HTTPS)
   ↓
Nginx (External Reverse Proxy on Host)
   ↓
localhost:8000
   ↓
Gunicorn (3 Workers) inside 'web' container
   ↓
Django (Routes /api/ to DRF; serves React via WhiteNoise SPA fallback)
   ↓
PostgreSQL ('db' container)

```

---

# 🔐 Nginx Reverse Proxy & HTTPS

To expose the Docker container to the public securely, configure Nginx to reverse proxy port `8000`.

### 1. Nginx Configuration Example (`/etc/nginx/sites-available/bloodconnect`)

```nginx
server {
    server_name yourdomain.com [www.yourdomain.com](https://www.yourdomain.com);

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_addrs;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

```

### 2. Enable Site and Issue SSL

```bash
sudo ln -s /etc/nginx/sites-available/bloodconnect /etc/nginx/sites-enabled/
sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com -d [www.yourdomain.com](https://www.yourdomain.com)

```

---

# 🛡️ Maintenance Commands

### Restart Services

```bash
docker-compose restart

```

### View Live Logs

```bash
docker-compose logs -f web

```

### Stop Services

```bash
docker-compose down

```

### Backup PostgreSQL Database

```bash
docker exec -t bloodconnect_db pg_dump -U postgres -d bloodconnect -F c > bloodconnect_backup_$(date +%Y%m%d).dump

```

---

# 🧪 CI/CD Pipeline Integration

The repository includes a GitHub Actions workflow located at `.github/workflows/ci-cd.yml`.

On every push to the main branch, the pipeline will:

1. Lint the frontend (ESLint).
2. Run backend test matrices (Pytest for auth, permissions, payments).
3. Validate the Docker image build.

---

# 📊 Volume Persistence

The `docker-compose.yml` is configured to persist:

* **PostgreSQL Data:** Safely stored in the `postgres_data` volume to survive container restarts.
* **Local Media Uploads:** Mapped to `./backend/media` to ensure organization logos and ads aren't lost during deployments (though using Cloudinary in production is highly recommended).