# DigitalNexCare

DigitalNexCare is a South African healthcare platform that connects patients with healthcare practices and providers. It includes a responsive web application and a separate Expo / React Native mobile app.

- **Website:** [care.digitalnexcode.co.za](https://care.digitalnexcode.co.za)
- **Repository:** [github.com/DigitalNexCode/DigitalNexCare](https://github.com/DigitalNexCode/DigitalNexCare)

## Platform areas

- **Patients:** find care, view provider information, manage an account and dependants, book appointments, and manage subscriptions.
- **Practices and providers:** onboard or claim a listing, manage practice information and services, and use provider dashboard tools.
- **Resellers:** share referral links and codes, follow attributed signups, and view programme ranks, commissions, and payout records.
- **Administrators:** review and manage platform operations through role-restricted dashboards.

The mobile app provides native screens for common patient, provider, and reseller tasks. Some flows open the website in an in-app browser. Administrative and super-administrative dashboards remain on the website.

## Technology

- React, TypeScript, Vite, and React Router for the website
- Expo, React Native, and Expo Router for Android and iOS
- Supabase for authentication, PostgreSQL, Row Level Security, Realtime, and Edge Functions
- Paystack and Yoco integrations for supported payments

## Run the website locally

Requirements: Node.js 20 or later and a package manager. The repository includes `bun.lock`; Bun is recommended for a reproducible install.

```bash
bun install
```

Create a local environment file and set the public web client configuration:

```powershell
Copy-Item .env.example .env
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to the values for your development Supabase project. The browser client only uses public Supabase credentials. Do not put service-role keys, payment secrets, or other server credentials in `VITE_*` variables.

Start the Vite development server:

```bash
bun run dev
```

The site runs at [http://localhost:3000](http://localhost:3000).

If using npm on Windows PowerShell, use `npm.cmd` to avoid PowerShell's script execution policy blocking `npm.ps1`:

```powershell
npm.cmd install
npm.cmd run dev
```

## Run the mobile app

The mobile app is in `mobile/` and has its own dependencies and environment file. Follow [mobile/README.md](mobile/README.md) for Expo Go, device, and EAS instructions.

For a quick Expo Go preview on Windows:

```powershell
Copy-Item mobile/.env.example mobile/.env
Set-Location mobile
npm.cmd install
npx.cmd expo start --go
```

Configure `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `EXPO_PUBLIC_WEB_URL` in `mobile/.env`. Use a phone and computer on the same network to scan the Expo Go QR code. Android emulator launch additionally requires the Android SDK and ADB; iOS simulator builds require macOS.

## Backend and payments

The applications use Supabase for authentication and data. Database migrations are under `supabase/migrations/`, and Edge Function source is under `supabase/functions/`. Use a dedicated development or staging project when applying migrations or testing payment flows. Review the migration and deployment plan before applying changes to a live project.

Payment initialization and webhook secrets must be configured as server-side Supabase Function secrets. Never commit real credentials or expose service-role, Paystack, or Yoco secret keys to browser or mobile code.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment notes and [docs/RESELLER_PROGRAM.md](docs/RESELLER_PROGRAM.md) for reseller qualification, attribution, commission, and payout rules.

## Useful commands

From the repository root:

```bash
bun run dev       # Start the website development server
bun run build     # Create the website production build
bun run preview   # Preview the production build locally
```

Mobile scripts and checks are documented in [mobile/README.md](mobile/README.md). Build exports are useful for checking bundling, but do not create signed store binaries; Android and iOS releases use EAS Build.

## Repository layout

```text
src/                 Website application
mobile/              Expo / React Native app
public/              Static website assets
supabase/functions/  Supabase Edge Functions
supabase/migrations/ Database migrations
docs/                Deployment and product notes
tests/               Automated tests
```

## Privacy and security

DigitalNexCare handles healthcare and account data. Use synthetic data in local development, follow the existing access controls, and do not place patient information or credentials in commits, issues, logs, screenshots, or example files. Review the public [Privacy Policy](https://care.digitalnexcode.co.za/legal/privacy) and [Terms of Service](https://care.digitalnexcode.co.za/legal/terms).
