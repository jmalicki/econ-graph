# Multi-stage Dockerfile for EconGraph Frontend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Set build-time environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_GRAPHQL_URL
ARG REACT_APP_WS_URL
ARG REACT_APP_FACEBOOK_APP_ID
ARG REACT_APP_GOOGLE_CLIENT_ID
ARG NODE_ENV

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_GRAPHQL_URL=$REACT_APP_GRAPHQL_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_FACEBOOK_APP_ID=$REACT_APP_FACEBOOK_APP_ID
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
ENV NODE_ENV=$NODE_ENV

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
