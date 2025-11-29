# Eventix Constitution

> This document defines the rules, standards, and core principles for the Eventix project.

---

## 🎯 Project Mission

Build a **high-performance event ticketing system** with high concurrency handling and data consistency through microservices and event-driven architecture.

---

## 🏗️ Architecture Principles

### 1. Microservices Architecture
- Each service has **single responsibility**
- Services communicate via **message broker** (Redpanda/Kafka)
- Each service has its **own database** (Database per Service)
- API Gateway is the **single entry point**

### 2. Clean Architecture
- **Domain layer** has no framework dependencies
- **Dependency inversion** through interfaces/ports
- Clear separation: Controllers → Services → Repositories → Entities

### 3. Event-Driven Design
- Use **eventual consistency** for cross-service operations
- Events are **immutable** with **idempotency key**
- Implement **retry mechanism** with exponential backoff

---

## 💻 Technology Standards

### Language & Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 24.x | Runtime |
| TypeScript | 5.8.x | Language |
| NestJS | 11.x | Framework |
| Nx | 21.x | Monorepo |

### Infrastructure
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 17.x | Database |
| Redpanda | latest | Message Broker |
| Docker | 27.x | Containerization |

### Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| TypeORM | 0.3.x | ORM & Migrations |
| @nestjs/typeorm | 11.x | NestJS TypeORM Integration |
| class-validator | 0.14.x | DTO Validation |
| class-transformer | 0.5.x | Object Transformation |
| @nestjs/passport | 11.x | Auth Integration |
| passport-jwt | 4.x | JWT Strategy |
| @nestjs/microservices | 11.x | Microservices Support |
| kafkajs | 2.x | Kafka/Redpanda Client |

---

## 📁 Project Structure

```
eventix/
├── memory/                    # Spec Kit - Project memory
│   └── constitution.md        # This file
├── specs/                     # Spec Kit - Specifications
│   └── {feature}/
│       ├── spec.md            # Feature specification
│       ├── plan.md            # Technical plan
│       ├── data-model.md      # Data model design
│       ├── research.md        # Research & decisions
│       └── tasks.md           # Implementation tasks
├── apps/                      # NestJS Applications
│   ├── api-gateway/
│   ├── catalog-service/
│   ├── booking-service/
│   └── payment-service/
├── libs/                      # Shared Libraries
│   ├── shared-dto/
│   └── shared-constants/
└── docker-compose.yml
```

---

## 🔒 Security Standards

### Authentication
- ✅ **Auth0** is the sole Identity Provider
- ✅ JWT tokens with **RS256** algorithm
- ✅ Token validation at **API Gateway level**
- ❌ DO NOT store passwords in the system

### Authorization
- ✅ **RBAC** (Role-Based Access Control)
- ✅ Roles: `guest`, `customer`, `admin`
- ✅ Validate permissions at Controller level

### Data Protection
- ✅ Input validation with **class-validator**
- ✅ SQL injection prevention via **TypeORM parameterized queries**
- ✅ Rate limiting at Gateway

---

## 🗄️ Database Standards

### Naming Conventions
```
Tables:      snake_case, plural (e.g., bookings, booking_items)
Columns:     snake_case (e.g., user_id, created_at)
Indexes:     idx_{table}_{column} (e.g., idx_booking_user_id)
Foreign Keys: fk_{table}_{ref_table} (e.g., fk_booking_item_booking)
```

### Required Columns
Every table MUST have:
- `id` (UUID, Primary Key)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Transactions
- ✅ Use **pessimistic locking** for seat reservation
- ✅ Transaction timeout: **30 seconds**
- ✅ Rollback on any exception

---

## 📨 Event Standards

### Topic Naming
```
{domain}.{action}

Examples:
- booking.created
- booking.cancelled
- payment.success
- payment.failed
```

### Event Payload Structure
```typescript
interface BaseEvent {
  eventId: string;        // UUID - unique per event
  eventType: string;      // Topic name
  timestamp: string;      // ISO 8601
  version: string;        // Schema version
  correlationId: string;  // For tracing
  payload: object;        // Event-specific data
}
```

### Idempotency
- Consumer MUST check `eventId` before processing
- Store processed events in `processed_events` table

---

## 🧪 Testing Standards

> ⚠️ **DEFERRED**: Testing is postponed to a later phase to focus on core implementation first.

### Current Phase Rules
- ❌ **DO NOT** create test files
- ❌ **DO NOT** write unit/integration/e2e tests
- ❌ **DO NOT** run test commands
- ✅ Focus on core functionality implementation
- ✅ Manual testing via API calls is acceptable

### Future Phase (When Testing is Enabled)
Testing requirements will be defined when this phase begins.

---

## 📝 Code Style

### TypeScript
- ✅ Explicit return types for public methods
- ✅ `readonly` for injected dependencies
- ✅ Enums for status/type values
- ❌ `any` type (use `unknown` if needed)

### NestJS
- ✅ One module per feature
- ✅ DTOs for all request/response
- ✅ Custom exceptions extend from NestJS exceptions
- ✅ Interceptors for response transformation

### Git
- ✅ Conventional Commits format
- ✅ Branch: `feature/`, `bugfix/`, `hotfix/`, `chore/`
- ✅ PR requires 1 approval minimum

---

## 🚀 Performance Standards

### Response Time
| Endpoint Type | Target |
|---------------|--------|
| Read operations | < 200ms |
| Write operations | < 500ms |
| Booking flow | < 1s |

### Database
- ✅ Indexes for all foreign keys
- ✅ Composite index for frequent queries
- ✅ Connection pooling (min: 5, max: 20)

### Message Queue
- ✅ Consumer group per service
- ✅ Partition key: `entityId` (e.g., bookingId)
- ✅ Retention: 7 days

---

## 📚 Documentation Standards

### Code Documentation
- ✅ JSDoc for public APIs
- ✅ README.md for each app/lib
- ✅ Swagger/OpenAPI for REST endpoints

### Spec Kit Documents
- ✅ `spec.md` - What & Why
- ✅ `plan.md` - How
- ✅ `data-model.md` - Data structures
- ✅ `tasks.md` - Implementation steps

---

## ⚠️ Non-Negotiables

1. **NO double booking** - Database MUST enforce uniqueness
2. **NO bypass Gateway** - Internal services DO NOT expose public ports
3. **NO skip validation** - DTOs are mandatory
4. **NO hardcode secrets** - Environment variables only
5. **NO ignore errors** - Proper error handling required
