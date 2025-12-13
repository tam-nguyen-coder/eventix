# Implementation Plan: Event Booking System

**Branch**: `001-event-booking-system` | **Date**: 2025-12-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-event-booking-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a scalable event booking system with microservices architecture using NestJS and Nx monorepo. The system includes authentication via Auth0, event catalog management, booking lifecycle with seat reservation and concurrency control, and simulated payment processing. Communication between services uses Redpanda (Kafka-compatible) for event-driven workflows.

## Technical Context

**Language/Version**: TypeScript (Node.js 20 LTS)  
**Primary Dependencies**: NestJS (framework), Nx (monorepo), TypeORM (ORM), Auth0 (authentication), Redpanda (message broker)  
**Storage**: PostgreSQL (3 databases: eventix_catalog_db, eventix_booking_db, eventix_payment_db)  
**Testing**: Jest (NestJS default), Supertest (E2E), Pact (contract testing)  
**Target Platform**: Linux server (Docker containers)  
**Project Type**: Microservices (Nx monorepo with 4 apps + shared libraries)  
**Performance Goals**: 1000 concurrent users, 10,000 requests/hour peak, <100ms seat reservation (p95)  
**Constraints**: <200ms p95 read operations, <500ms p95 write operations, 10-minute reservation timeout  
**Scale/Scope**: 10k users, 4 microservices, 2 shared libraries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Code Quality Standards:**
- [x] TypeScript strict mode enabled and all types explicitly defined
- [x] Linting and formatting tools configured (ESLint + Prettier via Nx)
- [x] Code review process defined (per constitution: at least one reviewer)
- [x] Shared libraries identified to prevent duplication (`libs/shared-dto`, `libs/shared-constants`)

**II. Testing Standards (NON-NEGOTIABLE):**
- [x] Testing framework selected: Jest (unit tests), Supertest (E2E), Pact (contract tests)
- [x] Test coverage target defined: minimum 80% code coverage
- [x] Integration test strategy defined: service-to-service via Redpanda test containers
- [x] Contract test approach defined: Pact for API boundaries between Gateway and services
- [x] Critical paths identified for E2E: complete booking flow, concurrent booking, reservation expiration, payment failure

**III. User Experience Consistency:**
- [x] API error format standardized: consistent error response DTOs in `libs/shared-dto`
- [x] Response time targets defined: p95 < 200ms read, < 500ms write
- [x] API versioning strategy defined: URL versioning (/v1/)
- [x] Swagger/OpenAPI documentation approach confirmed: NestJS @nestjs/swagger integration

**IV. Performance Requirements:**
- [x] Performance targets defined: 1000 concurrent users, 10,000 req/hour, <100ms seat reservation
- [x] Load testing strategy defined: k6 for load testing, Artillery for stress testing
- [x] Caching strategy identified: Redis for event catalog caching (read-heavy)
- [x] Database query optimization approach defined: TypeORM query builder, proper indexing, connection pooling
- [x] Monitoring/alerting requirements identified: Prometheus metrics, Grafana dashboards

**Compliance:** All checks PASS. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-event-booking-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Nx Monorepo Structure (Microservices Architecture)

apps/
├── api-gateway/                    # HTTP entry point, Auth0 validation, request routing
│   ├── src/
│   │   ├── auth/                   # Auth0 guard, JWT validation
│   │   ├── controllers/            # HTTP controllers (proxy to services)
│   │   └── main.ts
│   └── test/
│       ├── e2e/                    # End-to-end tests
│       └── unit/                   # Unit tests
│
├── catalog-service/                # Event/Venue domain (Clean Architecture)
│   ├── src/
│   │   ├── domain/                 # Entities, value objects, domain services
│   │   │   ├── entities/           # Event, Venue, Seat, EventSeatPrice
│   │   │   └── services/           # Domain logic
│   │   ├── application/            # Use cases, DTOs
│   │   │   ├── use-cases/          # CreateEvent, CreateVenue, SearchEvents
│   │   │   └── ports/              # Repository interfaces
│   │   ├── infrastructure/         # TypeORM, controllers
│   │   │   ├── persistence/        # TypeORM entities, repositories
│   │   │   └── controllers/        # NestJS controllers
│   │   └── main.ts
│   └── test/
│       ├── integration/            # Database integration tests
│       └── unit/                   # Domain/use-case unit tests
│
├── booking-service/                # Booking domain (Clean Architecture)
│   ├── src/
│   │   ├── domain/
│   │   │   ├── entities/           # Booking, BookingItem
│   │   │   ├── services/           # Seat locking, reservation logic
│   │   │   └── events/             # Domain events
│   │   ├── application/
│   │   │   ├── use-cases/          # CreateBooking, ConfirmBooking, CancelBooking
│   │   │   ├── ports/              # Repository interfaces
│   │   │   └── handlers/           # Event handlers (payment.success, payment.failed)
│   │   ├── infrastructure/
│   │   │   ├── persistence/        # TypeORM entities, repositories
│   │   │   ├── messaging/          # Redpanda producer/consumer
│   │   │   └── controllers/        # NestJS controllers
│   │   └── main.ts
│   └── test/
│       ├── integration/
│       └── unit/
│
└── payment-service/                # Payment domain (Hexagonal Architecture)
    ├── src/
    │   ├── domain/
    │   │   ├── entities/           # Payment
    │   │   └── services/           # Payment processing (simulated)
    │   ├── application/
    │   │   ├── use-cases/          # ProcessPayment
    │   │   └── handlers/           # Event handlers (booking.created)
    │   ├── infrastructure/
    │   │   ├── persistence/        # TypeORM entities, repositories
    │   │   ├── messaging/          # Redpanda producer/consumer
    │   │   └── adapters/           # Payment gateway adapter (mock)
    │   └── main.ts
    └── test/
        ├── integration/
        └── unit/

libs/
├── shared-dto/                     # Shared DTOs across services
│   └── src/
│       ├── booking/                # CreateBookingDto, BookingResponseDto
│       ├── catalog/                # EventDto, VenueDto, SeatDto
│       ├── payment/                # PaymentDto, PaymentResultDto
│       └── common/                 # ErrorResponseDto, PaginationDto
│
└── shared-constants/               # System-wide constants
    └── src/
        ├── topics.ts               # Kafka topic names
        ├── error-codes.ts          # Standardized error codes
        └── roles.ts                # User roles (Admin, Customer)

# Infrastructure Configuration
docker/
├── docker-compose.yml              # Local development setup
├── docker-compose.test.yml         # Test environment
└── init-scripts/                   # Database initialization scripts

# Root Configuration
├── nx.json                         # Nx workspace configuration
├── tsconfig.base.json              # Base TypeScript configuration
├── jest.preset.js                  # Jest preset for all projects
├── .eslintrc.json                  # ESLint configuration
└── .prettierrc                     # Prettier configuration
```

**Structure Decision**: Nx Monorepo with 4 microservice applications following Clean/Hexagonal Architecture patterns. Shared libraries (`libs/`) ensure DRY principles and consistent interfaces between services. Each service owns its database and communicates via Redpanda events for eventual consistency.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 4 microservices | Domain separation for booking, catalog, payment + gateway | Monolith rejected: scaling requirements (1000 concurrent users) and fault isolation for payment processing require independent deployment |
| 3 separate databases | Data ownership per service (catalog, booking, payment) | Single database rejected: microservice independence and ability to scale databases separately |
| Event-driven architecture | Async payment processing, decoupled services | Synchronous rejected: payment processing latency and potential failures shouldn't block booking creation |

**Note**: All complexity is justified by the system requirements for scalability, fault tolerance, and domain separation.

---

## Post-Design Constitution Verification

*Re-evaluated after Phase 1 design completion (2025-12-11)*

### I. Code Quality Standards ✅ PASS

| Requirement | Design Artifact | Status |
|-------------|-----------------|--------|
| TypeScript strict mode | `tsconfig.base.json` with `strict: true` | ✅ Planned |
| Linting/formatting | ESLint + Prettier via Nx workspace | ✅ Planned |
| Code review process | PR required, min 1 reviewer | ✅ Per constitution |
| Shared libraries | `libs/shared-dto`, `libs/shared-constants` | ✅ Documented in structure |
| JSDoc documentation | All public APIs in contracts | ✅ OpenAPI spec created |

### II. Testing Standards ✅ PASS

| Requirement | Design Artifact | Status |
|-------------|-----------------|--------|
| Unit tests (80%+ coverage) | Jest config per service | ✅ Planned |
| Integration tests | Service-to-service via test containers | ✅ Strategy in research.md |
| Contract tests | Pact for Gateway ↔ Services | ✅ Strategy in research.md |
| E2E critical paths | Booking flow, concurrent booking, timeout, payment failure | ✅ Identified in spec.md |
| Test isolation | Database-per-test, mock Kafka | ✅ Planned |

### III. User Experience Consistency ✅ PASS

| Requirement | Design Artifact | Status |
|-------------|-----------------|--------|
| API error format | `ErrorResponse` schema in OpenAPI | ✅ Defined |
| Response time targets | p95 < 200ms read, < 500ms write | ✅ In spec success criteria |
| API versioning | `/v1/` URL prefix | ✅ In OpenAPI spec |
| Swagger docs | NestJS @nestjs/swagger | ✅ Planned |
| Auth consistency | Auth0 JWT across all services | ✅ Documented |

### IV. Performance Requirements ✅ PASS

| Requirement | Design Artifact | Status |
|-------------|-----------------|--------|
| Performance targets | 1000 users, 10k req/hr, <100ms reservation | ✅ In spec |
| Load testing | k6 + Artillery | ✅ Strategy planned |
| Caching | Redis for catalog (read-heavy) | ✅ Identified |
| DB optimization | Indexes defined in data-model.md | ✅ Documented |
| Monitoring | Prometheus + Grafana | ✅ Planned |

### Design Artifacts Produced

| Artifact | Path | Purpose |
|----------|------|---------|
| Implementation Plan | `specs/001-event-booking-system/plan.md` | Technical context and structure |
| Research Decisions | `specs/001-event-booking-system/research.md` | Technical decisions with rationale |
| Data Model | `specs/001-event-booking-system/data-model.md` | Entity definitions and schemas |
| API Contract | `specs/001-event-booking-system/contracts/api-gateway.openapi.yaml` | Public REST API |
| Event Schemas | `specs/001-event-booking-system/contracts/events.schema.yaml` | Kafka event definitions |
| Quickstart Guide | `specs/001-event-booking-system/quickstart.md` | Local development setup |

### Conclusion

**All Constitution checks PASS.** The design phase is complete and ready for task breakdown via `/speckit.tasks` command.
