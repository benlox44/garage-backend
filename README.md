# 🚀 Full-Stack Project

Backend Project for UCN (Cloud Computing)

## 🐳 Run the project (Docker)

### Initial Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** with your actual values (see `.env.example` for documentation)

3. **Install dependencies** (required):
   ```bash
   npm install
   ```
   > This is needed for:
   > - **IDE support**: Intellisense, error detection, and code navigation
   > - **Faster Docker builds**: Docker can use local node_modules as cache
   >
   > If you encounter security vulnerabilities, run: `npm audit fix`

4. **Start the project:**
   ```bash
   docker compose up
   ```

- Backend: http://localhost:3000

## 📌 Stack

- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL 15
- **Authentication**: JWT + Email confirmation + single-use tokens (JTI)
- **Token Registry & Lockouts**: Redis
- **DevOps**: Docker + Docker Compose
  
## �📡 API Response Format

All endpoints follow a consistent response format:

```typescript
{
  "success": boolean,  // Operation status (true/false)
  "message": string,   // User-friendly message for UI feedback
  "data": any         // Response payload (object, array, or null)
}
```

## 🔑 Auth Features

- User registration and login with JWT sessions
- Email confirmation (on signup and when changing email)
- Password reset (with single-use links)
- Revert email change
- Account lockout after multiple failed login attempts
- Unlock account via email link
- Redis token invalidation via jti

## 🚗 Application Features

### Work Orders System
- Create work orders for vehicles with services and items
- Track work order status (pending_approval, in_progress, completed, cancelled)
- Add items (spare parts, tools, services) with approval workflow
- Client approval for items requiring authorization
- Add notes with text and optional images
- Automatic vehicle status updates

### Notifications System
- Automatic notifications for work order events
- Real-time updates for status changes
- Notification for new notes and items
- Mark notifications as read/unread
- Filter unread notifications

### Vehicle Management
- Register and manage client vehicles
- Track vehicle status (available, in_service, ready_for_pickup)
- Automatic status updates based on work orders
- Associate vehicles with work orders

### Appointments & Schedules
- Mechanics can set their available schedules
- Clients can book appointments
- Appointment approval/rejection workflow
- Schedule validation and conflict prevention

## 🧪 Development Commands (Inside Container)

All development is done through Docker. To run commands inside the container:

```bash
# Lint code
docker compose exec backend npm run lint

# Check linting without fixing
docker compose exec backend npm run lint:check

# Run tests
docker compose exec backend npm run test

# Access container shell
docker compose exec backend bash
```

## 📝 Useful Docker Commands

```bash
# Start containers in detached mode
docker compose up -d

# Stop containers
docker compose down

# View logs
docker compose logs -f backend

# Restart backend only
docker compose restart backend

# Rebuild containers (after dependency changes)
docker compose up --build

# Reset database (deletes all data and recreates from scratch)
docker compose down -v
```
