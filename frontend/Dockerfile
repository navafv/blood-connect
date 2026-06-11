# Stage 1: Build the React Application
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Pass the production API URL during the build step
ENV VITE_API_BASE_URL=https://api.navaf.duckdns.org/api
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy the built Vite assets
COPY --from=build /app/dist /usr/share/nginx/html

# Create an inline Nginx configuration to support React Router (SPA fallback)
RUN echo "server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]