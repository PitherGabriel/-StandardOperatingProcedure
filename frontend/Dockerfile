# Frontend Dockerfile - DESARROLLO
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

ARG VITE_BACKEND_API_URL=/api
ENV VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL

RUN npm run build

# ---------- Production stage ----------
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]