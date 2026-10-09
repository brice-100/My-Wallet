# ==========================================
# Étape 1 : Build de l'application Vite (Node.js)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Dépendances système minimales
RUN apk add --no-cache libc6-compat

# Copie des manifestes de dépendances
COPY package.json package-lock.json ./

# Installation propre et figée des dépendances
RUN npm ci

# Variables d'environnement pour le build Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

# Copie du code source
COPY . .

# Compilation TypeScript et bundle de production Vite
RUN npm run build

# ==========================================
# Étape 2 : Serveur Web de Production (Nginx)
# ==========================================
FROM nginx:1.27-alpine AS runner

# Configuration Nginx optimisée pour SPA React
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des assets compilés depuis l'étape builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposition du port HTTP standard
EXPOSE 80

# Démarrage de Nginx en premier plan
CMD ["nginx", "-g", "daemon off;"]
