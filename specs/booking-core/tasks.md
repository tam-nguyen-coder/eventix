# Tasks: Core Booking System

> **Module:** booking-core  
> **Total Estimated Effort:** 6 weeks (3 sprints)  
> **Status:** Planning

> ⚠️ **NOTE: Testing is DEFERRED**
> - All testing tasks are marked as ~~strikethrough~~
> - Focus on core implementation first
> - Tests will be added in a future phase

---

## Sprint 1: Foundation (Week 1-2)

### 🎯 Sprint Goal
Setup project infrastructure, database schema, and basic CRUD operations.

---

### Task 1.1: Project Setup

- [ ] **1.1.1** Initialize Nx workspace with NestJS preset
  ```bash
  npx create-nx-workspace@21 eventix --preset=nest --nxCloud=skip
  ```
  - **Estimate:** 2h
  - **Owner:** TBD
  - **Tech:** Node.js 24.x, Nx 21.x, NestJS 11.x

- [ ] **1.1.2** Create microservice applications
  ```bash
  nx g @nx/nest:app api-gateway
  nx g @nx/nest:app catalog-service
  nx g @nx/nest:app booking-service
  nx g @nx/nest:app payment-service
  ```
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **1.1.3** Create shared libraries
  ```bash
  nx g @nx/nest:lib shared-dto
  nx g @nx/nest:lib shared-constants
  ```
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **1.1.4** Configure TypeScript paths and ESLint
  - **Estimate:** 2h
  - **Owner:** TBD

---

### Task 1.2: Infrastructure Setup

- [ ] **1.2.1** Create `docker-compose.yml` with services:
  - PostgreSQL (3 databases)
  - Redpanda (Kafka-compatible)
  - Redpanda Console (UI)
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **1.2.2** Create database initialization scripts
  - Create databases: `eventix_catalog_db`, `eventix_booking_db`, `eventix_payment_db`
  - Create users with appropriate permissions
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **1.2.3** Create Kafka topics initialization
  - `booking.created`
  - `booking.confirmed`
  - `booking.cancelled`
  - `payment.success`
  - `payment.failed`
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **1.2.4** Document local development setup in README
  - **Estimate:** 1h
  - **Owner:** TBD

---

### Task 1.3: Shared Libraries

- [ ] **1.3.1** Define Kafka topics constants
  ```typescript
  // libs/shared-constants/src/kafka-topics.ts
  export const KAFKA_TOPICS = { ... }
  ```
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **1.3.2** Define error codes constants
  ```typescript
  // libs/shared-constants/src/error-codes.ts
  export const ERROR_CODES = { ... }
  ```
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **1.3.3** Create base event interfaces
  ```typescript
  // libs/shared-dto/src/events/base-event.interface.ts
  export interface BaseEvent { ... }
  ```
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **1.3.4** Create booking event DTOs
  - `BookingCreatedEvent`
  - `BookingConfirmedEvent`
  - `BookingCancelledEvent`
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **1.3.5** Create payment event DTOs
  - `PaymentSuccessEvent`
  - `PaymentFailedEvent`
  - **Estimate:** 1h
  - **Owner:** TBD

---

### Task 1.4: Booking Service - Database

- [ ] **1.4.1** Configure TypeORM for booking-service
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **1.4.2** Create `BookingStatus` enum
  - **Estimate:** 0.5h
  - **Owner:** TBD

- [ ] **1.4.3** Create `Booking` entity
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **1.4.4** Create `BookingItem` entity
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **1.4.5** Create `ProcessedEvent` entity (for idempotency)
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **1.4.6** Create initial migration
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **1.4.7** Run and verify migration
  - **Estimate:** 1h
  - **Owner:** TBD

---

### Task 1.5: Booking Service - Basic CRUD

- [ ] **1.5.1** Create `BookingModule`
  - **Estimate:** 0.5h
  - **Owner:** TBD

- [ ] **1.5.2** Create `IBookingRepository` interface (Port)
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **1.5.3** Create `TypeOrmBookingRepository` implementation
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **1.5.4** Create `BookingService` with basic methods
  - `findById()`
  - `findByUserId()`
  - `findExpired()`
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **1.5.5** Create `BookingController` with endpoints
  - `GET /bookings/:id`
  - `GET /bookings/my`
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **1.5.6** Create request/response DTOs
  - `BookingResponseDto`
  - `PaginationQueryDto`
  - **Estimate:** 2h
  - **Owner:** TBD

---

### Sprint 1 Checklist

- [ ] Nx workspace initialized
- [ ] All 4 apps created
- [ ] Docker compose working
- [ ] Database migrations run successfully
- [ ] Basic GET endpoints working

---

## Sprint 2: Core Logic (Week 3-4)

### 🎯 Sprint Goal
Implement seat locking, booking creation, and Kafka integration.

---

### Task 2.1: Catalog Service (Minimal)

- [ ] **2.1.1** Create `Event` entity
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **2.1.2** Create `Venue` entity
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **2.1.3** Create `Seat` entity
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **2.1.4** Create `EventSeatPrice` entity
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **2.1.5** Create internal endpoint for seat validation
  - `POST /internal/events/:id/seats/validate`
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **2.1.6** Create internal endpoint for seat prices
  - `POST /internal/events/:id/seats/prices`
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **2.1.7** Seed sample data (venues, seats, events)
  - **Estimate:** 2h
  - **Owner:** TBD

---

### Task 2.2: Booking Service - Create Booking

- [ ] **2.2.1** Create `CatalogServiceClient`
  - HTTP client to call catalog-service
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **2.2.2** Create `CreateBookingDto` with validation
  ```typescript
  @IsUUID() eventId: string;
  @IsArray() @IsUUID('4', { each: true }) seatIds: string[];
  ```
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **2.2.3** Implement seat locking in repository
  - Use `SELECT ... FOR UPDATE`
  - **Estimate:** 4h
  - **Owner:** TBD

- [ ] **2.2.4** Create `CreateBookingUseCase`
  - Validate event exists
  - Lock seats
  - Calculate total
  - Create booking with items
  - **Estimate:** 6h
  - **Owner:** TBD

- [ ] **2.2.5** Add `POST /bookings` endpoint
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **2.2.6** Create custom exceptions
  - `SeatAlreadyReservedException`
  - `EventNotFoundException`
  - `MaxSeatsExceededException`
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] ~~**2.2.7** Write unit tests for `CreateBookingUseCase`~~ *(DEFERRED)*

- [ ] ~~**2.2.8** Write integration tests for seat locking~~ *(DEFERRED)*

---

### Task 2.3: Kafka Integration

- [ ] **2.3.1** Configure Kafka module in booking-service
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **2.3.2** Create `IEventPublisher` interface (Port)
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **2.3.3** Create `KafkaEventPublisher` implementation
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **2.3.4** Publish `booking.created` event after successful creation
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **2.3.5** Create `IProcessedEventsRepository` interface
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **2.3.6** Implement idempotency check repository
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **2.3.7** Test Kafka publishing with Redpanda Console
  - **Estimate:** 2h
  - **Owner:** TBD

---

### Task 2.4: Payment Service (Minimal)

- [ ] **2.4.1** Configure Kafka consumer for `booking.created`
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **2.4.2** Create mock payment processing logic
  - Random success/failure for testing
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **2.4.3** Publish `payment.success` event
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **2.4.4** Publish `payment.failed` event
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **2.4.5** Implement idempotency check
  - **Estimate:** 2h
  - **Owner:** TBD

---

### Task 2.5: Booking Service - Payment Handling

- [ ] **2.5.1** Create `PaymentResultConsumer`
  - Listen to `payment.success` and `payment.failed`
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **2.5.2** Create `ConfirmBookingUseCase`
  - Update status to CONFIRMED
  - Generate ticket reference
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **2.5.3** Create `CancelBookingUseCase`
  - Update status to CANCELLED
  - Publish `booking.cancelled` event
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **2.5.4** Implement idempotency in consumers
  - Check `processed_events` before processing
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] ~~**2.5.5** Write integration tests for payment flow~~ *(DEFERRED)*

---

### Sprint 2 Checklist

- [ ] Create booking with seat locking works
- [ ] Kafka events publishing correctly
- [ ] Payment service consuming events
- [ ] Booking confirmation working
- [ ] Booking cancellation working

---

## Sprint 3: Polish (Week 5-6)

### 🎯 Sprint Goal
Implement expiration, API Gateway, error handling, and documentation.

---

### Task 3.1: Expiration Job

- [ ] **3.1.1** Create `ExpireBookingsUseCase`
  - Find expired PENDING bookings
  - Update status to CANCELLED
  - Publish `booking.expired` event
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **3.1.2** Create `ExpirationScheduler` (Cron Job)
  - Run every 60 seconds
  - Use `@nestjs/schedule`
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **3.1.3** Implement batch processing
  - Process in chunks of 100
  - Use `FOR UPDATE SKIP LOCKED`
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] ~~**3.1.4** Write unit tests for expiration~~ *(DEFERRED)*

- [ ] ~~**3.1.5** Write integration tests~~ *(DEFERRED)*

---

### Task 3.2: API Gateway

- [ ] **3.2.1** Configure HTTP proxy module
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **3.2.2** Implement Auth0 JWT validation
  - Configure passport-jwt strategy
  - **Estimate:** 4h
  - **Owner:** TBD

- [ ] **3.2.3** Create `@CurrentUser()` decorator
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **3.2.4** Implement route proxying
  - `/api/events/*` → catalog-service
  - `/api/bookings/*` → booking-service
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **3.2.5** Configure rate limiting
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **3.2.6** Configure CORS
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] ~~**3.2.7** Write E2E tests for auth flow~~ *(DEFERRED)*

---

### Task 3.3: Error Handling

- [ ] **3.3.1** Create global exception filter
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **3.3.2** Standardize error response format
  ```json
  { "success": false, "error": { "code": "", "message": "" } }
  ```
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **3.3.3** Create HTTP exception mapper
  - Map domain exceptions to HTTP status codes
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **3.3.4** Implement request logging interceptor
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **3.3.5** Configure correlation ID propagation
  - **Estimate:** 2h
  - **Owner:** TBD

---

### Task 3.4: Documentation

- [ ] **3.4.1** Configure Swagger/OpenAPI
  - **Estimate:** 2h
  - **Owner:** TBD

- [ ] **3.4.2** Add Swagger decorators to controllers
  - **Estimate:** 4h
  - **Owner:** TBD

- [ ] **3.4.3** Document DTOs with @ApiProperty
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **3.4.4** Generate OpenAPI spec file
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **3.4.5** Update README with API documentation
  - **Estimate:** 2h
  - **Owner:** TBD

---

### Task 3.5: Health Checks & Monitoring

- [ ] **3.5.1** Implement health check endpoints
  - Database connectivity
  - Kafka connectivity
  - **Estimate:** 3h
  - **Owner:** TBD

- [ ] **3.5.2** Add readiness/liveness probes
  - **Estimate:** 1h
  - **Owner:** TBD

- [ ] **3.5.3** Configure structured logging
  - Use Pino or Winston
  - **Estimate:** 3h
  - **Owner:** TBD

---

### ~~Task 3.6: Final Testing~~ *(DEFERRED)*

> All testing tasks are deferred to a future phase.

- [ ] ~~**3.6.1** Write E2E tests for happy path~~ *(DEFERRED)*
- [ ] ~~**3.6.2** Write E2E tests for timeout path~~ *(DEFERRED)*
- [ ] ~~**3.6.3** Load testing with k6 or Artillery~~ *(DEFERRED)*
- [ ] ~~**3.6.4** Fix any discovered issues~~ *(DEFERRED)*

---

### Sprint 3 Checklist

- [ ] Expiration job running correctly
- [ ] API Gateway with Auth0 working
- [ ] All error responses standardized
- [ ] Swagger documentation complete
- [ ] Health checks implemented
- [ ] Manual API testing passed

---

## Summary

| Sprint | Tasks | Focus |
|--------|-------|-------|
| Sprint 1 | ~25 | Foundation |
| Sprint 2 | ~25 | Core Logic |
| Sprint 3 | ~20 | Polish |
| **Total** | **~70** | *(Testing deferred)* |

---

## Dependencies Graph

```
Sprint 1                  Sprint 2                  Sprint 3
─────────                 ─────────                 ─────────
                          
[1.1 Project Setup]       
       │                  
       ▼                  
[1.2 Infrastructure] ────▶[2.3 Kafka Integration]──▶[3.5 Monitoring]
       │                         │
       ▼                         │
[1.3 Shared Libs]────────▶[2.4 Payment Service]
       │                         │
       ▼                         ▼
[1.4 Booking DB]─────────▶[2.2 Create Booking]────▶[3.1 Expiration]
       │                         │
       ▼                         │
[1.5 Basic CRUD]                 │
                                 │
                          [2.1 Catalog Service]
                                 │
                                 ▼
                          [2.5 Payment Handling]──▶[3.2 API Gateway]
                                                          │
                                                          ▼
                                                   [3.3 Error Handling]
                                                          │
                                                          ▼
                                                   [3.4 Documentation]
```

---

## Notes

- All tasks require code review before merge
- Each PR needs to link to task ID
- Demo at the end of each sprint for stakeholders
- **Testing is DEFERRED** - focus on implementation first

