# DIGITALNEXCARE — TESTING SPECIFICATION

## Test Coverage Matrix

### 1. Entitlement & Paywall Logic
- Free user gets exactly 2 external reveals per billing cycle.
- Re-revealing the same practitioner in the same cycle consumes 0 credits.
- Attempting to reveal when quota is 0 triggers `EXTERNAL_PRACTITIONER_LIMIT_REACHED` modal.
- Verified Provider appointments bypass subscription checks and book freely.

### 2. Provider Claim & Verification Flow
- Search existing profiles -> "IS THIS YOU OR YOUR PRACTICE?" -> YES triggers claim request with `UNDER_REVIEW` status.
- HPCSA number validation and document upload flow.

### 4. Practice Management & Provider Operations (Chunk 8)
- Real metrics calculation (Views, Bookings, Conversion %, Satisfaction Score).
- Multi-location and multi-room management with operating hours.
- Practice team Role-Based Access Control (PROVIDER, PRACTICE_MANAGER, RECEPTION_SCHEDULER, FINANCE_BILLING).
- Service catalog with durations, ZAR prices, medical tariff codes (e.g., 0190), and ICD-10 categories.
- Verified Booking Review enforcement with practitioner responses and trust appeals.
- National Ingestion & 9-Province coverage metrics with Zstandard / GZIP compression ratio verification (> 50% savings).
- Duplicate candidate detection and merging engine with confidence classification.
- Data authority hierarchy and conflict resolution engine.
- Dynamic subscription tier admin & MRR calculation.
- Trust & Safety Operations dispute management across 5 case types.
- Platform runtime feature flags with live toggles and audit trail.
- Immutable system audit logging capturing timestamps, actor IDs, actions, and resources.
