# ==========================================
# STAGE 1: Build Frontend (Vite/React)
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend dependency manifests and install
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy the frontend source code and build it
COPY frontend/ ./
RUN npm run build


# ==========================================
# STAGE 2: Build Backend & Final Image (Django)
# ==========================================
FROM python:3.12-slim

# Prevent Python from writing pyc files and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies (required for PostgreSQL)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the Django backend code
COPY backend/ /app/backend/

# Copy the built React app from Stage 1 into the directory WhiteNoise expects
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Collect static files (Provide a dummy SECRET_KEY to bypass startup validation during build)
RUN SECRET_KEY="dummy_secret_key_for_build" \
    DEBUG="False" \
    python manage.py collectstatic --noinput

# Expose the port Gunicorn will listen on
EXPOSE 8000

# Start Gunicorn (WSGI)
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]