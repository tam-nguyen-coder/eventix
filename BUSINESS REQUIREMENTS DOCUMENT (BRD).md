# Business Requirements Document (BRD)

> **Project Name:** Eventix (Scalable Event Booking System)  
> **Version:** 1.0.0  
> **Status:** Draft

---

## 1. Executive Summary

The goal is to build a **high-performance backend system** for booking event tickets. The system must handle high concurrency (many users trying to book the same seat) and ensure data consistency across distributed services using an **event-driven approach**.

---

## 2. User Actors

| Actor | Description |
|-------|-------------|
| **Guest** | Unauthenticated user, can view events but cannot book. |
| **Customer** | Authenticated user (via Auth0), can book tickets, view history, and cancel bookings. |
| **Admin** | System administrator, manages events, venues, and configurations. |
| **System (Worker)** | Background processes handling reservation expirations and payment confirmations. |

---

## 3. Core Business Modules

### 3.1. Authentication & Authorization (Auth0 Integration)

| ID | Requirement |
|----|-------------|
| **FR-01** | Users must sign up/login via Auth0 to perform booking actions. |
| **FR-02** | System must identify users via JWT tokens containing `sub` (Auth0 User ID) and `email`. |
| **FR-03** | **Role-Based Access Control (RBAC):** Only Admins can create events; Customers can only read events and create bookings. |

### 3.2. Catalog Management (Events & Venues)

| ID | Requirement |
|----|-------------|
| **FR-04** | Admin creates **Venues** with a specific Seat Layout (e.g., Matrix A1-A10, B1-B10). |
| **FR-05** | Admin creates **Events** scheduled at a specific Venue and time. |
| **FR-06** | Each seat has a specific price tier (`VIP`, `Regular`, `Economy`). |
| **FR-07** | Users can search/filter events by date, category, or status. |

### 3.3. Booking Lifecycle (The Core Logic)

> ⚠️ **This is the most critical flow involving distributed transactions.**

#### FR-08: Seat Locking (Reservation)

- When a user selects seats, the system must attempt to **"Reserve"** them.
- **Constraint:** A seat cannot be reserved by two users simultaneously *(Concurrency Control)*.
- **Outcome:** If successful, status becomes `RESERVED` for **10 minutes**.

#### FR-09: Reservation Expiration

- If the payment is not received within **10 minutes**, the system must automatically release the seats.
- Status changes from `RESERVED` → `AVAILABLE`.

#### FR-10: Booking Confirmation

- Upon successful payment, the booking status changes to `CONFIRMED`.
- A ticket (**QR Code reference**) is generated.

### 3.4. Payment Simulation

| ID | Requirement |
|----|-------------|
| **FR-11** | The system simulates a payment gateway integration. |
| **FR-12** | Payment can either `SUCCESS` or `FAIL`. |
| **FR-13** | **Idempotency:** Duplicate payment callbacks for the same Order ID must be handled gracefully. |

---

## 4. Business Rules & Constraints

| Rule | Description |
|------|-------------|
| 🚫 **Double Booking** | **STRICTLY PROHIBITED.** The database must enforce uniqueness on `(EventID, SeatID)` for active bookings. |
| ⏱️ **Payment Window** | The 10-minute timer starts immediately after the reservation is created. |
| 💵 **Currency** | Base currency is **USD**. |
