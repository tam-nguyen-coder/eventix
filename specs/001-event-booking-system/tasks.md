# Tasks: Event Booking System

**Input**: Design documents from `/specs/001-event-booking-system/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Per Constitution Principle II (Testing Standards), testing is NON-NEGOTIABLE. All features include comprehensive test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions (Nx Monorepo)

- **Apps**: `apps/{service-name}/src/`
- **Libs**: `libs/{lib-name}/src/`
- **Tests**: `apps/{service-name}/test/`
- **Infrastructure**: `docker/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Nx workspace initialization and project scaffolding

- [ ] T001 Initialize Nx workspace with `npx create-nx-workspace@latest eventix --preset=nest`
- [ ] T002 [P] Configure TypeScript strict mode in `tsconfig.base.json`
- [ ] T003 [P] Configure ESLint with `@typescript-eslint` in `.eslintrc.json`
- [ ] T004 [P] Configure Prettier in `.prettierrc`
- [ ] T005 [P] Configure Jest preset in `jest.preset.js`
- [ ] T006 Generate api-gateway app with `nx g @nx/nest:app api-gateway`
- [ ] T007 [P] Generate catalog-service app with `nx g @nx/nest:app catalog-service`
- [ ] T008 [P] Generate booking-service app with `nx g @nx/nest:app booking-service`
- [ ] T009 [P] Generate payment-service app with `nx g @nx/nest:app payment-service`
- [ ] T010 Generate shared-dto library with `nx g @nx/nest:lib shared-dto`
- [ ] T011 [P] Generate shared-constants library with `nx g @nx/nest:lib shared-constants`
- [ ] T012 Create `docker/docker-compose.yml` with PostgreSQL and Redpanda services
- [ ] T013 [P] Create `docker/docker-compose.test.yml` for test environment
- [ ] T014 [P] Create `docker/init-scripts/` database initialization scripts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Shared Libraries

- [ ] T015 [P] Create enums in `libs/shared-constants/src/enums.ts` (SeatType, EventStatus, BookingStatus, PaymentStatus)
- [ ] T016 [P] Create Kafka topics constants in `libs/shared-constants/src/topics.ts`
- [ ] T017 [P] Create error codes in `libs/shared-constants/src/error-codes.ts`
- [ ] T018 [P] Create user roles in `libs/shared-constants/src/roles.ts`
- [ ] T019 [P] Create ErrorResponseDto in `libs/shared-dto/src/common/error-response.dto.ts`
- [ ] T020 [P] Create PaginationDto in `libs/shared-dto/src/common/pagination.dto.ts`

### Database Setup

- [ ] T021 Configure TypeORM for catalog-service in `apps/catalog-service/src/infrastructure/database/database.module.ts`
- [ ] T022 [P] Configure TypeORM for booking-service in `apps/booking-service/src/infrastructure/database/database.module.ts`
- [ ] T023 [P] Configure TypeORM for payment-service in `apps/payment-service/src/infrastructure/database/database.module.ts`

### Authentication Infrastructure

- [ ] T024 Install Auth0 dependencies: `passport`, `passport-jwt`, `jwks-rsa`, `@nestjs/passport`
- [ ] T025 Create JwtStrategy in `apps/api-gateway/src/auth/jwt.strategy.ts`
- [ ] T026 Create JwtAuthGuard in `apps/api-gateway/src/auth/jwt-auth.guard.ts`
- [ ] T027 [P] Create RolesGuard in `apps/api-gateway/src/auth/roles.guard.ts`
- [ ] T028 [P] Create Roles decorator in `apps/api-gateway/src/auth/roles.decorator.ts`
- [ ] T029 Create AuthModule in `apps/api-gateway/src/auth/auth.module.ts`

### Messaging Infrastructure

- [ ] T030 Install Kafka dependencies: `@nestjs/microservices`, `kafkajs`
- [ ] T031 Create KafkaModule in `apps/booking-service/src/infrastructure/messaging/kafka.module.ts`
- [ ] T032 [P] Create KafkaModule in `apps/payment-service/src/infrastructure/messaging/kafka.module.ts`

### Environment Configuration

- [ ] T033 Create ConfigModule setup in each service with `.env.example` files
- [ ] T034 [P] Create health check endpoints in each service `/health`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Customer Books Event Tickets (Priority: P1) 🎯 MVP

**Goal**: Customer can browse events, select seats, reserve, and complete booking with payment

**Independent Test**: Create test event with seats, authenticate as customer, select seats, complete booking flow

### Tests for User Story 1 (MANDATORY per Constitution Principle II) ⚠️

- [ ] T035 [P] [US1] Unit tests for CreateBookingUseCase in `apps/booking-service/test/unit/use-cases/create-booking.use-case.spec.ts`
- [ ] T036 [P] [US1] Unit tests for SeatAvailabilityService in `apps/booking-service/test/unit/domain/seat-availability.service.spec.ts`
- [ ] T037 [P] [US1] Unit tests for Booking domain entity in `apps/booking-service/test/unit/domain/booking.entity.spec.ts`
- [ ] T038 [P] [US1] Integration tests for BookingRepository in `apps/booking-service/test/integration/booking.repository.spec.ts`
- [ ] T039 [P] [US1] Contract tests for POST /bookings in `apps/api-gateway/test/contract/bookings.pact.spec.ts`
- [ ] T040 [US1] E2E test for complete booking flow in `apps/api-gateway/test/e2e/booking-flow.e2e-spec.ts`
- [ ] T041 [US1] E2E test for concurrent booking in `apps/api-gateway/test/e2e/concurrent-booking.e2e-spec.ts`

### Catalog Service - Read Events (US1 needs to read events)

- [ ] T042 [P] [US1] Create Event domain entity in `apps/catalog-service/src/domain/entities/event.entity.ts`
- [ ] T043 [P] [US1] Create Venue domain entity in `apps/catalog-service/src/domain/entities/venue.entity.ts`
- [ ] T044 [P] [US1] Create Seat domain entity in `apps/catalog-service/src/domain/entities/seat.entity.ts`
- [ ] T045 [P] [US1] Create EventSeatPrice domain entity in `apps/catalog-service/src/domain/entities/event-seat-price.entity.ts`
- [ ] T046 [P] [US1] Create EventRepository port in `apps/catalog-service/src/application/ports/event.repository.ts`
- [ ] T047 [P] [US1] Create SeatRepository port in `apps/catalog-service/src/application/ports/seat.repository.ts`
- [ ] T048 [US1] Create TypeORM Event entity in `apps/catalog-service/src/infrastructure/persistence/entities/event.orm-entity.ts`
- [ ] T049 [P] [US1] Create TypeORM Venue entity in `apps/catalog-service/src/infrastructure/persistence/entities/venue.orm-entity.ts`
- [ ] T050 [P] [US1] Create TypeORM Seat entity in `apps/catalog-service/src/infrastructure/persistence/entities/seat.orm-entity.ts`
- [ ] T051 [US1] Implement TypeOrmEventRepository in `apps/catalog-service/src/infrastructure/persistence/repositories/event.repository.ts`
- [ ] T052 [P] [US1] Implement TypeOrmSeatRepository in `apps/catalog-service/src/infrastructure/persistence/repositories/seat.repository.ts`
- [ ] T053 [US1] Create GetEventsUseCase in `apps/catalog-service/src/application/use-cases/get-events.use-case.ts`
- [ ] T054 [P] [US1] Create GetSeatAvailabilityUseCase in `apps/catalog-service/src/application/use-cases/get-seat-availability.use-case.ts`
- [ ] T055 [US1] Create EventsController in `apps/catalog-service/src/infrastructure/controllers/events.controller.ts`
- [ ] T056 [P] [US1] Create EventDto in `libs/shared-dto/src/catalog/event.dto.ts`
- [ ] T057 [P] [US1] Create SeatAvailabilityDto in `libs/shared-dto/src/catalog/seat-availability.dto.ts`

### Booking Service - Core Reservation Logic

- [ ] T058 [P] [US1] Create Booking domain entity in `apps/booking-service/src/domain/entities/booking.entity.ts`
- [ ] T059 [P] [US1] Create BookingItem domain entity in `apps/booking-service/src/domain/entities/booking-item.entity.ts`
- [ ] T060 [P] [US1] Create SeatAvailabilityService in `apps/booking-service/src/domain/services/seat-availability.service.ts`
- [ ] T061 [P] [US1] Create BookingRepository port in `apps/booking-service/src/application/ports/booking.repository.ts`
- [ ] T062 [P] [US1] Create CatalogServicePort in `apps/booking-service/src/application/ports/catalog-service.port.ts`
- [ ] T063 [US1] Create TypeORM Booking entity in `apps/booking-service/src/infrastructure/persistence/entities/booking.orm-entity.ts`
- [ ] T064 [P] [US1] Create TypeORM BookingItem entity in `apps/booking-service/src/infrastructure/persistence/entities/booking-item.orm-entity.ts`
- [ ] T065 [US1] Implement TypeOrmBookingRepository with pessimistic locking in `apps/booking-service/src/infrastructure/persistence/repositories/booking.repository.ts`
- [ ] T066 [US1] Implement HttpCatalogServiceAdapter in `apps/booking-service/src/infrastructure/adapters/catalog-service.adapter.ts`
- [ ] T067 [US1] Create CreateBookingUseCase with seat locking in `apps/booking-service/src/application/use-cases/create-booking.use-case.ts`
- [ ] T068 [US1] Create BookingsController in `apps/booking-service/src/infrastructure/controllers/bookings.controller.ts`
- [ ] T069 [P] [US1] Create CreateBookingDto in `libs/shared-dto/src/booking/create-booking.dto.ts`
- [ ] T070 [P] [US1] Create BookingResponseDto in `libs/shared-dto/src/booking/booking-response.dto.ts`
- [ ] T071 [US1] Create BookingEventProducer in `apps/booking-service/src/infrastructure/messaging/booking-event.producer.ts`
- [ ] T072 [US1] Emit `booking.created` event after successful reservation

### Payment Service - Process Payment (US1 needs payment confirmation)

- [ ] T073 [P] [US1] Create Payment domain entity in `apps/payment-service/src/domain/entities/payment.entity.ts`
- [ ] T074 [P] [US1] Create PaymentService in `apps/payment-service/src/domain/services/payment.service.ts`
- [ ] T075 [P] [US1] Create PaymentRepository port in `apps/payment-service/src/application/ports/payment.repository.ts`
- [ ] T076 [P] [US1] Create PaymentGatewayPort in `apps/payment-service/src/application/ports/payment-gateway.port.ts`
- [ ] T077 [US1] Create TypeORM Payment entity in `apps/payment-service/src/infrastructure/persistence/entities/payment.orm-entity.ts`
- [ ] T078 [US1] Implement TypeOrmPaymentRepository in `apps/payment-service/src/infrastructure/persistence/repositories/payment.repository.ts`
- [ ] T079 [US1] Implement MockPaymentGatewayAdapter in `apps/payment-service/src/infrastructure/adapters/mock-payment-gateway.adapter.ts`
- [ ] T080 [US1] Create ProcessPaymentUseCase in `apps/payment-service/src/application/use-cases/process-payment.use-case.ts`
- [ ] T081 [US1] Create BookingCreatedHandler in `apps/payment-service/src/application/handlers/booking-created.handler.ts`
- [ ] T082 [US1] Create PaymentEventProducer in `apps/payment-service/src/infrastructure/messaging/payment-event.producer.ts`
- [ ] T083 [US1] Emit `payment.success` or `payment.failed` events

### Booking Service - Handle Payment Events

- [ ] T084 [US1] Create PaymentSuccessHandler in `apps/booking-service/src/application/handlers/payment-success.handler.ts`
- [ ] T085 [P] [US1] Create PaymentFailedHandler in `apps/booking-service/src/application/handlers/payment-failed.handler.ts`
- [ ] T086 [US1] Create ConfirmBookingUseCase in `apps/booking-service/src/application/use-cases/confirm-booking.use-case.ts`
- [ ] T087 [US1] Generate QR code reference on booking confirmation

### API Gateway - Booking Endpoints

- [ ] T088 [US1] Create GET /events endpoint in `apps/api-gateway/src/controllers/events.controller.ts`
- [ ] T089 [P] [US1] Create GET /events/:id/seats endpoint in `apps/api-gateway/src/controllers/events.controller.ts`
- [ ] T090 [US1] Create POST /bookings endpoint in `apps/api-gateway/src/controllers/bookings.controller.ts`
- [ ] T091 [US1] Create POST /bookings/:id/pay endpoint in `apps/api-gateway/src/controllers/bookings.controller.ts`
- [ ] T092 [US1] Wire up Swagger documentation with @nestjs/swagger decorators

### Reservation Timeout (US1 needs auto-expiration)

- [ ] T093 [US1] Create ReservationExpirationService with @Cron in `apps/booking-service/src/application/services/reservation-expiration.service.ts`
- [ ] T094 [US1] Emit `booking.cancelled` event when reservation expires

**Checkpoint**: User Story 1 complete - Customer can book tickets end-to-end

---

## Phase 4: User Story 2 - Admin Manages Events and Venues (Priority: P2)

**Goal**: Admin can create venues with seat layouts and schedule events with pricing

**Independent Test**: Authenticate as admin, create venue with seats, create event with pricing, verify in catalog

### Tests for User Story 2 (MANDATORY per Constitution Principle II) ⚠️

- [ ] T095 [P] [US2] Unit tests for CreateVenueUseCase in `apps/catalog-service/test/unit/use-cases/create-venue.use-case.spec.ts`
- [ ] T096 [P] [US2] Unit tests for CreateEventUseCase in `apps/catalog-service/test/unit/use-cases/create-event.use-case.spec.ts`
- [ ] T097 [P] [US2] Unit tests for SearchEventsUseCase in `apps/catalog-service/test/unit/use-cases/search-events.use-case.spec.ts`
- [ ] T098 [P] [US2] Integration tests for VenueRepository in `apps/catalog-service/test/integration/venue.repository.spec.ts`
- [ ] T099 [P] [US2] Contract tests for POST /venues in `apps/api-gateway/test/contract/venues.pact.spec.ts`
- [ ] T100 [US2] E2E test for admin creates event in `apps/api-gateway/test/e2e/admin-create-event.e2e-spec.ts`

### Catalog Service - Admin Operations

- [ ] T101 [P] [US2] Create VenueRepository port in `apps/catalog-service/src/application/ports/venue.repository.ts`
- [ ] T102 [US2] Implement TypeOrmVenueRepository in `apps/catalog-service/src/infrastructure/persistence/repositories/venue.repository.ts`
- [ ] T103 [US2] Create CreateVenueUseCase in `apps/catalog-service/src/application/use-cases/create-venue.use-case.ts`
- [ ] T104 [US2] Create CreateEventUseCase in `apps/catalog-service/src/application/use-cases/create-event.use-case.ts`
- [ ] T105 [P] [US2] Create SearchEventsUseCase with filtering in `apps/catalog-service/src/application/use-cases/search-events.use-case.ts`
- [ ] T106 [US2] Create VenuesController in `apps/catalog-service/src/infrastructure/controllers/venues.controller.ts`
- [ ] T107 [P] [US2] Create CreateVenueDto in `libs/shared-dto/src/catalog/create-venue.dto.ts`
- [ ] T108 [P] [US2] Create CreateEventDto in `libs/shared-dto/src/catalog/create-event.dto.ts`
- [ ] T109 [P] [US2] Create SeatLayoutDto in `libs/shared-dto/src/catalog/seat-layout.dto.ts`
- [ ] T110 [P] [US2] Create SeatPricingDto in `libs/shared-dto/src/catalog/seat-pricing.dto.ts`

### API Gateway - Admin Endpoints

- [ ] T111 [US2] Create POST /venues endpoint with @Roles('admin') in `apps/api-gateway/src/controllers/venues.controller.ts`
- [ ] T112 [P] [US2] Create GET /venues endpoint in `apps/api-gateway/src/controllers/venues.controller.ts`
- [ ] T113 [US2] Create POST /events endpoint with @Roles('admin') in `apps/api-gateway/src/controllers/events.controller.ts`
- [ ] T114 [US2] Add event filtering to GET /events endpoint (date, category, status)

**Checkpoint**: User Story 2 complete - Admin can manage catalog

---

## Phase 5: User Story 3 - Payment Processing and Booking Confirmation (Priority: P3)

**Goal**: Payment integration with success/failure handling, idempotency, and booking confirmation

**Independent Test**: Create reserved booking, simulate payment success/failure, verify booking status updates

### Tests for User Story 3 (MANDATORY per Constitution Principle II) ⚠️

- [ ] T115 [P] [US3] Unit tests for ProcessPaymentUseCase in `apps/payment-service/test/unit/use-cases/process-payment.use-case.spec.ts`
- [ ] T116 [P] [US3] Unit tests for idempotency in `apps/payment-service/test/unit/idempotency.spec.ts`
- [ ] T117 [P] [US3] Integration tests for PaymentRepository in `apps/payment-service/test/integration/payment.repository.spec.ts`
- [ ] T118 [US3] E2E test for payment success flow in `apps/api-gateway/test/e2e/payment-success.e2e-spec.ts`
- [ ] T119 [US3] E2E test for payment failure flow in `apps/api-gateway/test/e2e/payment-failure.e2e-spec.ts`
- [ ] T120 [US3] E2E test for reservation expiration in `apps/api-gateway/test/e2e/reservation-expiration.e2e-spec.ts`

### Payment Service - Enhanced Payment Logic

- [ ] T121 [US3] Add idempotency check to ProcessPaymentUseCase in `apps/payment-service/src/application/use-cases/process-payment.use-case.ts`
- [ ] T122 [US3] Handle duplicate payment callbacks gracefully
- [ ] T123 [P] [US3] Create PaymentDto in `libs/shared-dto/src/payment/payment.dto.ts`
- [ ] T124 [P] [US3] Create PaymentResultDto in `libs/shared-dto/src/payment/payment-result.dto.ts`

### Booking Service - Confirmation Logic

- [ ] T125 [US3] Implement ticket generation with QR reference in `apps/booking-service/src/domain/services/ticket.service.ts`
- [ ] T126 [US3] Add confirmed_at timestamp on booking confirmation
- [ ] T127 [US3] Add cancellation_reason on payment failure

### API Gateway - Payment Endpoint Enhancement

- [ ] T128 [US3] Add payment status to booking response
- [ ] T129 [US3] Add ticket information to confirmed booking response

**Checkpoint**: User Story 3 complete - Payment flow fully functional

---

## Phase 6: User Story 4 - Customer Views Booking History and Cancels (Priority: P4)

**Goal**: Customer can view their booking history and cancel confirmed bookings

**Independent Test**: Authenticate as customer, view booking history, cancel a confirmed booking, verify seats released

### Tests for User Story 4 (MANDATORY per Constitution Principle II) ⚠️

- [ ] T130 [P] [US4] Unit tests for GetBookingHistoryUseCase in `apps/booking-service/test/unit/use-cases/get-booking-history.use-case.spec.ts`
- [ ] T131 [P] [US4] Unit tests for CancelBookingUseCase in `apps/booking-service/test/unit/use-cases/cancel-booking.use-case.spec.ts`
- [ ] T132 [P] [US4] Integration tests for booking history in `apps/booking-service/test/integration/booking-history.spec.ts`
- [ ] T133 [US4] E2E test for view booking history in `apps/api-gateway/test/e2e/booking-history.e2e-spec.ts`
- [ ] T134 [US4] E2E test for cancel booking in `apps/api-gateway/test/e2e/cancel-booking.e2e-spec.ts`

### Booking Service - History and Cancellation

- [ ] T135 [US4] Create GetBookingHistoryUseCase in `apps/booking-service/src/application/use-cases/get-booking-history.use-case.ts`
- [ ] T136 [US4] Create CancelBookingUseCase in `apps/booking-service/src/application/use-cases/cancel-booking.use-case.ts`
- [ ] T137 [US4] Emit `booking.cancelled` event on user cancellation
- [ ] T138 [P] [US4] Create BookingHistoryDto in `libs/shared-dto/src/booking/booking-history.dto.ts`

### API Gateway - Booking Management Endpoints

- [ ] T139 [US4] Create GET /bookings endpoint (user's booking history) in `apps/api-gateway/src/controllers/bookings.controller.ts`
- [ ] T140 [US4] Create GET /bookings/:id endpoint (booking details with ticket) in `apps/api-gateway/src/controllers/bookings.controller.ts`
- [ ] T141 [US4] Create DELETE /bookings/:id endpoint (cancel booking) in `apps/api-gateway/src/controllers/bookings.controller.ts`

**Checkpoint**: User Story 4 complete - Booking management functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Documentation & API

- [ ] T142 [P] Verify Swagger/OpenAPI documentation is complete for all endpoints
- [ ] T143 [P] Update README.md with quickstart instructions
- [ ] T144 [P] Validate quickstart.md instructions work end-to-end

### Performance & Monitoring

- [ ] T145 [P] Add Prometheus metrics to each service in `src/infrastructure/metrics/`
- [ ] T146 [P] Add database query logging for performance analysis
- [ ] T147 [P] Add request logging middleware to API Gateway

### Code Quality

- [ ] T148 Run ESLint across all projects: `nx run-many --target=lint --all`
- [ ] T149 [P] Verify test coverage meets 80% minimum: `nx run-many --target=test --all --coverage`
- [ ] T150 Code cleanup and consistent formatting

### Security

- [ ] T151 [P] Add rate limiting to API Gateway
- [ ] T152 [P] Add input validation with class-validator
- [ ] T153 Verify no sensitive data in logs or error responses

### Database

- [ ] T154 Create TypeORM migrations for all services
- [ ] T155 [P] Verify database indexes are optimized per data-model.md

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS ALL USER STORIES
    ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) │
│     ↑              ↑              ↑              ↑            │
│     └──────────────┴──────────────┴──────────────┘            │
│         (Can run in parallel after Phase 2)                   │
└───────────────────────────────────────────────────────────────┘
    ↓
Phase 7 (Polish)
```

### User Story Dependencies

| Story | Can Start After | Depends On Stories | Notes |
|-------|-----------------|-------------------|-------|
| US1 (P1) | Phase 2 complete | None | MVP - Core booking flow |
| US2 (P2) | Phase 2 complete | None | Admin catalog management |
| US3 (P3) | Phase 2 complete | US1 (for booking entity) | Payment enhancement |
| US4 (P4) | Phase 2 complete | US1 (for booking entity) | Booking management |

### Within Each User Story

1. Tests written and FAIL first
2. Domain entities before repositories
3. Repositories before use cases
4. Use cases before controllers
5. Controllers before API Gateway integration
6. Story complete before checkpoint

### Parallel Opportunities

**Phase 1**: T002-T005 parallel, T007-T009 parallel, T011-T014 parallel
**Phase 2**: T015-T020 parallel (shared libs), T021-T023 parallel (DB), T025-T028 parallel (auth)
**Phase 3+**: All tests marked [P] parallel, all entities marked [P] parallel

---

## Parallel Example: User Story 1

```bash
# Batch 1: All domain entities (parallel)
- T042: Event entity
- T043: Venue entity  
- T044: Seat entity
- T058: Booking entity
- T059: BookingItem entity

# Batch 2: All ports (parallel, after entities)
- T046: EventRepository port
- T047: SeatRepository port
- T061: BookingRepository port
- T062: CatalogServicePort

# Batch 3: All ORM entities (parallel)
- T048: TypeORM Event
- T049: TypeORM Venue
- T050: TypeORM Seat
- T063: TypeORM Booking
- T064: TypeORM BookingItem
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (14 tasks)
2. Complete Phase 2: Foundational (20 tasks)
3. Complete Phase 3: User Story 1 (60 tasks)
4. **STOP and VALIDATE**: Full booking flow works
5. Deploy/demo if ready

**MVP Task Count**: 94 tasks

### Incremental Delivery

| Delivery | Stories | Cumulative Tasks | Value Delivered |
|----------|---------|------------------|-----------------|
| MVP | US1 | 94 | Customer can book tickets |
| v1.1 | +US2 | 114 | Admin can manage catalog |
| v1.2 | +US3 | 129 | Payment fully integrated |
| v1.3 | +US4 | 141 | Booking management |
| v1.4 | +Polish | 155 | Production-ready |

### Parallel Team Strategy

With 3 developers after Phase 2:

- **Dev A**: User Story 1 (booking) - 60 tasks
- **Dev B**: User Story 2 (catalog) - 20 tasks
- **Dev C**: User Story 3 (payment) - 15 tasks

After US1-US3 complete, all devs collaborate on US4 + Polish.

---

## Summary

| Category | Count |
|----------|-------|
| **Total Tasks** | 155 |
| Phase 1 (Setup) | 14 |
| Phase 2 (Foundational) | 20 |
| Phase 3 (US1 - MVP) | 60 |
| Phase 4 (US2) | 20 |
| Phase 5 (US3) | 15 |
| Phase 6 (US4) | 12 |
| Phase 7 (Polish) | 14 |
| **Parallelizable Tasks** | 78 (50%) |
| **Test Tasks** | 28 (18%) |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
