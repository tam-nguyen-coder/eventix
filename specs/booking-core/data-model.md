# Data Model: Core Booking System

> **Module:** booking-core  
> **Database:** PostgreSQL 16.x  
> **ORM:** TypeORM

---

## 1. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EVENTIX DATA MODEL                              │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          CATALOG DATABASE                              │  │
│  │                                                                        │  │
│  │  ┌─────────────┐    1:N    ┌─────────────┐    1:N    ┌─────────────┐  │  │
│  │  │   venues    │──────────▶│   events    │──────────▶│event_seat   │  │  │
│  │  ├─────────────┤           ├─────────────┤           │  _prices    │  │  │
│  │  │ id (PK)     │           │ id (PK)     │           ├─────────────┤  │  │
│  │  │ name        │           │ venue_id(FK)│           │ event_id(FK)│  │  │
│  │  │ location    │           │ name        │           │ seat_type   │  │  │
│  │  │ capacity    │           │ start_time  │           │ price       │  │  │
│  │  │ created_at  │           │ end_time    │           └─────────────┘  │  │
│  │  │ updated_at  │           │ status      │                            │  │
│  │  └─────────────┘           │ created_at  │                            │  │
│  │         │                  │ updated_at  │                            │  │
│  │         │ 1:N              └─────────────┘                            │  │
│  │         ▼                                                              │  │
│  │  ┌─────────────┐                                                      │  │
│  │  │    seats    │                                                      │  │
│  │  ├─────────────┤                                                      │  │
│  │  │ id (PK)     │                                                      │  │
│  │  │ venue_id(FK)│                                                      │  │
│  │  │ row         │                                                      │  │
│  │  │ number      │                                                      │  │
│  │  │ type        │◀─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐           │  │
│  │  │ created_at  │                                          │           │  │
│  │  └─────────────┘                                          │           │  │
│  │                                                           │           │  │
│  └───────────────────────────────────────────────────────────│───────────┘  │
│                                                              │              │
│  ┌───────────────────────────────────────────────────────────│───────────┐  │
│  │                          BOOKING DATABASE                 │           │  │
│  │                                                           │           │  │
│  │  ┌─────────────┐    1:N    ┌─────────────┐               │           │  │
│  │  │  bookings   │──────────▶│booking_items│───────────────┘           │  │
│  │  ├─────────────┤           ├─────────────┤  (seat_id reference)      │  │
│  │  │ id (PK)     │           │ id (PK)     │                           │  │
│  │  │ user_id     │           │ booking_id  │                           │  │
│  │  │ event_id    │           │ seat_id     │◀─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │  │
│  │  │ status      │           │ price       │                         │ │  │
│  │  │ total_amount│           │ created_at  │                         │ │  │
│  │  │ currency    │           └─────────────┘                         │ │  │
│  │  │ ticket_ref  │                                                   │ │  │
│  │  │ created_at  │           ┌─────────────┐                         │ │  │
│  │  │ updated_at  │           │ processed   │                         │ │  │
│  │  │ expires_at  │           │  _events    │  (Idempotency)          │ │  │
│  │  └─────────────┘           ├─────────────┤                         │ │  │
│  │                            │ event_id(PK)│                         │ │  │
│  │                            │ event_type  │                         │ │  │
│  │                            │ processed_at│                         │ │  │
│  │                            └─────────────┘                         │ │  │
│  │                                                                    │ │  │
│  └────────────────────────────────────────────────────────────────────│─┘  │
│                                                                       │    │
│  ┌────────────────────────────────────────────────────────────────────│─┐  │
│  │                          PAYMENT DATABASE                          │  │  │
│  │                                                                    │  │  │
│  │  ┌─────────────┐                                                   │  │  │
│  │  │  payments   │───────────────────────────────────────────────────┘  │  │
│  │  ├─────────────┤  (booking_id reference)                              │  │
│  │  │ id (PK)     │                                                      │  │
│  │  │ booking_id  │                                                      │  │
│  │  │ amount      │                                                      │  │
│  │  │ currency    │                                                      │  │
│  │  │ status      │                                                      │  │
│  │  │ provider    │                                                      │  │
│  │  │ external_id │                                                      │  │
│  │  │ created_at  │                                                      │  │
│  │  │ updated_at  │                                                      │  │
│  │  └─────────────┘                                                      │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

Legend:
───────▶  Foreign Key (owned relationship)
─ ─ ─ ─▶  Reference (cross-service, no FK constraint)
```

---

## 2. Table Definitions

### 2.1. Catalog Database (`eventix_catalog_db`)

#### venues

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Venue name |
| `location` | VARCHAR(500) | | Full address |
| `capacity` | INTEGER | | Total capacity |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### seats

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `venue_id` | UUID | FK → venues(id) ON DELETE CASCADE | Parent venue |
| `row` | VARCHAR(10) | NOT NULL | Row identifier (A, B, C...) |
| `number` | INTEGER | NOT NULL | Seat number in row |
| `type` | seat_type ENUM | NOT NULL | VIP, REGULAR, ECONOMY |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

```sql
CREATE TYPE seat_type AS ENUM ('VIP', 'REGULAR', 'ECONOMY');

-- Unique constraint: one seat per position per venue
CREATE UNIQUE INDEX idx_unique_seat_position 
ON seats(venue_id, row, number);
```

#### events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `venue_id` | UUID | FK → venues(id) | Host venue |
| `name` | VARCHAR(255) | NOT NULL | Event name |
| `description` | TEXT | | Event description |
| `start_time` | TIMESTAMP | NOT NULL | Event start |
| `end_time` | TIMESTAMP | NOT NULL | Event end |
| `status` | event_status ENUM | DEFAULT 'DRAFT' | Current status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

```sql
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
```

#### event_seat_prices

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `event_id` | UUID | PK, FK → events(id) ON DELETE CASCADE | Parent event |
| `seat_type` | seat_type ENUM | PK | Seat type |
| `price` | DECIMAL(10,2) | NOT NULL | Price in base currency |

---

### 2.2. Booking Database (`eventix_booking_db`)

#### bookings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `user_id` | VARCHAR(255) | NOT NULL | Auth0 user ID (sub) |
| `event_id` | UUID | NOT NULL | Reference to event |
| `status` | booking_status ENUM | DEFAULT 'PENDING' | Current status |
| `total_amount` | DECIMAL(10,2) | NOT NULL | Total booking amount |
| `currency` | VARCHAR(3) | DEFAULT 'USD' | Currency code |
| `ticket_reference` | VARCHAR(255) | UNIQUE | QR code reference |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |
| `expires_at` | TIMESTAMP | NOT NULL | Reservation expiration |

```sql
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- Indexes for common queries
CREATE INDEX idx_booking_user_id ON bookings(user_id);
CREATE INDEX idx_booking_event_id ON bookings(event_id);
CREATE INDEX idx_booking_status ON bookings(status);

-- Partial index for expiration job (only PENDING bookings)
CREATE INDEX idx_booking_pending_expires 
ON bookings(expires_at) 
WHERE status = 'PENDING';
```

#### booking_items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `booking_id` | UUID | FK → bookings(id) ON DELETE CASCADE | Parent booking |
| `seat_id` | UUID | NOT NULL | Reference to seat |
| `price` | DECIMAL(10,2) | NOT NULL | Price at time of booking |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

```sql
-- Prevent same seat in multiple active bookings
CREATE UNIQUE INDEX idx_active_seat_booking 
ON booking_items(seat_id)
WHERE EXISTS (
  SELECT 1 FROM bookings 
  WHERE bookings.id = booking_items.booking_id 
  AND bookings.status IN ('PENDING', 'CONFIRMED')
);

-- Alternative: simpler constraint (recommended)
CREATE UNIQUE INDEX idx_unique_seat_booking 
ON booking_items(seat_id, booking_id);
```

#### processed_events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `event_id` | UUID | PK | Kafka event ID |
| `event_type` | VARCHAR(100) | NOT NULL | Event type name |
| `processed_at` | TIMESTAMP | DEFAULT NOW() | Processing timestamp |

```sql
-- Auto-cleanup old events (optional trigger)
CREATE INDEX idx_processed_events_timestamp 
ON processed_events(processed_at);
```

---

### 2.3. Payment Database (`eventix_payment_db`)

#### payments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| `booking_id` | UUID | UNIQUE, NOT NULL | Reference to booking |
| `amount` | DECIMAL(10,2) | NOT NULL | Payment amount |
| `currency` | VARCHAR(3) | DEFAULT 'USD' | Currency code |
| `status` | payment_status ENUM | DEFAULT 'PENDING' | Current status |
| `provider` | VARCHAR(50) | | Payment provider |
| `external_id` | VARCHAR(255) | | Provider transaction ID |
| `failure_reason` | TEXT | | Failure details if failed |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

```sql
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- One payment per booking
CREATE UNIQUE INDEX idx_payment_booking ON payments(booking_id);
```

---

## 3. TypeORM Entity Definitions

### 3.1. Booking Entity

```typescript
// apps/booking-service/src/booking/domain/entities/booking.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BookingItem } from './booking-item.entity';
import { BookingStatus } from '../enums/booking-status.enum';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({
    name: 'ticket_reference',
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  ticketReference: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @OneToMany(() => BookingItem, (item) => item.booking, {
    cascade: true,
    eager: true,
  })
  items: BookingItem[];

  // Domain Methods
  confirm(ticketReference: string): void {
    if (this.status !== BookingStatus.PENDING) {
      throw new Error(`Cannot confirm booking in ${this.status} status`);
    }
    this.status = BookingStatus.CONFIRMED;
    this.ticketReference = ticketReference;
  }

  cancel(): void {
    this.status = BookingStatus.CANCELLED;
  }

  isExpired(): boolean {
    return (
      this.status === BookingStatus.PENDING && 
      new Date() > this.expiresAt
    );
  }

  getSeatIds(): string[] {
    return this.items.map((item) => item.seatId);
  }
}
```

### 3.2. BookingItem Entity

```typescript
// apps/booking-service/src/booking/domain/entities/booking-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('booking_items')
export class BookingItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ name: 'seat_id', type: 'uuid' })
  seatId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Booking, (booking) => booking.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;
}
```

### 3.3. BookingStatus Enum

```typescript
// apps/booking-service/src/booking/domain/enums/booking-status.enum.ts
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}
```

### 3.4. ProcessedEvent Entity

```typescript
// apps/booking-service/src/booking/domain/entities/processed-event.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('processed_events')
export class ProcessedEvent {
  @PrimaryColumn({ name: 'event_id', type: 'uuid' })
  eventId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType: string;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;
}
```

---

## 4. Data Integrity Rules

### 4.1. Constraints Summary

| Table | Constraint | Type | Purpose |
|-------|------------|------|---------|
| bookings | idx_booking_user_id | INDEX | Fast user lookup |
| bookings | idx_booking_event_id | INDEX | Fast event lookup |
| bookings | idx_booking_pending_expires | PARTIAL INDEX | Expiration job optimization |
| bookings | ticket_reference | UNIQUE | One ticket per booking |
| booking_items | idx_active_seat_booking | UNIQUE (conditional) | Prevent double booking |
| payments | idx_payment_booking | UNIQUE | One payment per booking |

### 4.2. Trigger Functions (Optional)

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Validate booking total matches items
CREATE OR REPLACE FUNCTION validate_booking_total()
RETURNS TRIGGER AS $$
DECLARE
    calculated_total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(price), 0) INTO calculated_total
    FROM booking_items
    WHERE booking_id = NEW.id;
    
    IF NEW.total_amount != calculated_total THEN
        RAISE EXCEPTION 'Booking total (%) does not match items total (%)', 
            NEW.total_amount, calculated_total;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';
```

---

## 5. Query Patterns

### 5.1. Common Queries

#### Get user's bookings with pagination

```sql
SELECT b.*, 
       json_agg(bi.*) as items
FROM bookings b
LEFT JOIN booking_items bi ON bi.booking_id = b.id
WHERE b.user_id = $1
  AND b.status = $2
GROUP BY b.id
ORDER BY b.created_at DESC
LIMIT $3 OFFSET $4;
```

#### Check seat availability for event

```sql
SELECT s.id, s.row, s.number, s.type,
       CASE 
         WHEN bi.id IS NOT NULL THEN 'RESERVED'
         ELSE 'AVAILABLE'
       END as status
FROM seats s
LEFT JOIN booking_items bi ON bi.seat_id = s.id
LEFT JOIN bookings b ON b.id = bi.booking_id 
  AND b.event_id = $1
  AND b.status IN ('PENDING', 'CONFIRMED')
WHERE s.venue_id = $2;
```

#### Get expired pending bookings

```sql
SELECT b.id, b.user_id, b.event_id,
       array_agg(bi.seat_id) as seat_ids
FROM bookings b
JOIN booking_items bi ON bi.booking_id = b.id
WHERE b.status = 'PENDING'
  AND b.expires_at < NOW()
GROUP BY b.id
FOR UPDATE SKIP LOCKED;  -- Allow parallel processing
```

### 5.2. Pessimistic Locking Query

```sql
-- Lock seats for reservation
SELECT bi.seat_id
FROM booking_items bi
JOIN bookings b ON b.id = bi.booking_id
WHERE bi.seat_id = ANY($1)
  AND b.event_id = $2
  AND b.status IN ('PENDING', 'CONFIRMED')
FOR UPDATE;

-- If query returns rows, seats are already taken
-- If empty, proceed with booking creation
```

---

## 6. Migration Files

### 6.1. Initial Migration

```typescript
// migrations/1700000000000-InitialSchema.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
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
        ticket_reference VARCHAR(255) UNIQUE,
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

    // Create processed_events table
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

## 7. Data Volume Estimates

| Table | Estimated Rows (Year 1) | Growth Rate |
|-------|-------------------------|-------------|
| venues | 100 | Low |
| seats | 50,000 | Low |
| events | 5,000 | Medium |
| bookings | 500,000 | High |
| booking_items | 1,000,000 | High |
| payments | 400,000 | High |

### Recommended Partitioning (Future)

```sql
-- Partition bookings by created_at (monthly)
CREATE TABLE bookings (
    -- columns...
) PARTITION BY RANGE (created_at);

CREATE TABLE bookings_2024_01 PARTITION OF bookings
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

