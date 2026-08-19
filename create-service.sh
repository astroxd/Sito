#!/bin/bash

# ==============================================================================
# SECTION 1: VALIDATION & INITIAL SETUP
# ==============================================================================

if [ $# -lt 2 ]; then
    echo "Usage: ./create-service.sh <service_name> <port>"
    echo "Example: ./create-service.sh anime-service 3003"
    exit 1
fi

SERVICE_NAME=$1
PORT=$2
BASE="./server/services/${SERVICE_NAME}"

# Ensure service name is not purely numeric
if [[ "$SERVICE_NAME" =~ ^[0-9]+$ ]]; then
    echo "Error: Service name cannot be a purely numeric string."
    exit 1
fi

# Ensure port is a valid number within TCP range (1024 - 65535)
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1024 ] || [ "$PORT" -gt 65535 ]; then
    echo "Error: Port must be a valid number between 1024 and 65535."
    exit 1
fi

# Check if target service directory already exists
if [ -d "$BASE" ]; then
    echo "Error: Directory '$BASE' already exists."
    exit 1
fi

echo "🚀 Creating microservice '${SERVICE_NAME}' on port ${PORT}..."


# ==============================================================================
# SECTION 2: DIRECTORY STRUCTURE CREATION
# ==============================================================================

mkdir -p "$BASE/src/config"
mkdir -p "$BASE/src/controllers"
mkdir -p "$BASE/src/middlewares" && touch "$BASE/src/middlewares/.gitkeep"
mkdir -p "$BASE/src/models" && touch "$BASE/src/models/.gitkeep"
mkdir -p "$BASE/src/routes" 


# ==============================================================================
# SECTION 3: CONFIGURATION & TEMPLATE FILES COPY
# ==============================================================================

# Copy configuration templates from reference service
cp ./server/services/user-service/tsconfig.json "$BASE/"
cp ./server/services/user-service/Dockerfile "$BASE/"

# Cross-platform compatibility for sed (macOS vs Linux)
if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "s/^ARG SERVICE_NAME=.*/ARG SERVICE_NAME=${SERVICE_NAME}/" "$BASE/Dockerfile"
    sed -i '' "s/^ARG PORT=.*/ARG PORT=${PORT}/" "$BASE/Dockerfile"
else
    sed -i "s/^ARG SERVICE_NAME=.*/ARG SERVICE_NAME=${SERVICE_NAME}/" "$BASE/Dockerfile"
    sed -i "s/^ARG PORT=.*/ARG PORT=${PORT}/" "$BASE/Dockerfile"
fi


# ==============================================================================
# SECTION 4: PACKAGE.JSON GENERATION
# ==============================================================================

cd "$BASE" || exit 1
npm init -y > /dev/null

npm pkg set name="@anime-hub/${SERVICE_NAME}"
npm pkg set main="dist/index.js"
npm pkg set scripts.start="node dist/index.js"
npm pkg set scripts.build="tsc"
npm pkg set scripts.dev="tsx watch src/index.ts"

# Dependencies setup without slow npm install network requests
npm pkg set dependencies."@anime-hub/common"="*"
npm pkg set dependencies.express="^5.2.1"
npm pkg set dependencies.dotenv="^17.4.2"
npm pkg set devDependencies.typescript="^7.0.2"
npm pkg set devDependencies.tsx="^4.23.1"
npm pkg set devDependencies."@types/express"="^5.0.6"
npm pkg set devDependencies."@types/node"="^26.1.1"

cd - > /dev/null


# ==============================================================================
# SECTION 5: SOURCE CODE & ENTRYPOINT GENERATION
# ==============================================================================

# 1. Environment configuration file
cat << EOF > "$BASE/src/config/.env"
PORT=${PORT}
EOF

# 2. Sample Controller
cat << EOF > "$BASE/src/controllers/service.controller.ts"
import { Request, Response } from "express";

export const test = (req: Request, res: Response) => {
  return res.status(200).json({ status: "success", service: "${SERVICE_NAME}" });
};
EOF

# 3. Service Sub-routes
cat << EOF > "$BASE/src/routes/service.routes.ts"
import { Router } from "express";
import { test } from "../controllers/service.controller";

const router = Router();

router.get("/test", test);

export default router;
EOF

# 4. Main Router
cat << EOF > "$BASE/src/routes/index.ts"
import { Router } from "express";
import serviceRoutes from "./service.routes";

const router = Router();

router.use("/", serviceRoutes);

export default router;
EOF

# 5. Express Application Entrypoint
cat << EOF > "$BASE/src/index.ts"
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(__dirname, "./config/.env"),
});

import express from "express";
import serviceRoutes from "./routes/index";
import { attachUserHeader, logger } from "@anime-hub/common";

const PORT = process.env.PORT || ${PORT};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachUserHeader);

app.get("/", (req, res) => {
  res.send("Hello World from ${SERVICE_NAME}");
});

app.use("/", serviceRoutes);

app.listen(PORT, () => {
  logger.info(\`${SERVICE_NAME} is running on port \${PORT}\`);
});
EOF


# ==============================================================================
# SECTION 6: DOCKER COMPOSE INTEGRATION
# ==============================================================================

cat << EOF > service_tmp.yml
  ${SERVICE_NAME}:
    profiles: ["server", "all"]
    build:
      context: .
      dockerfile: ./server/services/${SERVICE_NAME}/Dockerfile
      target: dev
    env_file:
      - ./server/.env
      - ./server/services/${SERVICE_NAME}/src/config/.env
    ports:
      - "${PORT}:${PORT}"
    environment:
      - CHOKIDAR_USEPOLLING=true
    develop:
      watch:
        - *watch-common
        - action: sync
          path: ./server/services/${SERVICE_NAME}/src
          target: /app/server/services/${SERVICE_NAME}/src
        - action: rebuild
          path: ./server/services/${SERVICE_NAME}/package.json
    networks:
      - anime-hub-network
EOF

# Inject new service right before 'networks:' declaration via AWK
awk '
/^networks:/ {
    while ((getline line < "service_tmp.yml") > 0) {
        print line
    }
    close("service_tmp.yml")
}
{ print }
' docker-compose.yml > docker-compose.tmp && mv docker-compose.tmp docker-compose.yml

# Cleanup temporary file
rm -f service_tmp.yml

echo "✅ Service '${SERVICE_NAME}' created successfully on port ${PORT}!"