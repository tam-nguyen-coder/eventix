# Technical Plan: Core Booking System

> **Module:** booking-core  
> **Status:** Draft  
> **Estimated Effort:** 3 sprints (6 weeks)

---

## 1. Architecture Overview

### 1.1. System Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                       │
│  │  Client  │    │  Auth0   │    │ Payment  │                       │
│  │  (SPA)   │    │          │    │ Gateway  │                       │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘                       │
└───────│───────────────│───────────────│─────────────────────────────┘
        │               │               │
        ▼               ▼               │
┌───────────────────────────────────────│─────────────────────────────┐
│                      API GATEWAY      │                              │
│  ┌─────────────────────────────────┐  │                              │
│  │        api-gateway              │◄─┘                              │
│  │  - JWT Validation               │                                 │
│  │  - Request Routing              │                                 │
│  │  - Rate Limiting                │                                 │
│  └──────────────┬──────────────────┘                                 │
└─────────────────│────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MICROSERVICES                                   │
│                                                                      │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐     │
│  │ catalog-service│    │booking-service │    │payment-service │     │
│  │                │◄──►│                │◄──►│                │     │
│  │ - Events       │    │ - Reservations │    │ - Processing   │     │
│  │ - Venues       │    │ - Seat Locking │    │ - Refunds      │     │
│  │ - Seats        │    │ - Tickets      │    │                │     │
│  └───────┬────────┘    └───────┬────────┘    └───────┬────────┘     │
│          │                     │                     │               │
│          ▼                     ▼                     ▼               │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐     │
│  │  catalog_db    │    │  booking_db    │    │  payment_db    │     │
│  │  (PostgreSQL)  │    │  (PostgreSQL)  │    │  (PostgreSQL)  │     │
│  └────────────────┘    └────────────────┘    └────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      MESSAGE BROKER                                  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Redpanda (Kafka)                        │    │
│  │                                                              │    │
│  │  Topics:                                                     │    │
│  │  - booking.created    - payment.success                      │    │
│  │  - booking.confirmed  - payment.failed                       │    │
│  │  - booking.cancelled                                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2. Booking Service Internal Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BOOKING SERVICE (Clean Architecture)             │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    PRESENTATION LAYER                        │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                 │    │
│  │  │ BookingController│  │ PaymentConsumer  │                 │    │
│  │  └────────┬─────────┘  └────────┬─────────┘                 │    │
│  └───────────│─────────────────────│────────────────────────────┘    │
│              │                     │                                 │
│  ┌───────────▼─────────────────────▼────────────────────────────┐    │
│  │                    APPLICATION LAYER                          │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                  │    │
│  │  │ CreateBooking    │  │ ConfirmBooking   │                  │    │
│  │  │ UseCase          │  │ UseCase          │                  │    │
│  │  └────────┬─────────┘  └────────┬─────────┘                  │    │
│  │           │                     │                             │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                  │    │
│  │  │ CancelBooking    │  │ ExpireBookings   │                  │    │
│  │  │ UseCase          │  │ UseCase          │                  │    │
│  │  └────────┬─────────┘  └────────┬─────────┘                  │    │
│  └───────────│─────────────────────│────────────────────────────┘    │
│              │                     │                                 │
│  ┌───────────▼─────────────────────▼────────────────────────────┐    │
│  │                      DOMAIN LAYER                             │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                  │    │
│  │  │ Booking Entity   │  │ BookingItem      │                  │    │
│  │  │ - id             │  │ Entity           │                  │    │
│  │  │ - status         │  │ - seatId         │                  │    │
│  │  │ - expiresAt      │  │ - price          │                  │    │
│  │  └──────────────────┘  └──────────────────┘                  │    │
│  │                                                               │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                  │    │
│  │  │ IBooking         │  │ IEventPublisher  │                  │    │
│  │  │ Repository (Port)│  │ (Port)           │                  │    │
│  │  └──────────────────┘  └──────────────────┘                  │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │                   INFRASTRUCTURE LAYER                         │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                   │    │
│  │  │ TypeORM Booking  │  │ Kafka Event      │                   │    │
│  │  │ Repository       │  │ Publisher        │                   │    │
│  │  └──────────────────┘  └──────────────────┘                   │    │
│  │                                                                │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                   │    │
│  │  │ Catalog Service  │  │ PostgreSQL       │                   │    │
│  │  │ Client           │  │ Connection       │                   │    │
│  │  └──────────────────┘  └──────────────────┘                   │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Design

### 2.1. Booking Service Modules

```
apps/booking-service/src/
├── main.ts
├── app.module.ts
├── booking/
│   ├── booking.module.ts
│   │
│   ├── presentation/
│   │   ├── controllers/
│   │   │   └── booking.controller.ts
│   │   ├── consumers/
│   │   │   └── payment-result.consumer.ts
│   │   └── dto/
│   │       ├── create-booking.dto.ts
│   │       ├── booking-response.dto.ts
│   │       └── cancel-booking.dto.ts
│   │
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── create-booking.use-case.ts
│   │   │   ├── confirm-booking.use-case.ts
│   │   │   ├── cancel-booking.use-case.ts
│   │   │   └── expire-bookings.use-case.ts
│   │   └── services/
│   │       └── booking.service.ts
│   │
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── booking.entity.ts
│   │   │   └── booking-item.entity.ts
│   │   ├── enums/
│   │   │   └── booking-status.enum.ts
│   │   ├── ports/
│   │   │   ├── booking.repository.interface.ts
│   │   │   └── event-publisher.interface.ts
│   │   └── exceptions/
│   │       ├── seat-already-reserved.exception.ts
│   │       └── booking-expired.exception.ts
│   │
│   └── infrastructure/
│       ├── repositories/
│       │   └── typeorm-booking.repository.ts
│       ├── publishers/
│       │   └── kafka-event.publisher.ts
│       ├── clients/
│       │   └── catalog-service.client.ts
│       └── schedulers/
│           └── expiration.scheduler.ts
│
└── config/
    ├── database.config.ts
    └── kafka.config.ts
```

### 2.2. Key Classes

#### Booking Entity

```typescript
// domain/entities/booking.entity.ts
@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ name: 'ticket_reference', nullable: true })
  ticketReference: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @OneToMany(() => BookingItem, (item) => item.booking, { cascade: true })
  items: BookingItem[];

  // Domain methods
  confirm(ticketReference: string): void {
    if (this.status !== BookingStatus.PENDING) {
      throw new InvalidBookingStateException(this.id, this.status);
    }
    this.status = BookingStatus.CONFIRMED;
    this.ticketReference = ticketReference;
  }

  cancel(): void {
    if (this.status === BookingStatus.CONFIRMED) {
      // Could add refund logic check here
    }
    this.status = BookingStatus.CANCELLED;
  }

  isExpired(): boolean {
    return this.status === BookingStatus.PENDING && new Date() > this.expiresAt;
  }
}
```

#### Create Booking Use Case

```typescript
// application/use-cases/create-booking.use-case.ts
@Injectable()
export class CreateBookingUseCase {
  constructor(
    @Inject(BOOKING_REPOSITORY)
    private readonly bookingRepository: IBookingRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
    private readonly catalogClient: CatalogServiceClient,
    private readonly dataSource: DataSource,
  ) {}

  async execute(dto: CreateBookingDto, userId: string): Promise<Booking> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validate event exists
      const event = await this.catalogClient.getEvent(dto.eventId);
      if (!event) {
        throw new EventNotFoundException(dto.eventId);
      }

      // 2. Get seat info with prices
      const seats = await this.catalogClient.getSeatsWithPrices(
        dto.eventId,
        dto.seatIds,
      );

      // 3. Check & lock seats (pessimistic locking)
      await this.bookingRepository.lockSeatsForEvent(
        queryRunner,
        dto.eventId,
        dto.seatIds,
      );

      // 4. Create booking
      const booking = new Booking();
      booking.userId = userId;
      booking.eventId = dto.eventId;
      booking.totalAmount = seats.reduce((sum, s) => sum + s.price, 0);
      booking.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      booking.items = seats.map((seat) => {
        const item = new BookingItem();
        item.seatId = seat.id;
        item.price = seat.price;
        return item;
      });

      const savedBooking = await queryRunner.manager.save(booking);

      // 5. Commit transaction
      await queryRunner.commitTransaction();

      // 6. Publish event (after commit)
      await this.eventPublisher.publish({
        eventType: 'booking.created',
        payload: {
          bookingId: savedBooking.id,
          userId: savedBooking.userId,
          eventId: savedBooking.eventId,
          seatIds: dto.seatIds,
          totalAmount: savedBooking.totalAmount,
          expiresAt: savedBooking.expiresAt.toISOString(),
        },
      });

      return savedBooking;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error.code === '23505') {
        // Unique violation
        throw new SeatAlreadyReservedException(dto.seatIds);
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
```

---

## 3. Database Design

### 3.1. ERD

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BOOKING DATABASE                              │
│                                                                      │
│  ┌───────────────────────┐          ┌───────────────────────┐       │
│  │       bookings        │          │    booking_items      │       │
│  ├───────────────────────┤          ├───────────────────────┤       │
│  │ id (PK, UUID)         │──────────│ id (PK, UUID)         │       │
│  │ user_id (VARCHAR)     │     1:N  │ booking_id (FK)       │       │
│  │ event_id (UUID)       │          │ seat_id (UUID)        │       │
│  │ status (ENUM)         │          │ price (DECIMAL)       │       │
│  │ total_amount (DECIMAL)│          │ created_at (TIMESTAMP)│       │
│  │ currency (VARCHAR)    │          └───────────────────────┘       │
│  │ ticket_reference      │                                          │
│  │ created_at (TIMESTAMP)│          ┌───────────────────────┐       │
│  │ updated_at (TIMESTAMP)│          │  processed_events     │       │
│  │ expires_at (TIMESTAMP)│          ├───────────────────────┤       │
│  └───────────────────────┘          │ event_id (PK, UUID)   │       │
│                                     │ event_type (VARCHAR)  │       │
│                                     │ processed_at          │       │
│                                     └───────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2. Indexes

```sql
-- Primary queries optimization
CREATE INDEX idx_booking_user_id ON bookings(user_id);
CREATE INDEX idx_booking_event_id ON bookings(event_id);
CREATE INDEX idx_booking_status ON bookings(status);

-- Expiration job optimization
CREATE INDEX idx_booking_pending_expires 
ON bookings(expires_at) 
WHERE status = 'PENDING';

-- Prevent double booking (critical!)
CREATE UNIQUE INDEX idx_unique_seat_booking 
ON booking_items(seat_id, booking_id);

-- Additional constraint for active bookings
CREATE UNIQUE INDEX idx_active_seat_per_event
ON booking_items(seat_id)
WHERE EXISTS (
  SELECT 1 FROM bookings b 
  WHERE b.id = booking_id 
  AND b.status IN ('PENDING', 'CONFIRMED')
);
```

### 3.3. Migrations

```typescript
// migrations/1700000000000-CreateBookingTables.ts
export class CreateBookingTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(`
      CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED')
    `);

    // Create bookings table
    await queryRunner.query(`
      CREATE TABLE bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        event_id UUID NOT NULL,
        status booking_status DEFAULT 'PENDING',
        total_amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        ticket_reference VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
      )
    `);

    // Create booking_items table
    await queryRunner.query(`
      CREATE TABLE booking_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        seat_id UUID NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create processed_events table (for idempotency)
    await queryRunner.query(`
      CREATE TABLE processed_events (
        event_id UUID PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        processed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_booking_user_id ON bookings(user_id);
      CREATE INDEX idx_booking_event_id ON bookings(event_id);
      CREATE INDEX idx_booking_status ON bookings(status);
      CREATE INDEX idx_booking_pending_expires ON bookings(expires_at) WHERE status = 'PENDING';
      CREATE UNIQUE INDEX idx_unique_seat_booking ON booking_items(seat_id, booking_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS processed_events');
    await queryRunner.query('DROP TABLE IF EXISTS booking_items');
    await queryRunner.query('DROP TABLE IF EXISTS bookings');
    await queryRunner.query('DROP TYPE IF EXISTS booking_status');
  }
}
```

---

## 4. Integration Design

### 4.1. Kafka Configuration

```typescript
// config/kafka.config.ts
export const kafkaConfig = {
  clientId: 'booking-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  consumer: {
    groupId: 'booking-service-group',
  },
  producer: {
    allowAutoTopicCreation: true,
  },
};

// Topics
export const KAFKA_TOPICS = {
  // Produce
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
  // Consume
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
} as const;
```

### 4.2. Consumer Implementation

```typescript
// presentation/consumers/payment-result.consumer.ts
@Controller()
export class PaymentResultConsumer {
  constructor(
    private readonly confirmBookingUseCase: ConfirmBookingUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
    @Inject(PROCESSED_EVENTS_REPOSITORY)
    private readonly processedEventsRepo: IProcessedEventsRepository,
  ) {}

  @EventPattern(KAFKA_TOPICS.PAYMENT_SUCCESS)
  async handlePaymentSuccess(
    @Payload() event: PaymentSuccessEvent,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const { eventId, payload } = event;

    // Idempotency check
    if (await this.processedEventsRepo.exists(eventId)) {
      return;
    }

    await this.confirmBookingUseCase.execute(
      payload.bookingId,
      payload.transactionId,
    );

    await this.processedEventsRepo.save({
      eventId,
      eventType: 'payment.success',
    });
  }

  @EventPattern(KAFKA_TOPICS.PAYMENT_FAILED)
  async handlePaymentFailed(
    @Payload() event: PaymentFailedEvent,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const { eventId, payload } = event;

    if (await this.processedEventsRepo.exists(eventId)) {
      return;
    }

    await this.cancelBookingUseCase.execute(
      payload.bookingId,
      'PAYMENT_FAILED',
    );

    await this.processedEventsRepo.save({
      eventId,
      eventType: 'payment.failed',
    });
  }
}
```

### 4.3. Catalog Service Client

```typescript
// infrastructure/clients/catalog-service.client.ts
@Injectable()
export class CatalogServiceClient {
  constructor(private readonly httpService: HttpService) {}

  async getEvent(eventId: string): Promise<EventDto | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/internal/events/${eventId}`),
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getSeatsWithPrices(
    eventId: string,
    seatIds: string[],
  ): Promise<SeatWithPriceDto[]> {
    const response = await firstValueFrom(
      this.httpService.post(`/internal/events/${eventId}/seats/prices`, {
        seatIds,
      }),
    );
    return response.data;
  }
}
```

---

## 5. Security Considerations

### 5.1. Authentication Flow

```
┌──────┐     ┌─────────┐     ┌───────────┐     ┌─────────────────┐
│Client│────▶│ Auth0   │────▶│  Gateway  │────▶│ Booking Service │
└──────┘     └─────────┘     └───────────┘     └─────────────────┘
   │              │               │                    │
   │ 1. Login     │               │                    │
   │─────────────▶│               │                    │
   │              │               │                    │
   │ 2. JWT Token │               │                    │
   │◀─────────────│               │                    │
   │              │               │                    │
   │ 3. API Call with Bearer Token│                    │
   │─────────────────────────────▶│                    │
   │              │               │                    │
   │              │ 4. Validate   │                    │
   │              │    JWT        │                    │
   │              │◀──────────────│                    │
   │              │               │                    │
   │              │               │ 5. Forward with    │
   │              │               │    user context    │
   │              │               │───────────────────▶│
   │              │               │                    │
   │              │               │ 6. Response        │
   │              │               │◀───────────────────│
   │              │               │                    │
   │ 7. Response  │               │                    │
   │◀─────────────────────────────│                    │
```

### 5.2. Authorization Rules

```typescript
// Guards
@Injectable()
export class BookingOwnerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.sub;
    const bookingId = request.params.bookingId;

    const booking = await this.bookingService.findById(bookingId);
    return booking.userId === userId;
  }
}
```

---

## 6. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Race condition on seat booking | High | Medium | Pessimistic locking + unique constraint |
| Message broker downtime | High | Low | Dead letter queue + retry mechanism |
| Catalog service unavailable | Medium | Medium | Circuit breaker + graceful degradation |
| Database connection exhaustion | High | Low | Connection pooling + timeout settings |
| Payment callback delay | Medium | Medium | Extend expiration during processing |

---

## 7. Testing Strategy

### 7.1. Unit Tests

| Component | Test Focus |
|-----------|------------|
| Booking Entity | Domain logic (confirm, cancel, isExpired) |
| Use Cases | Business rules, error handling |
| DTOs | Validation rules |

### 7.2. Integration Tests

| Scenario | Setup |
|----------|-------|
| Create booking | Test DB + Mock Catalog Client |
| Payment success flow | Test DB + Test Kafka |
| Expiration job | Test DB with expired bookings |

### 7.3. E2E Tests

| Flow | Coverage |
|------|----------|
| Happy path | Create → Payment → Confirm |
| Timeout path | Create → Wait → Expire |
| Cancel path | Create → Cancel |

---

## 8. Deployment Considerations

### 8.1. Environment Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=eventix_booking_db
DATABASE_USER=booking_user
DATABASE_PASSWORD=secret

# Kafka
KAFKA_BROKER=localhost:9092
KAFKA_GROUP_ID=booking-service-group

# Catalog Service
CATALOG_SERVICE_URL=http://catalog-service:3001

# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://api.eventix.com
```

### 8.2. Health Checks

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private kafka: KafkaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.kafka.pingCheck('kafka'),
    ]);
  }
}
```

---

## 9. Timeline

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| **Sprint 1** | Foundation | Project setup, DB schema, basic CRUD |
| **Sprint 2** | Core Logic | Seat locking, booking flow, Kafka integration |
| **Sprint 3** | Polish | Error handling, tests, documentation |

See [tasks.md](./tasks.md) for detailed task breakdown.

