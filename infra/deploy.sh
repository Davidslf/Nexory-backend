#!/bin/bash
# ============================================================================
# deploy.sh — Nexory · Deploy completo en Azure
# ============================================================================
# Uso: bash infra/deploy.sh
# ============================================================================

set -e

# ── Configuración ────────────────────────────────────────────────────────────

RESOURCE_GROUP="nexory-rg"
LOCATION="brazilsouth"
ENVIRONMENT="dev"
DB_ADMIN_USER="nexoryadmin"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Nexory — Deploy en Azure             ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Verificar login ──────────────────────────────────────────────────────────

echo "▶ Verificando sesión de Azure..."
az account show > /dev/null 2>&1 || { echo "❌ No estás autenticado. Corre: az login"; exit 1; }
echo "✓ Sesión activa"

# ── Pedir contraseñas de forma segura ────────────────────────────────────────

echo ""
read -s -p "🔒 Contraseña para PostgreSQL (mín. 8 caracteres, mayúscula, número y símbolo): " DB_PASSWORD
echo ""
read -s -p "🔒 Clave JWT (cualquier texto largo y aleatorio): " JWT_SECRET
echo ""

# ── Crear Resource Group ─────────────────────────────────────────────────────

echo ""
echo "▶ Creando grupo de recursos '$RESOURCE_GROUP' en $LOCATION..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output none
echo "✓ Grupo de recursos listo"

# ── Desplegar infraestructura con Bicep ──────────────────────────────────────

echo ""
echo "▶ Desplegando infraestructura (PostgreSQL, ACR, Container Apps)..."
echo "  Esto tarda 5-10 minutos, espera..."
echo ""

DEPLOY_OUTPUT=$(az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "$(dirname "$0")/main.bicep" \
  --parameters \
    environmentName="$ENVIRONMENT" \
    dbAdminPassword="$DB_PASSWORD" \
    dbAdminUser="$DB_ADMIN_USER" \
    jwtSecret="$JWT_SECRET" \
  --output json)

echo "✓ Infraestructura desplegada"

# ── Obtener outputs ──────────────────────────────────────────────────────────

ACR_SERVER=$(echo "$DEPLOY_OUTPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['properties']['outputs']['acrLoginServer']['value'])")
ACR_NAME=$(echo "$DEPLOY_OUTPUT"   | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['properties']['outputs']['acrName']['value'])")
PG_HOST=$(echo "$DEPLOY_OUTPUT"    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['properties']['outputs']['postgresHost']['value'])")
CAE_NAME=$(echo "$DEPLOY_OUTPUT"   | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['properties']['outputs']['containerAppEnvName']['value'])")

echo ""
echo "📦 Recursos creados:"
echo "   ACR:       $ACR_SERVER"
echo "   PostgreSQL: $PG_HOST"
echo "   Container App Env: $CAE_NAME"

# ── Aplicar schema Prisma a la BD ────────────────────────────────────────────

echo ""
echo "▶ Aplicando schema Prisma a la base de datos..."
DATABASE_URL="postgresql://${DB_ADMIN_USER}:${DB_PASSWORD}@${PG_HOST}:5432/nexory_db?sslmode=require"

cd "$(dirname "$0")/../nexory-backend"
DATABASE_URL="$DATABASE_URL" npx prisma db push --accept-data-loss
echo "✓ Schema aplicado"

# ── Build y push del backend a ACR ──────────────────────────────────────────

echo ""
echo "▶ Construyendo imagen Docker del backend..."
az acr login --name "$ACR_NAME"

docker build -t "$ACR_SERVER/nexory-backend:latest" .
docker push "$ACR_SERVER/nexory-backend:latest"
echo "✓ Imagen del backend subida"

# ── Crear Container App del backend ─────────────────────────────────────────

echo ""
echo "▶ Desplegando backend como Container App..."

ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)

az containerapp create \
  --name "nexory-backend-${ENVIRONMENT}" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CAE_NAME" \
  --image "$ACR_SERVER/nexory-backend:latest" \
  --registry-server "$ACR_SERVER" \
  --registry-username "$ACR_NAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 3000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 2 \
  --cpu 0.5 \
  --memory 1.0Gi \
  --env-vars \
    NODE_ENV=production \
    PORT=3000 \
    JWT_SECRET="$JWT_SECRET" \
    JWT_EXPIRES_IN=24h \
    DATABASE_URL="$DATABASE_URL" \
    FRONTEND_URL=https://nexory-frontend.azurestaticapps.net \
  --output none

BACKEND_URL=$(az containerapp show \
  --name "nexory-backend-${ENVIRONMENT}" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.configuration.ingress.fqdn" -o tsv)

echo "✓ Backend desplegado en: https://$BACKEND_URL"

# ── Resumen final ────────────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ Deploy completado                                    ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Backend:    https://$BACKEND_URL"
echo "║  BD Host:    $PG_HOST"
echo "║"
echo "║  Próximo paso: deploy del frontend"
echo "║    cd nexory-frontend && bash infra/deploy-frontend.sh"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
