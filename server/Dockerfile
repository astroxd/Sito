FROM dhi.io/node:24-alpine3.23-dev AS dev

WORKDIR /app

# 1. Copia i manifest e i tsconfig necessari
COPY --chown=node:node package*.json ./
COPY --chown=node:node tsconfig*.json ./
COPY --chown=node:node server/package*.json ./server/
COPY --chown=node:node server/tsconfig*.json ./server/
COPY --chown=node:node server/packages/common/package*.json ./server/packages/common/
COPY --chown=node:node server/packages/common/tsconfig*.json ./server/packages/common/

# 2. Installa le dipendenze nella radice e nel server
RUN --mount=type=cache,target=/root/.npm \
    npm install && npm install --prefix server

# 3. Copia i sorgenti di common e di server
COPY --chown=node:node server/packages/common ./server/packages/common
COPY --chown=node:node server/src ./server/src

# 4. COMPILA COMMON (Genera la cartella dist/)
RUN npm run build --prefix server/packages/common

EXPOSE 9999

USER node

# 5. Avvia il monolith
CMD ["sh", "-c", "cd server && npm run devProd"]