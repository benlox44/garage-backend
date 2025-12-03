# Azure Deployment Scripts

## 📋 Prerequisites

1. **Azure CLI** installed and configured
2. **Docker** installed (for building images)
3. **.env file** configured with required variables

## 🚀 Deployment

### 1. Configure .env

Make sure your `.env` file has these variables:

```bash
# Required for Azure deployment
POSTGRES_PASSWORD=your_secure_password
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
ADMIN_EMAILS=admin@example.com
CLIENT_URL=https://your-frontend-url.com

# Optional (defaults provided)
AZURE_RESOURCE_GROUP=garage-app-rg
AZURE_LOCATION=eastus
AZURE_ACR_NAME=garageappregistry
```

### 2. Deploy to Azure

```bash
./azure/deploy-azure.sh
```

This will:
- Create Azure Resource Group
- Create Container Registry and build/push Docker image
- Create PostgreSQL Flexible Server
- Create Redis Cache
- Deploy Container App with WebSocket support
- Configure environment variables
- Enable sticky sessions for WebSocket

### 3. Access your API

After deployment, the script will show:
```
🌐 URL: https://your-app.azurecontainerapps.io
```

## 🔥 Delete Resources

To remove all Azure resources:

```bash
./azure/cleanup-azure.sh
```

Type `DELETE` to confirm. This will delete:
- Container App
- Container Registry
- PostgreSQL Server and database
- Redis Cache
- Complete Resource Group

⚠️ **This action cannot be undone!**

## 🔌 WebSocket Configuration

The deployment automatically configures:
- ✅ `--transport auto` for WebSocket support
- ✅ Sticky sessions enabled
- ✅ CORS configured from CLIENT_URL

### Testing WebSocket from Frontend

```javascript
import { io } from 'socket.io-client';

const socket = io('https://your-app.azurecontainerapps.io', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('notification', (data) => {
  console.log('Notification:', data);
});
```

## 📊 View Logs

```bash
az containerapp logs show \
  -n garage-backend \
  -g garage-app-rg \
  --follow
```

## 🔄 Update Deployment

To update the app after code changes, run `deploy-azure.sh` again. It will:
- Rebuild the Docker image
- Update the Container App
- Keep database and Redis data

## 📝 Notes

- **DB_SYNCHRONIZE** is set to `true` on first deployment (auto-creates tables)
- JWT_SECRET is auto-generated for Azure (different from local)
- WebSocket requires HTTP/2 or higher (automatically configured)
- Sticky sessions ensure Socket.IO works across multiple replicas
