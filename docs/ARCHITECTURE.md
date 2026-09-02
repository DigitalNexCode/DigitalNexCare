# DIGITALNEXCARE — ARCHITECTURAL SPECIFICATION

## Overview
DigitalNexCare is a production-oriented healthcare practitioner marketplace, discovery engine, and scheduling infrastructure designed specifically for the South African healthcare ecosystem.

## Core Modules & Architecture

### 1. Database-First Search Index (Supabase + PostGIS)
- All user searches first query the Supabase PostgreSQL index.
- If insufficient fresh records exist, the modular server-side discovery service triggers external indexing, normalizes and fingerprints records, stores compressed snapshots in Supabase Storage (`practitioner-source-snapshots`), and enriches the primary database.

### 2. Practitioner Identity Separation
- **`DIGITALNEXCARE_PROVIDER`**: Verified joined practitioner with live bookable slots, HPCSA/SANC credentials, and practice management tools.
- **`EXTERNAL_PRACTITIONER`**: Discovered public directory record with locked/masked identity previews unless unlocked via patient subscription reveals.

### 3. Subscription & Entitlement Engine
- 4 Tiers: Free (2 reveals/mo), Access (5 reveals/mo @ R50), Plus (20 reveals/mo @ R100), Family (Unlimited @ R250).
- Entitlements verified strictly server-side. Unlocking an already-revealed practitioner never consumes additional quota.
- Verified DigitalNexCare provider appointments are ALWAYS free to book.

### 4. South African Integrations
- Currency: ZAR (Rands).
- Dual Payment Gateway: Paystack & Yoco.
- Medical Scheme Compatibility: Discovery, Bonitas, Momentum, Medshield, GEMS, Bestmed, Fedhealth.
- Statutory Councils: HPCSA, SANC, SAPC, AHPCSA.
