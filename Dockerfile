# ==========================================
# STAGE 1: Build the Vite Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source code
COPY frontend/ ./

# Build the production Vite bundle (outputs to /app/frontend/dist)
RUN npm run build

# ==========================================
# STAGE 2: Build the Django Production Image
# ==========================================
FROM python:3.13-slim AS production

# Set environment variables for Python optimization
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app/backend

# Install OS-level dependencies required for psycopg2 (PostgreSQL) and cryptography
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Gunicorn is required for Linux production servers (Waitress is mostly for Windows)
RUN pip install gunicorn 

# Copy the Django backend source code
COPY backend/ ./

# Copy the compiled React application from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Collect static files (Whitenoise will pick these up)
# Note: Provide a dummy SECRET_KEY just so collectstatic doesn't crash during the build phase
RUN SECRET_KEY="build-key-ignore" python manage.py collectstatic --noinput

# Expose the port Gunicorn will run on
EXPOSE 8000

# Run the production server using Gunicorn with 3 worker processes
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]