# =========================================
# Stage 1: Dev the Angular Application
# =========================================

# Use a lightweight DHI Node.js image for building
FROM dhi.io/node:24-alpine3.22-dev AS dev

# Set the working directory inside the container
WORKDIR /app

# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json package-lock.json* ./
COPY client/package.json client/package-lock.json* ./client/

# Install project dependencies using npm ci (ensures a clean, reproducible install)
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy the rest of the application source code into the container
COPY client/ ./client/

# Build the Angular application
WORKDIR /app/client

EXPOSE 8100

CMD ["npm", "run", "dev"]

# =========================================
# Stage 2: Build the Angular Application
# =========================================

# Use a lightweight DHI Node.js image for building
FROM dhi.io/node:24-alpine3.22-dev AS builder

RUN npm run build --workspace=client

# =========================================
# Stage 3: Prepare Nginx to Serve Static Files
# =========================================

FROM dhi.io/nginx:1.28.0-alpine3.21-dev AS runner

# Copy custom Nginx config
COPY client/nginx.conf /etc/nginx/nginx.conf

# Copy the static build output from the build stage to Nginx's default HTML serving directory
COPY --chown=nginx:nginx --from=builder /app/client/www /usr/share/nginx/html

# Use a non-root user for security best practices
USER nginx

# Expose port 8080 to allow HTTP traffic
# Note: The default Nginx container now listens on port 8080 instead of 80
EXPOSE 8080

# Start Nginx directly with custom config
ENTRYPOINT ["nginx", "-c", "/etc/nginx/nginx.conf"]
CMD ["-g", "daemon off;"]