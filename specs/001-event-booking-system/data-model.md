# Data Model: Event Booking System

**Feature Branch**: `001-event-booking-system`  
**Date**: 2025-12-11  
**Status**: Complete

## Overview

The Event Booking System uses a database-per-service pattern with three PostgreSQL databases:
- `eventix_catalog_db` - Venues, Events, Seats, Pricing
- `eventix_booking_db` - Bookings, Booking Items
- `eventix_payment_db` - Payments

---

## Catalog Service Entities

### Venue

Represents a physical location where events occur.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Venue name |
| `location` | VARCHAR(500) | NULLABLE | Address/location description |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_venue_name` on `name` (for search)

**Relationships:**
- Has many `Seat`
- Has many `Event`

---

### Seat

Represents an individual seat at a venue.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique identifier |
| `venue_id` | UUID | FK → venue(id), NOT NULL | Reference to venue |
| `row` | VARCHAR(10) | NOT NULL | Row identifier (e.g., "A", "B", "AA") |
| `number` | INT | NOT NULL | Seat number within row |
| `seat_type` | ENUM | NOT NULL | VIP, REGULAR, ECONOMY |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_seat_venue` on `venue_id`
- `idx_seat_row_number` on `(venue_id, row, number)` UNIQUE

**Constraints:**
- UNIQUE on `(venue_id, row, number)` - No duplicate seats in a venue

**Relationships:**
- Belongs to one `Venue`
- Referenced by `EventSeatPrice` (via seat_type)

**Validation Rules:**
- `row` must be non-empty, max 10 characters
- `number` must be positive integer
- `seat_type` must be one of: VIP, REGULAR, ECONOMY

---

### Event

Represents a scheduled occurrence at a venue.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique identifier |
| `venue_id` | UUID | FK → venue(id), NOT NULL | Reference to venue |
| `name` | VARCHAR(255) | NOT NULL | Event name |
| `description` | TEXT | NULLABLE | Event description |
| `category` | VARCHAR(100) | NULLABLE | Event category (concert, sports, etc.) |
| `start_time` | TIMESTAMP | NOT NULL | Event start time |
| `end_time` | TIMESTAMP | NOT NULL | Event end time |
| `status` | ENUM | NOT NULL, DEFAULT 'DRAFT' | DRAFT, PUBLISHED, CANCELLED, COMPLETED |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_event_venue` on `venue_id`
- `idx_event_start_time` on `start_time` (for date filtering)
- `idx_event_status` on `status`
- `idx_event_category` on `category`

**Relationships:**
- Belongs to one `Venue`
- Has many `EventSeatPrice`

**Validation Rules:**
- `start_time` must be in the future (on creation)
- `end_time` must be after `start_time`
- `name` must be non-empty, max 255 characters

**State Transitions:**
```
DRAFT → PUBLISHED → COMPLETED
          ↓
       CANCELLED
```

---

### EventSeatPrice

Represents pricing for seat types at a specific event.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `event_id` | UUID | FK → event(id), NOT NULL | Reference to event |
| `seat_type` | ENUM | NOT NULL | VIP, REGULAR, ECONOMY |
| `price` | DECIMAL(10,2) | NOT NULL | Price in USD |

**Primary Key:** `(event_id, seat_type)`

**Relationships:**
- Belongs to one `Event`

**Validation Rules:**
- `price` must be >= 0
- `price` precision: 2 decimal places (cents)

---

## Booking Service Entities

### Booking

Represents a customer's reservation or confirmed ticket purchase.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique identifier |
| `user_id` | VARCHAR(255) | NOT NULL | Auth0 User ID (sub claim) |
| `event_id` | UUID | NOT NULL | Reference to event (external) |
| `status` | ENUM | NOT NULL, DEFAULT 'RESERVED' | RESERVED, CONFIRMED, CANCELLED |
| `total_amount` | DECIMAL(10,2) | NOT NULL | Total booking amount in USD |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `expires_at` | TIMESTAMP | NOT NULL | Reservation expiration (created_at + 10 min) |
| `confirmed_at` | TIMESTAMP | NULLABLE | Confirmation timestamp |
| `cancelled_at` | TIMESTAMP | NULLABLE | Cancellation timestamp |
| `cancellation_reason` | VARCHAR(255) | NULLABLE | Reason for cancellation |

**Indexes:**
- `idx_booking_user` on `user_id` (for booking history)
- `idx_booking_event` on `event_id`
- `idx_booking_status` on `status`
- `idx_booking_expires` on `(status, expires_at)` (for expiration job)

**Relationships:**
- Has many `BookingItem`
- Has one `Payment` (optional)

**Validation Rules:**
- `total_amount` must be >= 0
- `expires_at` = `created_at` + 10 minutes (on creation)

**State Transitions:**
```
RESERVED → CONFIRMED (on payment success)
    ↓
CANCELLED (on payment failure, timeout, or user cancellation)
```

---

### BookingItem

Represents an individual seat within a booking.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique identifier |
| `booking_id` | UUID | FK → booking(id), NOT NULL | Reference to booking |
| `seat_id` | UUID | NOT NULL | Reference to seat (external) |
| `event_id` | UUID | NOT NULL | Reference to event (for compound unique) |
| `seat_type` | ENUM | NOT NULL | VIP, REGULAR, ECONOMY |
| `price` | DECIMAL(10,2) | NOT NULL | Price at time of booking |

**Indexes:**
- `idx_booking_item_booking` on `booking_id`
- `idx_booking_item_seat_event` on `(event_id, seat_id)` (for availability check)

**Constraints:**
- UNIQUE on `(event_id, seat_id)` WHERE booking.status IN ('RESERVED', 'CONFIRMED')
  - Enforced via partial unique index to prevent double booking

**Relationships:**
- Belongs to one `Booking`

**Validation Rules:**
- `price` must be >= 0
- `seat_id` must exist in Catalog Service (validated via API call)

---

## Payment Service Entities

### Payment

Represents a payment transaction for a booking.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Unique identifier |
| `booking_id` | UUID | NOT NULL | Reference to booking (external) |
| `transaction_id` | VARCHAR(255) | UNIQUE, NOT NULL | External payment transaction ID |
| `amount` | DECIMAL(10,2) | NOT NULL | Payment amount in USD |
| `status` | ENUM | NOT NULL | PENDING, SUCCESS, FAILED |
| `provider` | VARCHAR(50) | NOT NULL, DEFAULT 'MOCK' | Payment provider name |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `processed_at` | TIMESTAMP | NULLABLE | Processing completion timestamp |
| `error_message` | VARCHAR(500) | NULLABLE | Error message if failed |

**Indexes:**
- `idx_payment_booking` on `booking_id`
- `idx_payment_transaction` on `transaction_id` UNIQUE
- `idx_payment_status` on `status`

**Constraints:**
- UNIQUE on `transaction_id` (idempotency)

**Relationships:**
- References one `Booking` (external)

**Validation Rules:**
- `amount` must be > 0
- `transaction_id` must be non-empty

**State Transitions:**
```
PENDING → SUCCESS
    ↓
  FAILED
```

---

## Cross-Service Data References

Since each service owns its database, cross-service references are by ID only:

| Service | References | Validation |
|---------|------------|------------|
| Booking Service | `event_id`, `seat_id` from Catalog | Validated via sync API call at booking time |
| Payment Service | `booking_id` from Booking | Received via event payload, trusted |

---

## Enum Definitions

### SeatType
```typescript
enum SeatType {
  VIP = 'VIP',
  REGULAR = 'REGULAR',
  ECONOMY = 'ECONOMY',
}
```

### EventStatus
```typescript
enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}
```

### BookingStatus
```typescript
enum BookingStatus {
  RESERVED = 'RESERVED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}
```

### PaymentStatus
```typescript
enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}
```

---

## Database Schema (SQL)

### Catalog Database

```sql
-- Enums
CREATE TYPE seat_type AS ENUM ('VIP', 'REGULAR', 'ECONOMY');
CREATE TYPE event_status AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- Venue Table
CREATE TABLE venue (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    location    VARCHAR(500),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_venue_name ON venue(name);

-- Seat Table
CREATE TABLE seat (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id    UUID NOT NULL REFERENCES venue(id) ON DELETE CASCADE,
    row         VARCHAR(10) NOT NULL,
    number      INT NOT NULL CHECK (number > 0),
    seat_type   seat_type NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (venue_id, row, number)
);

CREATE INDEX idx_seat_venue ON seat(venue_id);

-- Event Table
CREATE TABLE event (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id    UUID NOT NULL REFERENCES venue(id),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    category    VARCHAR(100),
    start_time  TIMESTAMP NOT NULL,
    end_time    TIMESTAMP NOT NULL CHECK (end_time > start_time),
    status      event_status NOT NULL DEFAULT 'DRAFT',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_venue ON event(venue_id);
CREATE INDEX idx_event_start_time ON event(start_time);
CREATE INDEX idx_event_status ON event(status);
CREATE INDEX idx_event_category ON event(category);

-- Event Seat Pricing Table
CREATE TABLE event_seat_price (
    event_id    UUID NOT NULL REFERENCES event(id) ON DELETE CASCADE,
    seat_type   seat_type NOT NULL,
    price       DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    PRIMARY KEY (event_id, seat_type)
);
```

### Booking Database

```sql
-- Enums
CREATE TYPE booking_status AS ENUM ('RESERVED', 'CONFIRMED', 'CANCELLED');
CREATE TYPE seat_type AS ENUM ('VIP', 'REGULAR', 'ECONOMY');

-- Booking Table
CREATE TABLE booking (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             VARCHAR(255) NOT NULL,
    event_id            UUID NOT NULL,
    status              booking_status NOT NULL DEFAULT 'RESERVED',
    total_amount        DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMP NOT NULL,
    confirmed_at        TIMESTAMP,
    cancelled_at        TIMESTAMP,
    cancellation_reason VARCHAR(255)
);

CREATE INDEX idx_booking_user ON booking(user_id);
CREATE INDEX idx_booking_event ON booking(event_id);
CREATE INDEX idx_booking_status ON booking(status);
CREATE INDEX idx_booking_expires ON booking(status, expires_at) WHERE status = 'RESERVED';

-- Booking Item Table
CREATE TABLE booking_item (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id  UUID NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
    seat_id     UUID NOT NULL,
    event_id    UUID NOT NULL,
    seat_type   seat_type NOT NULL,
    price       DECIMAL(10, 2) NOT NULL CHECK (price >= 0)
);

CREATE INDEX idx_booking_item_booking ON booking_item(booking_id);
CREATE INDEX idx_booking_item_seat_event ON booking_item(event_id, seat_id);

-- Partial unique index to prevent double booking (only for active bookings)
CREATE UNIQUE INDEX idx_unique_seat_booking 
ON booking_item(event_id, seat_id) 
WHERE EXISTS (
    SELECT 1 FROM booking b 
    WHERE b.id = booking_item.booking_id 
    AND b.status IN ('RESERVED', 'CONFIRMED')
);
```

### Payment Database

```sql
-- Enums
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- Payment Table
CREATE TABLE payment (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL,
    transaction_id  VARCHAR(255) NOT NULL UNIQUE,
    amount          DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    status          payment_status NOT NULL DEFAULT 'PENDING',
    provider        VARCHAR(50) NOT NULL DEFAULT 'MOCK',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMP,
    error_message   VARCHAR(500)
);

CREATE INDEX idx_payment_booking ON payment(booking_id);
CREATE INDEX idx_payment_status ON payment(status);
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CATALOG DATABASE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐         ┌──────────┐         ┌─────────────────┐        │
│   │  Venue   │ 1────M  │   Seat   │         │ EventSeatPrice  │        │
│   │──────────│         │──────────│         │─────────────────│        │
│   │ id       │         │ id       │         │ event_id (PK)   │        │
│   │ name     │         │ venue_id │         │ seat_type (PK)  │        │
│   │ location │         │ row      │         │ price           │        │
│   └────┬─────┘         │ number   │         └────────┬────────┘        │
│        │               │ seat_type│                  │                  │
│        │ 1             └──────────┘                  │ M                │
│        │                                             │                  │
│        │ M         ┌──────────┐                      │                  │
│        └───────────│  Event   │──────────────────────┘                  │
│                    │──────────│ 1                                       │
│                    │ id       │                                         │
│                    │ venue_id │                                         │
│                    │ name     │                                         │
│                    │ status   │                                         │
│                    └──────────┘                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        BOOKING DATABASE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐         ┌───────────────┐                           │
│   │   Booking    │ 1────M  │ BookingItem   │                           │
│   │──────────────│         │───────────────│                           │
│   │ id           │         │ id            │                           │
│   │ user_id      │         │ booking_id    │                           │
│   │ event_id ◇───┼─────────│ seat_id   ◇───┼─── (ref: Catalog.seat)   │
│   │ status       │         │ event_id  ◇───┼─── (ref: Catalog.event)  │
│   │ total_amount │         │ seat_type     │                           │
│   │ expires_at   │         │ price         │                           │
│   └──────────────┘         └───────────────┘                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        PAYMENT DATABASE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌────────────────┐                                                    │
│   │    Payment     │                                                    │
│   │────────────────│                                                    │
│   │ id             │                                                    │
│   │ booking_id ◇───┼─── (ref: Booking.booking)                         │
│   │ transaction_id │                                                    │
│   │ amount         │                                                    │
│   │ status         │                                                    │
│   │ provider       │                                                    │
│   └────────────────┘                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Legend: ◇ = External reference (by ID only, not FK)
        1────M = One-to-Many relationship
```
