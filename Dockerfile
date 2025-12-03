FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=build /app/dist ./dist

# Copy email templates (needed for mail service)
COPY --from=build /app/src/mail/templates ./dist/mail/templates

EXPOSE 3000
CMD ["node", "dist/main.js"]
