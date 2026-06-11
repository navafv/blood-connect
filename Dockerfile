# ==========================================
# STAGE 1: Build React Frontend
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

# Accept the API URL dynamically during the build
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Install Node modules and build
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Build Django Backend (Unified Serve)
# ==========================================
FROM python:3.10-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Django's BASE_DIR will be /app/backend
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Django backend code
COPY backend/ .

# Inject the built React app from Stage 1 into the exact folder 
# your settings.py expects (BASE_DIR.parent / 'frontend' / 'dist')
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 8000

# Start Gunicorn
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]