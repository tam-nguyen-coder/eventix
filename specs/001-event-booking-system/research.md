# Research: Event Booking System

**Feature Branch**: `001-event-booking-system`  
**Date**: 2025-12-11  
**Status**: Complete

## Research Areas

This document captures technical research and decisions made during the planning phase. Each section documents a specific unknown, the decision made, rationale, and alternatives considered.

---

## 1. Seat Locking Mechanism (Concurrency Control)

### Context
The system must prevent double-booking when multiple users attempt to reserve the same seat simultaneously (FR-009, SC-004).

### Decision
**Use Pessimistic Locking with PostgreSQL `SELECT ... FOR UPDATE NOWAIT`**

### Rationale
- Pessimistic locking guarantees exclusive access during the reservation transaction
- `NOWAIT` immediately fails if the row is locked, providing instant feedback to users
- PostgreSQL's row-level locking is efficient for high-contention scenarios
- Simpler to implement correctly than optimistic locking with retry logic

### Implementation
```typescript
// In BookingService - seat reservation transaction
async reserveSeats(eventId: string, seatIds: string[], userId: string): Promise<Booking> {
  return this.dataSource.transaction(async (manager) => {
    // Lock seats with NOWAIT - fails immediately if any seat is locked
    const seats = await manager
      .createQueryBuilder(BookingItem, 'bi')
      .setLock('pessimistic_write_or_fail') // FOR UPDATE NOWAIT
      .where('bi.seat_id IN (:...seatIds)', { seatIds })
      .andWhere('bi.event_id = :eventId', { eventId })
      .andWhere('bi.status IN (:...statuses)', { statuses: ['RESERVED', 'CONFIRMED'] })
      .getMany();

    if (seats.length > 0) {
      throw new ConflictException('One or more seats are no longer available');
    }

    // Create booking with RESERVED status
    const booking = await this.createBooking(manager, eventId, seatIds, userId);
    return booking;
  });
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Optimistic locking (version column) | Requires retry logic, poor UX with high contention |
| Application-level locks (Redis) | Additional infrastructure, complexity for distributed locks |
| Serializable isolation level | Too restrictive, performance impact on other transactions |

---

## 2. Reservation Timeout Implementation

### Context
Reserved seats must be automatically released after 10 minutes if payment is not received (FR-011, SC-005).

### Decision
**Use PostgreSQL scheduled job with pg_cron extension + NestJS @Cron decorator as fallback**

### Rationale
- Database-level job ensures timeouts are processed even if application restarts
- NestJS cron provides immediate in-memory processing for faster response
- Dual approach provides reliability and performance
- No additional infrastructure (like Redis) required

### Implementation
```typescript
// Booking entity with expiration timestamp
@Entity()
export class Booking {
  @Column({ type: 'timestamp' })
  expires_at: Date; // Set to NOW() + 10 minutes on creation

  @Column({ default: 'RESERVED' })
  status: BookingStatus;
}

// NestJS Cron job - runs every minute
@Injectable()
export class ReservationExpirationService {
  @Cron('* * * * *') // Every minute
  async expireReservations() {
    await this.bookingRepository
      .createQueryBuilder()
      .update(Booking)
      .set({ status: 'CANCELLED' })
      .where('status = :status', { status: 'RESERVED' })
      .andWhere('expires_at < NOW()')
      .execute();
    
    // Emit booking.cancelled events for released bookings
  }
}
```

```sql
-- PostgreSQL pg_cron job (backup mechanism)
SELECT cron.schedule('expire-reservations', '* * * * *', $$
  UPDATE booking 
  SET status = 'CANCELLED' 
  WHERE status = 'RESERVED' 
  AND expires_at < NOW()
$$);
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Redis TTL with keyspace notifications | Additional infrastructure, eventual consistency issues |
| Bull/BullMQ delayed jobs | Requires Redis, adds complexity |
| Per-booking setTimeout | Doesn't survive restarts, memory overhead |

---

## 3. Payment Callback Idempotency

### Context
The system must handle duplicate payment callbacks gracefully without creating duplicate bookings (FR-016).

### Decision
**Use idempotency key pattern with unique constraint on (booking_id, transaction_id)**

### Rationale
- Database unique constraint prevents duplicate payments at persistence level
- Idempotency check happens before processing, not after
- Simple, reliable, and doesn't require distributed locks

### Implementation
```typescript
@Entity()
export class Payment {
  @Column()
  booking_id: string;

  @Column({ unique: true })
  transaction_id: string; // Unique constraint prevents duplicates

  @Column()
  status: PaymentStatus;
}

// Payment handler
async handlePaymentCallback(event: PaymentEvent): Promise<void> {
  // Check if already processed
  const existing = await this.paymentRepository.findOne({
    where: { transaction_id: event.transactionId }
  });

  if (existing) {
    this.logger.log(`Duplicate payment callback ignored: ${event.transactionId}`);
    return; // Idempotent - already processed
  }

  // Process payment
  await this.processPayment(event);
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Redis-based idempotency cache | Additional infrastructure, cache invalidation issues |
| Message deduplication in Redpanda | Only catches exact duplicates, not redeliveries |
| Optimistic locking on booking | Doesn't prevent duplicate payment records |

---

## 4. Redpanda/Kafka Integration with NestJS

### Context
Services communicate asynchronously via Redpanda (Kafka-compatible) message broker.

### Decision
**Use @nestjs/microservices with Kafka transport + custom client wrapper**

### Rationale
- Native NestJS support reduces boilerplate
- KafkaJS under the hood is well-maintained and performant
- Decorators provide clean handler definitions
- Consumer groups ensure at-least-once delivery

### Implementation
```typescript
// Producer (Booking Service)
@Injectable()
export class BookingEventProducer {
  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async emitBookingCreated(booking: Booking): Promise<void> {
    await this.kafkaClient.emit(TOPIC_BOOKING_CREATED, {
      key: booking.id,
      value: {
        bookingId: booking.id,
        userId: booking.user_id,
        amount: booking.total_amount,
        eventId: booking.event_id,
      },
    });
  }
}

// Consumer (Payment Service)
@Controller()
export class PaymentEventHandler {
  @EventPattern(TOPIC_BOOKING_CREATED)
  async handleBookingCreated(@Payload() data: BookingCreatedEvent): Promise<void> {
    await this.paymentService.processPayment(data);
  }
}

// Module configuration
@Module({
  imports: [
    ClientsModule.register([{
      name: 'KAFKA_CLIENT',
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'booking-service',
          brokers: ['localhost:9092'],
        },
        consumer: {
          groupId: 'booking-service-consumer',
        },
      },
    }]),
  ],
})
export class MessagingModule {}
```

### Event Topics
| Topic | Producer | Consumer | Payload |
|-------|----------|----------|---------|
| `booking.created` | Booking Service | Payment Service | `{ bookingId, userId, amount }` |
| `booking.cancelled` | Booking Service | - | `{ bookingId, reason }` |
| `payment.success` | Payment Service | Booking Service | `{ bookingId, transactionId }` |
| `payment.failed` | Payment Service | Booking Service | `{ bookingId, reason }` |

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Direct HTTP calls between services | Tight coupling, no retry/dead-letter support |
| RabbitMQ | Less suitable for event streaming, different paradigm |
| Custom Kafka client | Unnecessary complexity when NestJS provides abstraction |

---

## 5. Auth0 Integration with NestJS

### Context
System uses Auth0 for authentication (FR-001, FR-002, FR-003).

### Decision
**Use passport-jwt strategy with Auth0 JWKS endpoint**

### Rationale
- Standard JWT validation approach
- JWKS endpoint handles key rotation automatically
- Passport integration is well-supported in NestJS
- Role claims extracted from JWT for RBAC

### Implementation
```typescript
// JWT Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
      }),
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload['https://eventix.com/roles'] || ['customer'],
    };
  }
}

// Roles Guard
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Usage
@Controller('events')
export class EventsController {
  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createEvent(@Body() dto: CreateEventDto) { ... }

  @Get()
  async listEvents() { ... } // Public - no guard
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Custom JWT validation | Reinventing the wheel, missing JWKS rotation |
| Auth0 Management API for each request | Too slow, unnecessary API calls |
| Session-based auth | Doesn't fit stateless microservices architecture |

---

## 6. Clean Architecture Implementation in NestJS

### Context
Services follow Clean Architecture for maintainability and testability.

### Decision
**Layer separation with dependency injection and interface-based repositories**

### Rationale
- Domain layer remains framework-agnostic and testable
- Use cases encapsulate business logic
- Infrastructure adapters are easily swappable
- NestJS DI system maps cleanly to ports/adapters pattern

### Implementation
```text
src/
├── domain/                    # Core business logic (no NestJS dependencies)
│   ├── entities/              # Pure TypeScript classes
│   │   └── booking.entity.ts
│   ├── value-objects/         # Immutable value types
│   │   └── money.vo.ts
│   └── services/              # Domain services
│       └── seat-availability.service.ts
│
├── application/               # Use cases and ports
│   ├── use-cases/             # Application services
│   │   └── create-booking.use-case.ts
│   ├── ports/                 # Interfaces (abstractions)
│   │   ├── booking.repository.ts      # Output port
│   │   └── payment-gateway.port.ts    # Output port
│   └── dto/                   # Input/Output DTOs
│
├── infrastructure/            # Framework and external concerns
│   ├── persistence/           # TypeORM implementations
│   │   ├── typeorm-booking.repository.ts
│   │   └── booking.orm-entity.ts
│   ├── messaging/             # Kafka/Redpanda
│   └── controllers/           # NestJS HTTP controllers
│
└── main.ts                    # Bootstrap
```

```typescript
// Domain entity (pure TypeScript)
export class Booking {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly eventId: string,
    public status: BookingStatus,
    public readonly expiresAt: Date,
  ) {}

  confirm(): void {
    if (this.status !== BookingStatus.RESERVED) {
      throw new DomainException('Can only confirm reserved bookings');
    }
    this.status = BookingStatus.CONFIRMED;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}

// Port (interface)
export interface BookingRepository {
  findById(id: string): Promise<Booking | null>;
  save(booking: Booking): Promise<void>;
}

// Use case
@Injectable()
export class CreateBookingUseCase {
  constructor(
    @Inject('BookingRepository') private readonly bookingRepo: BookingRepository,
    @Inject('CatalogService') private readonly catalogService: CatalogServicePort,
  ) {}

  async execute(command: CreateBookingCommand): Promise<Booking> {
    // Business logic here
  }
}

// Infrastructure adapter
@Injectable()
export class TypeOrmBookingRepository implements BookingRepository {
  constructor(
    @InjectRepository(BookingOrmEntity)
    private readonly repo: Repository<BookingOrmEntity>,
  ) {}

  async findById(id: string): Promise<Booking | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| NestJS-only (no layers) | Tight coupling, hard to test, framework lock-in |
| Hexagonal without use cases | Missing explicit application logic boundary |
| CQRS/Event Sourcing | Overkill for current requirements, adds complexity |

---

## Summary

All technical unknowns have been resolved with clear decisions and rationale. The implementation will follow these patterns:

| Area | Decision |
|------|----------|
| Concurrency Control | Pessimistic locking with `FOR UPDATE NOWAIT` |
| Reservation Timeout | pg_cron + NestJS @Cron decorator |
| Idempotency | Database unique constraint on transaction_id |
| Messaging | @nestjs/microservices with Kafka transport |
| Authentication | passport-jwt with Auth0 JWKS |
| Architecture | Clean Architecture with DI-based ports/adapters |
