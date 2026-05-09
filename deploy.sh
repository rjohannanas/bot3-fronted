#!/bin/bash
set -e

echo "🚀 Iniciando despliegue del Frontend (Bot003) a Cloud Run..."

PROJECT_ID="servicios-492716"
REGION="us-central1"
SERVICE_NAME="agente-financiero"

echo "🔒 Preparando variables de entorno (filtrando secretos)..."
# Next.js necesita las variables NEXT_PUBLIC_ durante el tiempo de build.
# Creamos un .env.production temporal que NO incluye tus contraseñas de BD.
grep '^NEXT_PUBLIC_' .env > .env.production || true

echo "☁️ Construyendo y desplegando en Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated

echo "🧹 Limpiando archivos temporales..."
rm -f .env.production

echo "✅ ¡Despliegue completado con éxito!"
