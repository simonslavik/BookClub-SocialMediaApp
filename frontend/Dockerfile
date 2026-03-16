# ── Stage 1: Build ──────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build args become VITE_ env vars at build time
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_NOTIFICATION_WS_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_USER_SERVICE_URL
ARG VITE_COLLAB_EDITOR_URL

RUN npm run build

# ── Stage 2: Serve with nginx ──────────────────────────
FROM nginx:1.27-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
