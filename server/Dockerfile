FROM dhi.io/node:24-alpine3.23-dev AS dev

# 1. Copia prima i file tsconfig e package di root nella radice /app
COPY --chown=node:node package*.json /app/
COPY --chown=node:node tsconfig*.json /app/

# 2. Imposta la WORKDIR dentro /app/server
WORKDIR /app/server

# 3. Copia i manifest del server e delle sue dipendenze
COPY --chown=node:node server/package*.json ./
COPY --chown=node:node server/tsconfig*.json ./
COPY --chown=node:node server/packages/common/package*.json ./packages/common/
COPY --chown=node:node server/packages/common/tsconfig*.json ./packages/common/

# 4. Installa le dipendenze
RUN --mount=type=cache,target=/root/.npm \
    npm install

# 5. Copia i sorgenti di common e del server
COPY --chown=node:node server/packages/common ./packages/common
COPY --chown=node:node server/src ./src

# 6. COMPILA COMMON (il flag --skipLibCheck evita gli errori sui .d.ts di Supabase e Node)
RUN npx tsc --project ./packages/common/tsconfig.json --skipLibCheck

EXPOSE 9999

USER node

# 7. Avvia il monolith direttamente nella WORKDIR corrente
CMD ["npm", "run", "devProd"]