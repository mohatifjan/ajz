# Stage 1: Build backend
FROM node:18-alpine AS backend-build

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .

# Stage 2: Build frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine

WORKDIR /app

# Install MongoDB and other dependencies
RUN apk add --no-cache mongodb-tools

# Copy backend from build stage
COPY --from=backend-build /app/backend /app/backend

# Copy frontend dist from build stage
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend

# Expose ports
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "server.js"]
