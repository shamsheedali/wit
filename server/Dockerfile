# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies for bcrypt
RUN apk add --no-cache python3 make g++ py3-pip

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN apk add --no-cache python3 make g++ && \
    npm ci --only=production && \
    apk del python3 make g++  # Clean up build dependencies

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5000

# Start the app
CMD ["node", "dist/server.js"]