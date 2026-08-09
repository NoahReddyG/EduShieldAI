# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder: Install dependencies and build the Vite + React SPA
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci --frozen-lockfile

# Copy the full source code
COPY . .

# Build production bundle (outputs to /app/dist)
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Production: Serve built assets via Nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove the default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built React SPA from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx listens on port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
