# FROM dhi.io/node:24-alpine3.23-dev AS common-builder

# WORKDIR /app

# # 1. Copia i package.json trasversali
# COPY package*.json ./
# COPY common/package*.json ./common/

# # 2. Installa le dipendenze usando la cache di npm per velocizzare
# RUN --mount=type=cache,target=/root/.npm \
#     npm install

# # 3. Copia il codice sorgente di common e compila
# COPY common ./common
# RUN npm run build --prefix common