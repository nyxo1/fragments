# Stage 1: Dependencies - Use larger image for building
FROM node:22.12.0 AS dependencies

LABEL maintainer="Vanshdeep Kaur Khattrha <vkkhattrha@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# Use /app as our working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies using npm ci for faster, reliable builds
RUN npm ci --only=production

# Stage 2: Production - Use Alpine for smaller final image
FROM node:22.12.0-alpine AS production

# Use /app as our working directory
WORKDIR /app

# Set NODE_ENV to production for optimizations
ENV NODE_ENV=production

# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
ENV NPM_CONFIG_COLOR=false

# Copy node_modules from dependencies stage
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules

# Copy src to /app/src/
COPY --chown=node:node ./src ./src

# Copy our HTPASSWD file
COPY --chown=node:node ./tests/.htpasswd ./tests/.htpasswd

# Copy package.json for metadata
COPY --chown=node:node package*.json ./

# Switch to non-root user for security
USER node

# We run our service on port 8080
EXPOSE 8080

# Health check to monitor container health
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start the container by running our server
CMD ["npm", "start"]
