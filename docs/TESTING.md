# Testing and evidence

## Local checks

- `npm run lint`: ESLint with hooks rules and zero warnings.
- `npm run test`: Vitest/unit-component tests for Karachi calendar boundaries, hostile page parameters, cabin price/capacity validation, and staff route customer/error/staff cases.
- `npm run build`: real Vite production bundle. Dashboard charts are lazy loaded.
- `npm run format:check`: consistent readable formatting.
- `npm audit`: dependency advisory check. Current ESLint uses a patched minimatch override (`11.0.1`) to avoid the registry-reported glob amplification issue without using an unsupported ESLint release.

## Browser suite

`npm run test:e2e` runs Chromium desktop and an iPhone-sized Chromium viewport. It starts Vite on localhost:5173 and intercepts every Supabase request with synthetic fixtures. No real credentials/customer data or staff writes are used.

Scenarios: anonymous deep-link redirect/login, customer staff denial, missing migration denial, dashboard/navigation/dark mode, guest profile/history, settings save, add/edit/duplicate/confirmed-delete cabin and check-in with unchanged unpaid status. Requests are asserted to use the staff RPC, not direct booking UPDATE or storage DELETE. Screenshots in `test-results/dashboard-{desktop,mobile}.png` show **synthetic test data**, not real property statistics. These generated artifacts are ignored by Git.

This validates browser behavior against the intended API contract. It does not prove live staff login, real image upload or hosted PostgREST visibility.

## Real PostgreSQL integration suite

`npm run test:db` uses the pinned `embedded-postgres` PostgreSQL 17.11 binary. All database processes bind localhost and use temporary storage. There is no production connection string or remote execution path. It is suitable for this Mac without Docker, though macOS sandbox execution may require approval for PostgreSQL shared memory/local sockets.

`supabase/tests/bootstrap.sql` supplies minimal Supabase Auth and Storage contracts, API roles and default function privileges. The actual original customer migrations are replayed unchanged. The original customer security regression runs before and after the pending admin migration.

Coverage includes:

- Customer ownership, profile column grants and editable metadata privilege-escalation denial.
- Trusted reviewed pricing, idempotent retries/payload conflict, capacity/date limits, back-to-back stays, overlapping stay rejection and safe availability calendars.
- Anonymous catalog access and booking data denial.
- Staff guest/booking reads and cabin CRUD; constrained settings writes.
- Direct booking UPDATE denied even for staff; transitions only through validated RPCs.
- Checkout-before-checkin, duplicate transitions, future checkin and checked-in cancellation rejected.
- Check-in/out leave payment unchanged; demo payment denied.
- Cancellation reason, release of availability and retention of booking history.
- Payment role separation, one full collection, duplicate payment and paid cancellation denial.
- Private audit read denial, authenticated RPC staff checks, range bounds and occupancy arithmetic.
- Membership revocation takes effect on the next operation without JWT renewal.

The harness does not emulate the full Supabase Auth service, Storage MIME enforcement, PostgREST schema cache, network retries or email delivery. It tests the actual SQL authorization/constraints rather than claiming those hosted service behaviors.

## Live read-only check

`node --env-file=.env scripts/verify-live.mjs` is pinned to `flvzioghreivoxdyekya` and a publishable key. It reads active cabins/settings and checks anonymous denial of guest/booking data and staff access. It makes no write requests. At verification, 8 active cabins were returned and all checks passed.

## Pending after production approval

Use approved staging fixtures and an exact owner-approved verified staff account to test hosted login, protected reads, cabin uploads/public image rendering, staff/customer catalog visibility, booking transitions and availability on both applications. Re-run security advisors after the approved migration. Do not create/delete real reservations simply to claim a passing integration test.

The existing customer application's full browser suite was not run against production and is not claimed as passed. Its original **SQL security regression** did run unchanged on the isolated database before/after the proposal.
