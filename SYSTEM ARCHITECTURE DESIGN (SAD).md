# System Architecture Design (SAD)

> **Project Name:** Eventix  
> **Architecture Style:** Microservices with Event-Driven Architecture  
> **Internal Design:** Clean Architecture (Domain-Centric)

---

## 1. Technology Stack

| Component | Technology | Reasoning |
|-----------|------------|-----------|
| **Language** | TypeScript (Node.js) | Strong typing, shared interfaces. |
| **Framework** | NestJS | Modular, DI, native Microservice support. |
| **Monorepo Tool** | Nx | Efficient build system, shared libraries, and dependency graph management. |
| **API Gateway** | NestJS (HTTP Proxy) | BFF pattern, aggregation, Auth0 validation. |
| **Message Broker** | Redpanda | Kafka-compatible, C++ binary, no Zookeeper (Lower latency & operational cost). |
| **Database** | PostgreSQL | Relational data integrity, transactional support. |
| **ORM** | TypeORM | Schema management, Migrations, Repository pattern. |
| **Auth** | Auth0 | Managed Identity Provider (OIDC/OAuth2). |
| **Docs** | Swagger (OpenAPI) | Standard API documentation. |
| **Infrastructure** | Docker & Docker Compose | Containerization for local dev and deployment. |

---

## 2. Nx Monorepo Structure

We utilize **Nx** to manage multiple applications and shared libraries within a single repository.

### 2.1. Applications (`apps/`)

> Deployable units of the system.

| Application | Description |
|-------------|-------------|
| `apps/api-gateway` | The entry point for all client requests. |
| `apps/catalog-service` | Domain logic for Events/Venues. |
| `apps/booking-service` | Domain logic for Reservations. |
| `apps/payment-service` | Payment processing consumer. |

### 2.2. Shared Libraries (`libs/`)

> Code shared across microservices to ensure consistency and **DRY** (Don't Repeat Yourself) principles.

| Library | Description |
|---------|-------------|
| `libs/shared-dto` | Contains Request/Response DTOs (e.g., `CreateBookingDto`, `EventResponseDto`). Ensures the Gateway and Services speak the same language. |
| `libs/shared-constants` | Contains system-wide constants, specifically Kafka Topics (e.g., `TOPIC_BOOKING_CREATED`) and Error Codes. |

---

## 3. Microservices Breakdown

### 3.1. API Gateway (`api-gateway`)

| Property | Value |
|----------|-------|
| **Type** | HTTP Server (NestJS) |
| **Responsibility** | Single entry point for Frontend |

**Key Functions:**
- Validates Auth0 Access Tokens
- Routes requests to appropriate microservices
- Aggregates data (e.g., Fetching Event details + User booking history)

---

### 3.2. Catalog Service (`catalog-service`)

| Property | Value |
|----------|-------|
| **Architecture** | Clean Architecture |
| **Database** | `eventix_catalog_db` |
| **Responsibility** | Manages Venues, Events, Seat Maps |
| **Communication** | REST/gRPC (Sync) for reading data |

---

### 3.3. Booking Service (`booking-service`)

| Property | Value |
|----------|-------|
| **Architecture** | Clean Architecture |
| **Database** | `eventix_booking_db` |

**Responsibility:**
- Handles Create Booking logic
- ⚠️ **CRITICAL:** Manages Seat Locking mechanism using Database Transactions (optimistic/pessimistic locking)

**Event Communication:**

| Direction | Topics |
|-----------|--------|
| **Producers** | `booking.created`, `booking.cancelled` |
| **Consumers** | `payment.success`, `payment.failed` |

---

### 3.4. Payment Service (`payment-service`)

| Property | Value |
|----------|-------|
| **Architecture** | Hexagonal / Clean |
| **Database** | `eventix_payment_db` |
| **Responsibility** | Processes payments |

**Event Communication:**

| Direction | Topics |
|-----------|--------|
| **Producers** | `payment.success`, `payment.failed` |
| **Consumers** | `booking.created` |

---

## 4. Data Flow & Event Topics (Redpanda/Kafka)

### 4.1. Happy Path: Buying a Ticket ✅

```
┌──────────┐      ┌─────────────┐      ┌─────────────────┐
│   User   │ ──▶  │   Gateway   │ ──▶  │ Booking Service │
└──────────┘      └─────────────┘      └─────────────────┘
                  POST /bookings              │
                  (Select Seats)              │
                                              ▼
                              ┌───────────────────────────────┐
                              │ 1. Check DB for seat avail.   │
                              │ 2. Create Booking (PENDING)   │
                              │ 3. Set expiration (Now+10min) │
                              │ 4. Produce: booking.created   │
                              └───────────────────────────────┘
                                              │
                              ┌───────────────┘
                              ▼
                    ┌─────────────────┐
                    │ Payment Service │
                    └─────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ 1. Consume: booking.created   │
              │ 2. Process Payment (Mock)     │
              │ 3. Produce: payment.success   │
              └───────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Booking Service │
                    └─────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ 1. Consume: payment.success   │
              │ 2. Update Status: CONFIRMED   │
              └───────────────────────────────┘
```

**Event Payload Example:**

```json
// booking.created
{
  "bookingId": "uuid",
  "amount": 150.00,
  "userId": "auth0|123"
}

// payment.success
{
  "bookingId": "uuid",
  "transactionId": "txn_abc123"
}
```

---

### 4.2. Unhappy Path: Payment Timeout / Fail ❌

```
┌─────────────────┐
│ Payment Service │
└─────────────────┘
        │
        ▼
┌───────────────────────────┐
│ Produce: payment.failed   │
└───────────────────────────┘
        │
        ▼
┌─────────────────┐
│ Booking Service │
└─────────────────┘
        │
        ▼
┌───────────────────────────┐
│ 1. Consume: payment.failed│
│ 2. Update: CANCELLED      │
│ 3. Release Seats          │
└───────────────────────────┘
```

---

## 5. Database Schema (Key Entities)

### 5.1. Catalog DB (`eventix_catalog_db`)

```sql
-- Venue Table
CREATE TABLE venue (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    location    VARCHAR(500)
);

-- Seat Table
CREATE TABLE seat (
    id          UUID PRIMARY KEY,
    venue_id    UUID REFERENCES venue(id),
    row         VARCHAR(10),
    number      INT,
    type        VARCHAR(50)  -- VIP, Regular, Economy
);

-- Event Table
CREATE TABLE event (
    id          UUID PRIMARY KEY,
    venue_id    UUID REFERENCES venue(id),
    name        VARCHAR(255) NOT NULL,
    start_time  TIMESTAMP,
    end_time    TIMESTAMP
);

-- Event Seat Pricing
CREATE TABLE event_seat_price (
    event_id    UUID REFERENCES event(id),
    seat_type   VARCHAR(50),
    price       DECIMAL(10, 2),
    PRIMARY KEY (event_id, seat_type)
);
```

### 5.2. Booking DB (`eventix_booking_db`)

```sql
-- Booking Table
CREATE TABLE booking (
    id              UUID PRIMARY KEY,
    user_id         VARCHAR(255) NOT NULL,  -- Auth0 User ID
    event_id        UUID NOT NULL,
    total_amount    DECIMAL(10, 2),
    status          VARCHAR(50),  -- PENDING, CONFIRMED, CANCELLED
    created_at      TIMESTAMP DEFAULT NOW(),
    expires_at      TIMESTAMP
);

-- Booking Items (Seats)
CREATE TABLE booking_item (
    id          UUID PRIMARY KEY,
    booking_id  UUID REFERENCES booking(id),
    seat_id     UUID NOT NULL,
    price       DECIMAL(10, 2)
);
```

> ⚠️ **Note:** Booking Service keeps a local copy or reference of Seat IDs but does **not own** the Seat definition.

---

## 6. Development Roadmap (Phase 1)

| Step | Task | Description |
|------|------|-------------|
| 1️⃣ | **Setup Monorepo** | Initialize Nx Workspace with `@nx/nest` preset. |
| 2️⃣ | **Infrastructure** | Configure `docker-compose.yml` with Redpanda and Postgres. |
| 3️⃣ | **Shared Library** | Implement `libs/shared-dto` and define Redpanda Topics in `libs/shared-constants`. |
| 4️⃣ | **Catalog Service** | Implement CRUD Events with TypeORM Migrations. |
| 5️⃣ | **Auth Integration** | Setup Auth0 and Gateway Guard. |
| 6️⃣ | **Booking Core** | Implement "Reserve Seat" transaction. |
| 7️⃣ | **Event Bus Connection** | Connect Booking and Payment services using Redpanda. |
