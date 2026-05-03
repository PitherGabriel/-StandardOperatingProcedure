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
ARG VITE_BUSINESS_NAME="Mi Tienda"
ARG VITE_BUSINESS_RUC="0000000000001"
ARG VITE_BUSINESS_ADDRESS="Dirección del negocio"
ARG VITE_PRINT_BRIDGE_URL="http://localhost:6543"

ENV VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL
ENV VITE_BUSINESS_NAME=$VITE_BUSINESS_NAME
ENV VITE_BUSINESS_RUC=$VITE_BUSINESS_RUC
ENV VITE_BUSINESS_ADDRESS=$VITE_BUSINESS_ADDRESS
ENV VITE_PRINT_BRIDGE_URL=$VITE_PRINT_BRIDGE_URL

RUN npm run build

# ---------- Production stage ----------
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]