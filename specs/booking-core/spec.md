# Specification: Core Booking System

> **Module:** booking-core  
> **Status:** Draft  
> **Version:** 1.0.0  
> **Last Updated:** 2024

---

## 1. Overview

### 1.1. Purpose

Build an event ticketing system with the capability to:
- Handle **thousands of concurrent requests** for the same seat
- Ensure **double booking never occurs**
- Automatically **release seats** on payment timeout

### 1.2. Scope

| In Scope | Out of Scope |
|----------|--------------|
| Seat reservation logic | Actual payment processing |
| Booking lifecycle management | Email notifications |
| Event-driven communication | Real-time seat availability (WebSocket) |
| Concurrency control | Waitlist management |

---

## 2. User Stories

### 2.1. Customer Stories

#### US-01: Reserve Seats
> **As a** Customer  
> **I want to** select and reserve seats for an event  
> **So that** I can secure my spots before paying

**Acceptance Criteria:**
- [ ] User can select multiple seats (max 10 per booking)
- [ ] Selected seats are locked for 10 minutes
- [ ] User receives booking confirmation with expiration time
- [ ] Locked seats are not available to other users

#### US-02: Complete Payment
> **As a** Customer  
> **I want to** complete payment for my reservation  
> **So that** my booking is confirmed

**Acceptance Criteria:**
- [ ] Payment must be completed within 10-minute window
- [ ] Successful payment changes status to CONFIRMED
- [ ] User receives ticket reference (QR code ID)
- [ ] Seats are permanently assigned to user

#### US-03: Cancel Booking
> **As a** Customer  
> **I want to** cancel my booking  
> **So that** I can get a refund (if applicable)

**Acceptance Criteria:**
- [ ] PENDING bookings can be cancelled immediately
- [ ] CONFIRMED bookings follow cancellation policy
- [ ] Released seats become available immediately
- [ ] Refund process is initiated (if applicable)

### 2.2. System Stories

#### US-04: Auto-Release Expired Reservations
> **As the** System  
> **I want to** automatically release expired reservations  
> **So that** seats don't remain locked indefinitely

**Acceptance Criteria:**
- [ ] Cron job runs every minute
- [ ] Expired PENDING bookings are marked CANCELLED
- [ ] Associated seats are released
- [ ] Event `booking.expired` is published

---

## 3. Functional Requirements

### 3.1. Booking Creation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | System SHALL validate user authentication via JWT | Must |
| FR-02 | System SHALL check seat availability in real-time | Must |
| FR-03 | System SHALL lock seats using pessimistic DB locking | Must |
| FR-04 | System SHALL calculate total amount based on seat prices | Must |
| FR-05 | System SHALL set expiration time = now + 10 minutes | Must |
| FR-06 | System SHALL publish `booking.created` event | Must |
| FR-07 | System SHALL limit max 10 seats per booking | Should |

### 3.2. Payment Processing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-08 | System SHALL consume `payment.success` event | Must |
| FR-09 | System SHALL update booking status to CONFIRMED | Must |
| FR-10 | System SHALL generate ticket reference | Must |
| FR-11 | System SHALL handle duplicate payment callbacks idempotently | Must |
| FR-12 | System SHALL consume `payment.failed` event | Must |
| FR-13 | System SHALL release seats on payment failure | Must |

### 3.3. Expiration Handling

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-14 | System SHALL run expiration check every 60 seconds | Must |
| FR-15 | System SHALL cancel bookings past expiration time | Must |
| FR-16 | System SHALL release associated seats | Must |
| FR-17 | System SHALL publish `booking.expired` event | Should |

---

## 4. Non-Functional Requirements

### 4.1. Performance

| Metric | Target |
|--------|--------|
| Reservation response time | < 500ms (p95) |
| Concurrent reservations | 1000 RPS |
| Database connections | Max 20 per service |

### 4.2. Reliability

| Metric | Target |
|--------|--------|
| Availability | 99.9% |
| Data durability | No data loss |
| Message delivery | At-least-once |

### 4.3. Consistency

| Requirement | Description |
|-------------|-------------|
| Seat uniqueness | Database-level unique constraint |
| Event ordering | Partition by bookingId |
| Idempotency | Check eventId before processing |

---

## 5. Business Rules

### BR-01: Double Booking Prevention
```
IF seat is already reserved for event
THEN reject new reservation with SEAT_ALREADY_RESERVED error
```

### BR-02: Payment Window
```
Payment window = 10 minutes from reservation creation
IF current_time > booking.expires_at AND status = PENDING
THEN mark as CANCELLED and release seats
```

### BR-03: Booking Limits
```
Max seats per booking = 10
Max active PENDING bookings per user = 3
```

### BR-04: Cancellation Policy
```
IF status = PENDING → Cancel immediately, no refund needed
IF status = CONFIRMED AND event_date - now > 24h → Full refund
IF status = CONFIRMED AND event_date - now <= 24h → No refund
```

---

## 6. Edge Cases

### 6.1. Race Conditions

**Scenario:** Two users try to book the same seat simultaneously.

**Solution:**
- Use `SELECT ... FOR UPDATE` (pessimistic locking)
- First transaction to acquire lock wins
- Second transaction waits, then fails if seat taken

**Questions to clarify:**
- [ ] Should we implement retry logic for failed reservations?
- [ ] What error message should user see?

### 6.2. Payment Timeout During Processing

**Scenario:** Payment is being processed when expiration job runs.

**Solution:**
- Add `PROCESSING` intermediate status
- Expiration job skips `PROCESSING` bookings
- Add `processing_started_at` with its own timeout (5 min)

**Questions to clarify:**
- [ ] How long should we wait for payment response?
- [ ] Should we implement payment status polling?

### 6.3. Partial Seat Availability

**Scenario:** User selects 5 seats, but only 3 are available.

**Solution Options:**
1. **Reject entire booking** (current approach)
2. **Partial booking** (requires user confirmation)

**Questions to clarify:**
- [ ] Should we support partial booking?
- [ ] How to communicate which seats are unavailable?

### 6.4. Event Cancellation

**Scenario:** Admin cancels an event with existing bookings.

**Solution:**
- Mark all CONFIRMED bookings for refund
- Publish `event.cancelled` event
- Payment service initiates batch refund

**Questions to clarify:**
- [ ] How to notify users?
- [ ] What's the refund timeline?

---

## 7. API Endpoints

### 7.1. Create Booking

```http
POST /api/v1/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventId": "uuid",
  "seatIds": ["uuid1", "uuid2"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "bookingId": "uuid",
    "status": "PENDING",
    "totalAmount": 150.00,
    "currency": "USD",
    "expiresAt": "2024-01-01T10:10:00Z",
    "seats": [
      { "seatId": "uuid1", "row": "A", "number": 1, "price": 75.00 },
      { "seatId": "uuid2", "row": "A", "number": 2, "price": 75.00 }
    ]
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "error": {
    "code": "SEAT_ALREADY_RESERVED",
    "message": "One or more seats are already reserved",
    "details": {
      "unavailableSeatIds": ["uuid1"]
    }
  }
}
```

### 7.2. Get Booking

```http
GET /api/v1/bookings/{bookingId}
Authorization: Bearer {token}
```

### 7.3. Get My Bookings

```http
GET /api/v1/bookings/my?status=CONFIRMED&page=1&limit=10
Authorization: Bearer {token}
```

### 7.4. Cancel Booking

```http
DELETE /api/v1/bookings/{bookingId}
Authorization: Bearer {token}
```

---

## 8. Event Schemas

### 8.1. booking.created

```typescript
interface BookingCreatedEvent {
  eventId: string;
  eventType: 'booking.created';
  timestamp: string;
  version: '1.0';
  correlationId: string;
  payload: {
    bookingId: string;
    userId: string;
    eventId: string;
    seatIds: string[];
    totalAmount: number;
    currency: string;
    expiresAt: string;
  };
}
```

### 8.2. booking.confirmed

```typescript
interface BookingConfirmedEvent {
  eventId: string;
  eventType: 'booking.confirmed';
  timestamp: string;
  version: '1.0';
  correlationId: string;
  payload: {
    bookingId: string;
    userId: string;
    ticketReference: string;
    confirmedAt: string;
  };
}
```

### 8.3. booking.cancelled

```typescript
interface BookingCancelledEvent {
  eventId: string;
  eventType: 'booking.cancelled';
  timestamp: string;
  version: '1.0';
  correlationId: string;
  payload: {
    bookingId: string;
    userId: string;
    reason: 'USER_CANCELLED' | 'PAYMENT_FAILED' | 'EXPIRED';
    releasedSeatIds: string[];
  };
}
```

---

## 9. Dependencies

### 9.1. Internal Dependencies

| Service | Dependency Type | Description |
|---------|-----------------|-------------|
| Catalog Service | Sync (REST) | Validate eventId, get seat info & prices |
| Payment Service | Async (Kafka) | Process payment, receive results |

### 9.2. External Dependencies

| System | Dependency Type | Description |
|--------|-----------------|-------------|
| Auth0 | Sync (JWT) | User authentication |
| PostgreSQL | Sync | Data persistence |
| Redpanda | Async | Event messaging |

---

## 10. Checklist

### Specification Quality
- [x] User stories with acceptance criteria
- [x] Functional requirements with priorities
- [x] Non-functional requirements with metrics
- [x] Business rules clearly defined
- [x] Edge cases identified
- [ ] All edge case questions answered
- [x] API contracts defined
- [x] Event schemas defined

### Ready for Planning
- [ ] All stakeholder questions resolved
- [ ] Dependencies confirmed available
- [ ] Performance targets validated
- [x] Security requirements reviewed

