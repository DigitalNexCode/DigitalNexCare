# DIGITALNEXCARE — PRODUCTION DEPLOYMENT & INFRASTRUCTURE RUNBOOK

## 1. Executive Architecture Summary

DigitalNexCare is deployed as a high-availability, fault-tolerant healthcare marketplace and scheduling platform for South Africa.

- **Primary Cloud & Database**: Supabase PostgreSQL 15+ with PostGIS Spatial Extensions (Hosted in AWS af-south-1 Cape Town / Johannesburg).
- **Frontend / Application Gateway**: React 18+ Single Page Application with server-side proxying and PWA offline support.
- **Edge Functions**: Deno runtime on Supabase Edge Network for webhook ingestion, crawler rate limiting, and cryptographic signature verifications.
- **Payment Infrastructure**: Dual active payment gateways (Paystack South Africa & Yoco) with HMAC SHA-512 signature validation and idempotent event storage.
- **Object Storage**: Supabase Storage with 3 private buckets and time-bounded signed URL policies.

---

## 2. Supabase PostgreSQL & PostGIS Setup

### 2.1 Required Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2.2 Core Schema Tables
1. `practitioners` (Canonical practitioner index with PostGIS `geometry(Point, 4326)` coordinate columns, claim status, and verification level).
2. `practices` (Multi-location medical practices, rooms, operating hours, and team associations).
3. `practice_members` (Role-based access control linking Auth users to practice roles: `PROVIDER`, `PRACTICE_MANAGER`, `RECEPTION_SCHEDULER`, `FINANCE_BILLING`).
4. `appointment_slots` (Atomic slot availability with optimistic concurrency locking).
5. `appointments` (Patient bookings, status lifecycle, tariff codes, and audit logs).
6. `patient_profiles` (POPIA-compliant patient records, emergency contacts, and medical scheme memberships).
7. `dependants` (Authorized household dependants with verified consent linkages).
8. `user_subscriptions` (Active plans: `NEXCARE_FREE`, `NEXCARE_ACCESS`, `NEXCARE_PLUS`, `NEXCARE_FAMILY`).
9. `external_practitioner_reveals` (Immutable reveal ledger tracking unique unlocks per billing cycle).
10. `payment_transactions` (Paystack & Yoco charge records with idempotency references).
11. `practitioner_claims` (HPCSA registration number verification, statutory certificates, and audit logs).
12. `practitioner_source_snapshots` (Raw compressed discovery snapshots with SHA-256 content hashes).
13. `data_conflicts` (Multi-authority field conflicts pending manual or automated resolution).
14. `system_audit_logs` (Immutable audit trail capturing user IDs, IP hashes, actions, and timestamps).

### 2.3 Production Indexes
```sql
-- Full-text and normalized name search
CREATE INDEX idx_practitioners_normalized_name ON practitioners USING gin (normalized_name gin_trgm_ops);
CREATE INDEX idx_practitioners_specialty_city ON practitioners (specialty, city);
CREATE INDEX idx_practitioners_suburb ON practitioners (suburb);
CREATE INDEX idx_practitioners_phone ON practitioners (telephone);
CREATE INDEX idx_practitioners_fingerprint ON practitioners (fingerprint);

-- Spatial PostGIS GIST Index for Sub-50ms Radius Matching
CREATE INDEX idx_practitioners_geom_gist ON practitioners USING GIST (coordinates);

-- Scheduling & Availability Indexes
CREATE INDEX idx_slots_provider_date ON appointment_slots (provider_id, date, is_available);
CREATE INDEX idx_appointments_slot_time ON appointments (slot_id, start_time);
CREATE INDEX idx_appointments_patient ON appointments (patient_id, status);

-- Subscription & Paywall Quota Indexes
CREATE INDEX idx_subscriptions_user_status ON user_subscriptions (user_id, status);
CREATE INDEX idx_reveals_user_period ON external_practitioner_reveals (user_id, period_start, period_end);

-- Payment Idempotency & Webhook Indexes
CREATE UNIQUE INDEX idx_payments_idempotency_ref ON payment_transactions (idempotency_key);
CREATE INDEX idx_payments_gateway_ref ON payment_transactions (gateway_reference);
```

### 2.4 Row Level Security (RLS) Policy Declarations
- **Practitioners (Public Read)**:
  - `SELECT`: Unrestricted for joined verified providers and masked preview fields for locked external records.
  - `INSERT/UPDATE`: Restricted to `VERIFIER_TRUST_OPS` and authenticated provider with matching `provider_id`.
- **Appointments**:
  - Patients can only `SELECT` and `INSERT` bookings where `patient_id = auth.uid()`.
  - Practice staff can only `SELECT/UPDATE` appointments where `practice_id IN (SELECT practice_id FROM practice_members WHERE user_id = auth.uid())`.
- **Subscription Reveals**:
  - `SELECT/INSERT` strictly restricted to `user_id = auth.uid()`.
  - Server-side Edge Function bypasses RLS with `service_role` key after checking monthly reveal allowance.

---

## 3. Storage Bucket Configuration

Create the following private storage buckets:

| Bucket Name | Access Level | Encryption | Allowed MIME Types | Retention / Signed URL TTL |
| :--- | :--- | :--- | :--- | :--- |
| `verification-documents` | Strictly Private | AES-256 GCM | `application/pdf`, `image/png`, `image/jpeg` | 15 Minutes (900s) |
| `patient-medical-records`| Strictly Private | AES-256 GCM | `application/pdf`, `image/png`, `image/jpeg` | 5 Minutes (300s) |
| `practitioner-source-snapshots` | Strictly Private | AES-256 GCM | `application/octet-stream`, `application/json` | 10 Minutes (600s) |

---

## 4. Environment Variables Specification

Ensure the following secrets are configured in `.env` / production container environment:

```env
# Platform & Server Configuration
NODE_ENV=production
PORT=3000
VITE_PLATFORM_NAME=DigitalNexCare
VITE_PLATFORM_TAGLINE="Smarter Care. Stronger Connections."

# Supabase Production Credentials
SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[YOUR_PUBLIC_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_PRIVATE_SERVICE_ROLE_KEY]

# Payment Gateways (South Africa)
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_WEBHOOK_SECRET=[YOUR_PAYSTACK_HMAC_SECRET]

YOCO_SECRET_KEY=sk_live_...
YOCO_PUBLIC_KEY=pk_live_...
YOCO_WEBHOOK_SECRET=[YOUR_YOCO_WEBHOOK_SECRET]

# Communications & SMS Gateway
SMS_PORTAL_CLIENT_ID=[YOUR_SMS_PORTAL_CLIENT_ID]
SMS_PORTAL_API_KEY=[YOUR_SMS_PORTAL_API_KEY]
POSTMARK_SERVER_TOKEN=[YOUR_POSTMARK_TOKEN]

# Monitoring & Error Tracking
SENTRY_DSN=https://...@sentry.io/...
```

---

## 5. Payment Gateway Webhook Dispatch Configuration

### 5.1 Paystack Webhook Setup
1. Log in to the Paystack Dashboard $\to$ Settings $\to$ Webhooks.
2. Set Webhook URL to `https://api.digitalnexcare.co.za/api/webhooks/paystack`.
3. Copy the Secret Key and configure `PAYSTACK_WEBHOOK_SECRET`.
4. Ensure the server validates the `x-paystack-signature` header using `crypto.createHmac('sha512', secret).update(rawBody).digest('hex')`.

### 5.2 Yoco Webhook Setup
1. Log in to Yoco Business Portal $\to$ Developer $\to$ Webhooks.
2. Set Webhook URL to `https://api.digitalnexcare.co.za/api/webhooks/yoco`.
3. Copy Webhook Secret and enforce HMAC signature verification.

---

## 6. Background Workers & Ingestion Queue

Configure a persistent Redis or Supabase PgBouncer-backed worker service to execute:
1. **Directory Ingestion Worker**: Rate-limited scheduled worker (`cron: '0 2 * * *'`) running national 9-province directory reconciliation.
2. **Snapshot Deduplication & Compression**: Sanitizes external crawl payloads, generates SHA-256 hashes, compresses via Zstandard / GZIP, and stores in `practitioner-source-snapshots`.
3. **Appointment Reminder Dispatcher**: Runs every 15 minutes to trigger SMS / Email reminders for appointments starting within 24 hours.

---

## 7. Build, Verification & Production Start

```bash
# 1. Type Check & Lint
npm run lint

# 2. Production Build
npm run build

# 3. Launch Standalone Production Server
npm start
```

---

## 8. Rollback & Disaster Recovery

1. **Database Point-In-Time Recovery (PITR)**: Supabase PITR is enabled with a 30-day retention window.
2. **Container Revert**: If a production build issue occurs, rollback container image in Cloud Run / Kubernetes to the previous immutable SHA tag.
3. **Payment State Reconciliation**: In case of transient webhook delivery failures, run the Admin Reconciliation Desk (`/admin/subscriptions`) to replay unprocessed Paystack & Yoco charge references.
