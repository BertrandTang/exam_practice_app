# Étape 1 : build de l'application React (Vite)
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# L'URL de l'API est intégrée au build
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Étape 2 : service des fichiers statiques par nginx (utilisateur non-root, port 8080)
FROM nginxinc/nginx-unprivileged:alpine
# Origine de l'API autorisée dans la Content-Security-Policy (substituée au démarrage)
ENV API_ORIGIN=http://localhost:5000
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
