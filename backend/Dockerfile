# Image de production de l'API
FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

# Dépendances de production uniquement (couche mise en cache)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Code source, propriété de l'utilisateur non-root "node"
COPY --chown=node:node . .
USER node

EXPOSE 5000

# Vérifie /health (API + MongoDB) ; Render fournit PORT, 5000 par défaut
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-5000}/health" || exit 1

CMD ["node", "server.js"]
