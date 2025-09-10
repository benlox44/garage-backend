# 🚀 Full-Stack Project

Backend Project for UCN (Cloud Computing)

## 🐳 Run the project (Docker)

```bash
docker compose -f docker-compose.dev.yml up   # Dev
```

- Backend: http://localhost:3000

> Make sure to set up .env files

Environment additions:
- `backend/.env`: add `ADMIN_EMAILS` as a comma/space/semicolon separated list. Any user who registers or logs in with an email in this list is promoted to ADMIN automatically.
  - Example: `ADMIN_EMAILS=admin1@example.com, admin2@example.com;admin3@example.com`

## 📁 Project Structure

- `/` - Docker setup and global configuration
- `/backend` - NestJS API with authentication and user management
- `/frontend` - (planned) web client interface

## 📌 Stack

- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL 15
- **Authentication**: JWT + Email confirmation + single-use tokens (JTI)
- **Token Registry & Lockouts**: Redis
- **DevOps**: Docker + Docker Compose

## 🔑 Auth Features

- User registration and login with JWT sessions
- Email confirmation (on signup and when changing email)
- Password reset (with single-use links)
- Revert email change
- Account lockout after multiple failed login attempts
- Unlock account via email link
- Redis token invalidation via jti

## 🧪 Local Development Tools

Even though Docker runs everything, the following commands can be useful for local-only tasks:

### ✅ Lint

Work for `backend` & `frontend`

```bash
npm run lint         # Auto-fix issues
npm run lint:check   # Check only
```

### 🧪 Test

```bash
npm run test
```

## 🗂️ To do List

- frontend
