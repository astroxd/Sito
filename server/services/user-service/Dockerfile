ARG SERVICE_NAME=user-service
ARG SERVICE_PATH=server/services/${SERVICE_NAME}
ARG SHARED_PATH=shared
ARG COMMON_PATH=server/packages/common
ARG PORT=3002


# =========================================
# Stage 1: DEV (Install all dependencies, compile TypeScript, and
# serve with hot-reload)
# =========================================

FROM dhi.io/node:24-alpine3.23-dev AS dev

ARG SERVICE_PATH
ARG SERVICE_NAME
ARG SHARED_PATH
ARG COMMON_PATH
ARG PORT

WORKDIR /app

ENV SERVICE_PATH=${SERVICE_PATH}

# Copy root and shared package metadata to leverage Docker layer caching
COPY --chown=node:node package*.json ./
COPY --chown=node:node tsconfig*.json ./
# COPY --chown=node:node ${SHARED_PATH}/package*.json ./${SHARED_PATH}/
COPY --chown=node:node ${COMMON_PATH}/package*.json ./${COMMON_PATH}/
COPY --chown=node:node ${SERVICE_PATH}/package*.json ./${SERVICE_PATH}/

# Install all dependencies (development + production)
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy source code for common, shared packages and the target microservice
# COPY --chown=node:node ${SHARED_PATH} ./${SHARED_PATH}
COPY --chown=node:node ${COMMON_PATH} ./${COMMON_PATH}
COPY --chown=node:node ${SERVICE_PATH} ./${SERVICE_PATH}

# Build only the common, shared packages as they are required as a dependency
# RUN npm run build --workspace=${SHARED_PATH}
RUN npm run build --workspace=${COMMON_PATH}

EXPOSE ${PORT}

USER node

# Start the microservice in development mode (with hot-reload via tsx)
CMD ["sh", "-c", "npm run dev --workspace=${SERVICE_PATH}"]


# =========================================
# Stage 2: BUILDER (build target service)
# =========================================

FROM dev AS builder

# Compile TypeScript into JavaScript for the target service
RUN npm run build --workspace=${SERVICE_PATH}


# =========================================
# Stage 3: DEPS (install production dependencies only)
# =========================================

FROM dhi.io/node:24-alpine3.23-dev AS deps

ARG SERVICE_PATH
ARG SHARED_PATH
ARG COMMON_PATH

WORKDIR /app

# # Copy package manifests for isolated production dependency installation
# COPY --chown=node:node package*.json ./
# # COPY --chown=node:node ${SHARED_PATH}/package*.json ./${SHARED_PATH}/
# COPY --chown=node:node ${COMMON_PATH}/package*.json ./${COMMON_PATH}/
# COPY --chown=node:node ${SERVICE_PATH}/package*.json ./${SERVICE_PATH}/

# # Copy the compiled output of common, shared packages from the dev stage
# # COPY --from=dev --chown=node:node /app/${SHARED_PATH}/dist ./${SHARED_PATH}/dist
# COPY --from=dev --chown=node:node /app/${COMMON_PATH}/dist ./${COMMON_PATH}/dist

# # Install production-only dependencies for the specified workspace
# RUN --mount=type=cache,target=/root/.npm \
#     npm install --omit=dev --workspace=${SERVICE_PATH} --include-workspace-root

COPY --from=builder /app /app
RUN npm prune --omit=dev

# =========================================
# Stage 4: RUNNER (minimal runtime image with compiled app and production deps)
# =========================================

FROM dhi.io/node:24-alpine3.23 AS runner

ARG SERVICE_PATH
ARG SHARED_PATH
ARG COMMON_PATH
ARG PORT

ENV NODE_ENV=production
ENV SERVICE_PATH=${SERVICE_PATH}

WORKDIR /app

# # Copy production node_modules and built assets
# COPY --from=deps --chown=node:node /app/node_modules ./node_modules
# # COPY --from=deps /app/${SHARED_PATH} ./${SHARED_PATH}
# COPY --from=deps --chown=node:node /app/${COMMON_PATH} ./${COMMON_PATH}
# # COPY --from=deps --chown=node:node /app/${SERVICE_PATH} ./${SERVICE_PATH}
# COPY --from=dev --chown=node:node /app/${SERVICE_PATH}/package.json ./${SERVICE_PATH}/package.json
# COPY --from=builder --chown=node:node /app/${SERVICE_PATH}/dist ./${SERVICE_PATH}/dist

COPY --from=deps --chown=node:node /app /app

# Expose the port that the application listens on.
EXPOSE ${PORT}

WORKDIR /app/${SERVICE_PATH}

USER node

# Execute the application using Node directly (no npm overhead)
CMD ["node", "dist/index.js"]