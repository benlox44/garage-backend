#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load .env variables properly (handle values with spaces and commas)
if [ -f .env ]; then
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        # Remove leading/trailing whitespace from value
        value=$(echo "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
        export "$key=$value"
    done < .env
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  GARAGE BACKEND - AZURE DEPLOYMENT${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# Azure Configuration (use .env or defaults)
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-garage-app-rg}"
LOCATION="${AZURE_LOCATION:-eastus}"
POSTGRES_LOCATION="${AZURE_POSTGRES_LOCATION:-westus}"
ACR_NAME="${AZURE_ACR_NAME:-garageappregistry}"
POSTGRES_SERVER="${AZURE_POSTGRES_SERVER:-garage-db-server}"
POSTGRES_ADMIN="${DATABASE_USER:-garage_admin}"
POSTGRES_DB="${DATABASE_NAME:-garage}"
REDIS_NAME="${AZURE_REDIS_NAME:-garage-redis}"
CONTAINER_ENV="${AZURE_CONTAINER_ENV:-garage-env}"
CONTAINER_APP="${AZURE_CONTAINER_APP:-garage-backend}"

# Validate required variables from .env
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo -e "${RED}❌ Error: POSTGRES_PASSWORD not set${NC}"
    echo -e "${YELLOW}Set it in .env file${NC}"
    exit 1
fi

if [ -z "$EMAIL_USER" ] || [ -z "$EMAIL_PASS" ]; then
    echo -e "${RED}❌ Error: EMAIL_USER and EMAIL_PASS must be set${NC}"
    exit 1
fi

if [ -z "$ADMIN_EMAILS" ]; then
    echo -e "${RED}❌ Error: ADMIN_EMAILS must be set${NC}"
    exit 1
fi

if [ -z "$CLIENT_URL" ]; then
    echo -e "${RED}❌ Error: CLIENT_URL must be set${NC}"
    exit 1
fi

# Generate random JWT Secret for Azure
JWT_SECRET=$(openssl rand -base64 32)

echo -e "${GREEN}[1/9]${NC} Verificando login en Azure..."
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}No estás logueado. Ejecutando 'az login'...${NC}"
    az login
else
    ACCOUNT=$(az account show --query name -o tsv)
    echo -e "${GREEN}✓${NC} Ya estás logueado como: $ACCOUNT"
fi

echo -e "\n${GREEN}[2/9]${NC} Creando Resource Group..."
az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --output table

echo -e "\n${GREEN}[3/9]${NC} Creando Azure Container Registry..."
az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $ACR_NAME \
    --sku Basic \
    --admin-enabled true \
    --output table

echo -e "\n${GREEN}[4/9]${NC} Building y pusheando imagen Docker..."
az acr build \
    --registry $ACR_NAME \
    --image garage-backend:latest \
    --file Dockerfile \
    .

echo -e "\n${GREEN}[5/9]${NC} Creando PostgreSQL Flexible Server..."
az postgres flexible-server create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER \
    --location $POSTGRES_LOCATION \
    --admin-user $POSTGRES_ADMIN \
    --admin-password $POSTGRES_PASSWORD \
    --sku-name Standard_B1ms \
    --tier Burstable \
    --version 15 \
    --storage-size 32 \
    --public-access 0.0.0.0 \
    --output table

echo -e "\n${GREEN}[6/9]${NC} Creando base de datos..."
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $POSTGRES_SERVER \
    --database-name $POSTGRES_DB \
    --output table

echo -e "\n${GREEN}[7/9]${NC} Creando Azure Cache for Redis..."
az redis create \
    --resource-group $RESOURCE_GROUP \
    --name $REDIS_NAME \
    --location $LOCATION \
    --sku Basic \
    --vm-size c0 \
    --enable-non-ssl-port false \
    --output table

echo -e "\n${GREEN}[8/9]${NC} Obteniendo credenciales de Redis..."
REDIS_KEY=$(az redis list-keys --resource-group $RESOURCE_GROUP --name $REDIS_NAME --query primaryKey -o tsv)
REDIS_HOST="$REDIS_NAME.redis.cache.windows.net"

echo -e "\n${GREEN}[9/9]${NC} Creando Container App Environment..."
az containerapp env create \
    --name $CONTAINER_ENV \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --output table

echo -e "\n${GREEN}[10/10]${NC} Desplegando Container App..."
az containerapp create \
    --name $CONTAINER_APP \
    --resource-group $RESOURCE_GROUP \
    --environment $CONTAINER_ENV \
    --image $ACR_NAME.azurecr.io/garage-backend:latest \
    --target-port 3000 \
    --ingress external \
    --transport auto \
    --registry-server $ACR_NAME.azurecr.io \
    --registry-username $ACR_NAME \
    --registry-password $(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv) \
    --cpu 0.5 \
    --memory 1.0Gi \
    --min-replicas 1 \
    --max-replicas 3 \
    --output table

echo -e "\n${GREEN}Habilitando sticky sessions para WebSocket...${NC}"
az containerapp ingress sticky-sessions set \
    --name $CONTAINER_APP \
    --resource-group $RESOURCE_GROUP \
    --affinity sticky

# Obtener URL de la app
APP_URL=$(az containerapp show \
    --name $CONTAINER_APP \
    --resource-group $RESOURCE_GROUP \
    --query properties.configuration.ingress.fqdn \
    -o tsv)

# Actualizar con variables de entorno incluyendo BASE_URL
echo -e "\n${GREEN}Configurando variables de entorno...${NC}"
az containerapp update \
    --name $CONTAINER_APP \
    --resource-group $RESOURCE_GROUP \
    --set-env-vars \
        NODE_ENV=production \
        PORT=3000 \
        DATABASE_HOST=$POSTGRES_SERVER.postgres.database.azure.com \
        DATABASE_PORT=5432 \
        DATABASE_USER=$POSTGRES_ADMIN \
        DATABASE_PASSWORD=$POSTGRES_PASSWORD \
        DATABASE_NAME=$POSTGRES_DB \
        DATABASE_SSL=true \
        DB_SYNCHRONIZE=true \
        REDIS_HOST=$REDIS_HOST \
        REDIS_PORT=6380 \
        REDIS_PASSWORD=$REDIS_KEY \
        REDIS_TLS=true \
        JWT_SECRET=$JWT_SECRET \
        EMAIL_USER=$EMAIL_USER \
        EMAIL_PASS=$EMAIL_PASS \
        ADMIN_EMAILS="$ADMIN_EMAILS" \
        BASE_URL=https://$APP_URL \
        CLIENT_URL=$CLIENT_URL \
    --output none

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ DEPLOYMENT COMPLETADO${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}🌐 URL:${NC} https://$APP_URL"
echo -e "${YELLOW}📊 Ver logs:${NC} az containerapp logs show -n $CONTAINER_APP -g $RESOURCE_GROUP --follow"
echo -e "${YELLOW}🔄 Actualizar:${NC} Ejecuta este script nuevamente"
echo -e "${YELLOW}🗑️  Eliminar:${NC} ./azure/cleanup-azure.sh"

# Guardar configuración
cat > azure-deployment-info.txt << EOF
DEPLOYMENT INFORMATION
======================
Resource Group: $RESOURCE_GROUP
Location: $LOCATION

Container Registry: $ACR_NAME.azurecr.io
Container App: $CONTAINER_APP
App URL: https://$APP_URL

PostgreSQL Server: $POSTGRES_SERVER.postgres.database.azure.com
Database: $POSTGRES_DB
Username: $POSTGRES_ADMIN

Redis: $REDIS_HOST:6380

IMPORTANT: 
- DB_SYNCHRONIZE is set to TRUE (tables will be created automatically)
- Run ./azure/set-db-sync-false.sh after verifying everything works
EOF

echo -e "\n${GREEN}✓${NC} Información guardada en: azure-deployment-info.txt"
echo -e "\n${YELLOW}⚠️  IMPORTANTE:${NC}"
echo -e "${YELLOW}   - DB_SYNCHRONIZE está en TRUE (las tablas se crean automáticamente)${NC}"
echo -e "${YELLOW}   - Para nuevas tablas: ejecuta este script nuevamente${NC}"
echo -e "${YELLOW}   - Para eliminar todo: ./azure/cleanup-azure.sh${NC}\n"
