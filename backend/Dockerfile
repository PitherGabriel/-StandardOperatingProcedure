# Backend Dockerfile - DESARROLLO
FROM python:3.11-slim

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    libxml2-dev \
    libxslt-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Variables de entorno para produccion
ENV PYTHONUNBUFFERED=1
ENV FLASK_ENV=production

# Exponer port
EXPOSE 5000


# Run with Gunicorn (4 workers is a good default)
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:5000", "api_server:app"]