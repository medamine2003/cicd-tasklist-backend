# ---- Build stage ----
FROM node:20-alpine AS builder

# Correction des failles de sécurité de l'OS (libcrypto3, libssl3...)
RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS production

# On applique également les correctifs de sécurité OS sur l'image finale de prod
RUN apk update && apk upgrade --no-cache

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma

# Installation des dépendances de prod
RUN npm ci --omit=dev

# Optionnel : Tente de résoudre les vulnérabilités restantes dans node_modules de prod
# sans installer les dépendances de développement
RUN npm audit fix --omit=dev || true

RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]