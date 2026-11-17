# Business Pain Point to REST Endpoint Traceability Matrix

This matrix establishes formal bidirectional traceability connecting GoodHand business pain points to architectural mechanisms, REST endpoints, data integrity invariants, and verification test cases.

---

## Traceability Matrix

| Pain Point ID | Business Pain Point | Business Objective | Technical Mechanism | REST Endpoint(s) | HTTP Method | Target Response | Data Invariant / Guarantee | Verification Test |
|---|---|---|---|---|:---:|:---:|---|---|
| **PP-01** | **Manual Data Re-Entry Delays**<br>Orders taken on the storefront were retyped manually into dispatching sheets, leading to lost jobs and 24h+ fulfillment delays. | **OBJ-01**<br>100% Automated Job Provisioning | Transactional Outbox Pattern atomically enqueuing `OP-01` upon checkout completion. | `/api/v1/installations` | `POST` | `201 Created`<br>`200 OK` (replay) | Exactly-once business processing via UUID `Idempotency-Key` and SHA-256 payload hash caching. | `TC-01`<br>`TC-03`<br>`TC-07` |
| **PP-02** | **Technician Double-Booking**<br>Dispatchers accidentally booked overlapping slots for the same technician, causing missed customer appointments. | **OBJ-02**<br>Zero Scheduling Conflicts | PostgreSQL `tstzrange` with GiST exclusion constraint (`&&`). | `/api/v1/jobs/{jobNumber}/assign` | `POST` | `200 OK`<br>`409 Conflict` | Database-level lock preventing overlapping `active` technician appointment intervals. | `TC-11` |
| **PP-03** | **Unconfirmed Hardware Deployment**<br>Technicians arrived on-site missing equipment or with wrong hardware units. | **OBJ-03**<br>Hardware Loading Gate | Strict pre-departure gate: job cannot transition to `In Progress` until 100% of SKUs are confirmed loaded. | `/api/v1/jobs/{jobNumber}/loading`<br>`/api/v1/jobs/{jobNumber}/start` | `POST`<br>`POST` | `200 OK`<br>`409 Conflict` | Status transition locked: `Scheduled` $\to$ `In Progress` requires $\sum \text{loaded} = \sum \text{ordered}$. | `TC-34` |
| **PP-04** | **Inventory Desynchronization**<br>Hardware promised to online orders was sold to walk-in retail customers, causing inventory shortages. | **OBJ-03**<br>Mathematical Stock Ledger | Continuous three-state ledger: $0 \le \text{reserved} \le \text{on\_hand} \implies \text{available} \ge 0$. | `/api/v1/stock/availability`<br>`/api/v1/webhooks/inventory-adjustments` | `GET`<br>`POST` | `200 OK` | Atomic movement execution by unique `transactionId` preventing double deductions. | `TC-09`<br>`TC-30` |
| **PP-05** | **Lost Warranty Records**<br>Paper-based warranty cards were lost, leaving customers without proof of warranty. | **OBJ-03**<br>Automated Warranty Activation | Technicians submit validated serial numbers upon completion; System A activates exact 12-month digital warranty. | `/api/v1/jobs/{jobNumber}/complete`<br>`/api/v1/webhooks/completions` | `POST`<br>`POST` | `200 OK` | Each installed unit mapped to hardware serial number and expiration date = `completedAt + 12mo`. | `TC-02`<br>`TC-04`<br>`TC-14` |
| **PP-06** | **Technician Privacy & Review Contamination**<br>Customer feedback on delivery/store was shown to technicians, or customer contact details leaked to field personnel. | **OBJ-04**<br>Privacy-Preserving Feedback Boundary | CL-15 privacy separation: Store keeps store ratings; only technician workmanship and first name are forwarded. | `/api/v1/installations/{jobNumber}/feedback`<br>`/api/feedback` | `POST`<br>`PATCH` | `201 Created`<br>`200 OK`<br>`422 Unprocessable` | System B rejects any payload containing store tags or customer contact details. | `TC-19`<br>`TC-20`<br>`TC-26`<br>`TC-32` |
| **PP-07** | **Network Outages & Inter-System Downtime**<br>Temporary connection drops between store and dispatch resulted in lost transactions. | **OBJ-01** / **Resilience** | Outbox engine with bounded 3-attempt exponential backoff and circuit breaker. | `/api/internal/drain`<br>`/api/v1/installations` | `POST` | `200 OK` | At-least-once guaranteed delivery with automatic circuit tripping after 5 consecutive failures. | `TC-06`<br>`TC-13` |
| **PP-08** | **Disputed Installation Delivery**<br>Customers disputed whether physical equipment was actually mounted and tested on-site. | **Operational Assurance** | Proof of Delivery (PoD) photo upload to Supabase Storage with strict 5 MB file cap. | `/api/v1/jobs/{jobNumber}/proof-of-delivery` | `POST` | `201 Created`<br>`422 Unprocessable` | Only valid image formats under 5 MB accepted and archived with timestamp and technician ID. | PoD upload test |

---

## Lifecycle Phase Mapping

```mermaid
flowchart LR
    A["Order Placed in Store (PP-01)"] -->|"OP-01 (Outbox)"| B["Job Created in FSM"]
    B -->|"GiST Lock (PP-02)"| C["Technician Assigned"]
    C -->|"Checklist Gate (PP-03)"| D["Hardware Loading Confirmed"]
    D -->|"Start Job (OP-06)"| E["Installation In Progress"]
    E -->|"Upload Photo (PP-08)"| F["Proof of Delivery Archived"]
    F -->|"Complete Job (OP-07)"| G["Warranty Activated (PP-05)"]
    G -->|"OP-08 Ledger Update"| H["Stock Reconciled (PP-04)"]
    H -->|"CL-15 Boundary (PP-06)"| I["Feedback Submitted"]
```
