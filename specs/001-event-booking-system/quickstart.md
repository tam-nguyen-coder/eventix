# Quickstart: Event Booking System

**Feature Branch**: `001-event-booking-system`  
**Date**: 2025-12-11

This guide provides step-by-step instructions to set up and run the Event Booking System locally.

---

## Prerequisites

Ensure the following tools are installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| npm | 10.x | Package manager |
| Docker | 24.x+ | Containers |
| Docker Compose | 2.x+ | Multi-container orchestration |

Verify installations:

```bash
node --version    # v20.x.x
npm --version     # 10.x.x
docker --version  # Docker version 24.x.x
docker compose version  # Docker Compose version v2.x.x
```

---

## 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/eventix.git
cd eventix

# Checkout the feature branch
git checkout 001-event-booking-system

# Install dependencies
npm install
```

---

## 2. Environment Configuration

Create environment files for each service:

```bash
# Copy environment templates
cp apps/api-gateway/.env.example apps/api-gateway/.env
cp apps/catalog-service/.env.example apps/catalog-service/.env
cp apps/booking-service/.env.example apps/booking-service/.env
cp apps/payment-service/.env.example apps/payment-service/.env
```

### API Gateway `.env`

```env
# Server
PORT=3000
NODE_ENV=development

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.eventix.com
AUTH0_CLIENT_ID=your-client-id

# Services (internal)
CATALOG_SERVICE_URL=http://localhost:3001
BOOKING_SERVICE_URL=http://localhost:3002
```

### Catalog Service `.env`

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=eventix_catalog_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Kafka
KAFKA_BROKERS=localhost:9092
```

### Booking Service `.env`

```env
# Server
PORT=3002
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=eventix_booking_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=booking-service-consumer

# Catalog Service (for seat validation)
CATALOG_SERVICE_URL=http://localhost:3001
```

### Payment Service `.env`

```env
# Server
PORT=3003
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=eventix_payment_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=payment-service-consumer
```

---

## 3. Start Infrastructure

Start PostgreSQL and Redpanda using Docker Compose:

```bash
# Start infrastructure services
docker compose -f docker/docker-compose.yml up -d

# Verify services are running
docker compose -f docker/docker-compose.yml ps
```

Expected output:

```
NAME                    STATUS    PORTS
eventix-postgres        running   0.0.0.0:5432->5432/tcp
eventix-redpanda        running   0.0.0.0:9092->9092/tcp
eventix-redpanda-console running  0.0.0.0:8080->8080/tcp
```

### Create Databases

```bash
# Connect to PostgreSQL and create databases
docker exec -it eventix-postgres psql -U postgres -c "CREATE DATABASE eventix_catalog_db;"
docker exec -it eventix-postgres psql -U postgres -c "CREATE DATABASE eventix_booking_db;"
docker exec -it eventix-postgres psql -U postgres -c "CREATE DATABASE eventix_payment_db;"
```

### Create Kafka Topics

```bash
# Create topics using rpk (Redpanda CLI)
docker exec -it eventix-redpanda rpk topic create booking.created --partitions 6
docker exec -it eventix-redpanda rpk topic create booking.cancelled --partitions 6
docker exec -it eventix-redpanda rpk topic create payment.success --partitions 6
docker exec -it eventix-redpanda rpk topic create payment.failed --partitions 6

# Verify topics
docker exec -it eventix-redpanda rpk topic list
```

---

## 4. Run Database Migrations

```bash
# Run migrations for all services
npx nx run catalog-service:migration:run
npx nx run booking-service:migration:run
npx nx run payment-service:migration:run
```

---

## 5. Start Services

### Option A: Start All Services (Recommended)

```bash
# Start all services in parallel
npx nx run-many --target=serve --projects=api-gateway,catalog-service,booking-service,payment-service --parallel=4
```

### Option B: Start Services Individually

Open separate terminal windows for each service:

```bash
# Terminal 1: API Gateway
npx nx serve api-gateway

# Terminal 2: Catalog Service
npx nx serve catalog-service

# Terminal 3: Booking Service
npx nx serve booking-service

# Terminal 4: Payment Service
npx nx serve payment-service
```

### Verify Services

| Service | URL | Health Check |
|---------|-----|--------------|
| API Gateway | http://localhost:3000 | http://localhost:3000/health |
| Catalog Service | http://localhost:3001 | http://localhost:3001/health |
| Booking Service | http://localhost:3002 | http://localhost:3002/health |
| Payment Service | http://localhost:3003 | http://localhost:3003/health |

```bash
# Check all health endpoints
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

---

## 6. Auth0 Setup

### Create Auth0 Application

1. Log in to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create a new API:
   - Name: `Eventix API`
   - Identifier: `https://api.eventix.com`
   - Signing Algorithm: RS256
3. Create a new Application:
   - Type: Single Page Application (for testing) or Machine to Machine
4. Note the credentials and update `.env` files

### Configure Roles

Create custom roles in Auth0:

1. Go to User Management → Roles
2. Create role: `admin`
3. Create role: `customer`

Add role claim to tokens:

1. Go to Actions → Library → Create Action
2. Add custom action to include roles in token:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://eventix.com';
  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  }
};
```

---

## 7. API Documentation

Access Swagger UI at: **http://localhost:3000/api/docs**

### Quick API Test (without Auth)

```bash
# List events (public endpoint)
curl http://localhost:3000/api/v1/events

# Get event details
curl http://localhost:3000/api/v1/events/{eventId}

# Get seat availability
curl http://localhost:3000/api/v1/events/{eventId}/seats
```

### Authenticated Requests

```bash
# Get access token from Auth0 (example with client credentials)
ACCESS_TOKEN=$(curl --request POST \
  --url https://your-tenant.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{"client_id":"...","client_secret":"...","audience":"https://api.eventix.com","grant_type":"client_credentials"}' \
  | jq -r '.access_token')

# Create booking (authenticated)
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId": "uuid", "seatIds": ["uuid1", "uuid2"]}'
```

---

## 8. Running Tests

```bash
# Run all tests
npx nx run-many --target=test --all

# Run tests for specific service
npx nx test catalog-service
npx nx test booking-service
npx nx test payment-service

# Run with coverage
npx nx test catalog-service --coverage

# Run E2E tests
npx nx e2e api-gateway-e2e
```

---

## 9. Development Workflow

### Common Nx Commands

```bash
# Generate a new library
npx nx g @nx/nest:library my-lib

# Generate a new service
npx nx g @nx/nest:service my-service --project=catalog-service

# View dependency graph
npx nx graph

# Run affected tests only
npx nx affected:test

# Build all projects
npx nx run-many --target=build --all
```

### Code Quality

```bash
# Lint all projects
npx nx run-many --target=lint --all

# Format code
npm run format

# Type check
npx nx run-many --target=typecheck --all
```

---

## 10. Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker logs eventix-postgres

# Verify connection
docker exec -it eventix-postgres psql -U postgres -l
```

### Kafka Connection Issues

```bash
# Check Redpanda status
docker exec -it eventix-redpanda rpk cluster info

# View topic details
docker exec -it eventix-redpanda rpk topic describe booking.created

# Access Redpanda Console
open http://localhost:8080
```

### Service Won't Start

1. Check if ports are in use: `lsof -i :3000`
2. Verify environment variables are set
3. Check database migrations ran successfully
4. Review service logs for errors

### Clear Everything and Start Fresh

```bash
# Stop all services
docker compose -f docker/docker-compose.yml down -v

# Remove node_modules and rebuild
rm -rf node_modules
npm install

# Restart infrastructure
docker compose -f docker/docker-compose.yml up -d

# Re-run migrations
npx nx run catalog-service:migration:run
npx nx run booking-service:migration:run
npx nx run payment-service:migration:run
```

---

## Next Steps

1. Review the [API Documentation](./contracts/api-gateway.openapi.yaml)
2. Review the [Data Model](./data-model.md)
3. Review the [Event Schemas](./contracts/events.schema.yaml)
4. Check the [Research Decisions](./research.md)
5. Start implementing tasks from `tasks.md` (created by `/speckit.tasks`)
