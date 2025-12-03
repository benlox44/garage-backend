#!/bin/bash
set -e

# Load .env if exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}  ⚠️  DELETE AZURE RESOURCES${NC}"
echo -e "${RED}========================================${NC}\n"

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-garage-app-rg}"

echo -e "${YELLOW}This will DELETE ALL resources in: ${RESOURCE_GROUP}${NC}"
echo -e "  • Container App"
echo -e "  • Container Registry"
echo -e "  • PostgreSQL Server (and database)"
echo -e "  • Redis Cache"
echo -e "  • Container App Environment"
echo -e "  • Complete Resource Group"
echo ""
echo -e "${RED}⚠️  THIS ACTION CANNOT BE UNDONE${NC}"
echo -e "${RED}⚠️  ALL DATA WILL BE LOST${NC}\n"

read -p "Are you sure? Type 'DELETE' to confirm: " CONFIRM

if [ "$CONFIRM" != "DELETE" ]; then
    echo -e "\n${GREEN}Cancelled. Nothing was deleted.${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Deleting Resource Group and all resources...${NC}"
az group delete \
    --name $RESOURCE_GROUP \
    --yes \
    --no-wait

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ DELETION STARTED${NC}"
echo -e "${GREEN}========================================${NC}\n"
echo -e "${YELLOW}Deletion continues in background.${NC}"
echo -e "${YELLOW}Check status in Azure Portal.${NC}\n"
