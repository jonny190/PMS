# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production=false

COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend
RUN cd frontend && npm install && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache postgresql-client

# Copy built artifacts
COPY --from=builder /app/backend/ ./backend/
COPY --from=builder /app/frontend/dist/ ./frontend/dist/

# Copy environment variables
COPY backend/.env ./

# Install backend dependencies
RUN cd backend && npm install --production=true

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "backend/src/server.js"]