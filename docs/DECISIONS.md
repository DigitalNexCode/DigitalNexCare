# DIGITALNEXCARE — ARCHITECTURAL DECISIONS RECORD (ADR)

## ADR 001: Separation of Verified Providers and External Directory Index
- **Decision:** Separate `DIGITALNEXCARE_PROVIDER` (verified, live calendar, direct booking) from `EXTERNAL_PRACTITIONER` (discovered, unverified availability, contact gated behind subscription).
- **Reason:** Prevent patient frustration with fake availability while delivering a comprehensive national discovery catalog.

## ADR 002: Server-Side Entitlement & Freemium Model
- **Decision:** Patient reveals (2 for Free, 5 for R50 Access, 20 for R100 Plus, Unlimited for R250 Family) are enforced server-side.
- **Reason:** Protect commercial viability and practitioner contact details from unauthorized bulk scraping.

## ADR 003: Provider Claims & Data Authority Hierarchy
- **Decision:** Provider edits supersede external scrapers (`DIGITALNEXCARE_VERIFIED_PROVIDER` > `PRACTITIONER_CONFIRMED` > `ADMIN_VERIFIED` > `PRACTICE_WEBSITE`).
- **Reason:** Safeguard verified practitioner edits from being overwritten by stale external crawlers.
