#!/bin/bash
set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}  ⚠️  ELIMINAR RECURSOS DE AZURE${NC}"
echo -e "${RED}========================================${NC}\n"

RESOURCE_GROUP="garage-app-rg"

echo -e "${YELLOW}Esto eliminará TODOS los recursos:${NC}"
echo -e "  • Container App"
echo -e "  • Container Registry"
echo -e "  • PostgreSQL Server (y su base de datos)"
echo -e "  • Redis Cache"
echo -e "  • Container App Environment"
echo -e "  • Resource Group completo"
echo ""
echo -e "${RED}⚠️  ESTA ACCIÓN NO SE PUEDE DESHACER${NC}"
echo -e "${RED}⚠️  SE PERDERÁN TODOS LOS DATOS${NC}\n"

read -p "¿Estás seguro? Escribe 'DELETE' para confirmar: " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo -e "\n${GREEN}Cancelado. No se eliminó nada.${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Eliminando Resource Group y todos sus recursos...${NC}"
az group delete \
    --name $RESOURCE_GROUP \
    --yes \
    --no-wait

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ ELIMINACIÓN INICIADA${NC}"
echo -e "${GREEN}========================================${NC}\n"
echo -e "${YELLOW}La eliminación continúa en segundo plano.${NC}"
echo -e "${YELLOW}Verifica el estado en Azure Portal.${NC}\n"
