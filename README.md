# Wild Oasis Admin

A separate React staff dashboard for **Wild Oasis Escapes**, following the original `wild-oasis-revision` feature/hooks/services architecture. Styling uses Tailwind utilities directly in JSX.

## Run locally

Requires Node 22.12+ (verified here on 24.11.0), npm, and a modern browser.

```bash
npm ci
cp .env.example .env # only on a fresh checkout; preserve your existing .env
# Set VITE_SUPABASE_PUBLISHABLE_KEY to the NEW project's publishable key.
npm run dev
```

Open http://127.0.0.1:5173. The current workspace already has dependencies and a local ignored `.env` configured. The Supabase URL is pinned to `https://flvzioghreivoxdyekya.supabase.co`; other projects and secret/service-role keys are rejected by the client configuration. No legacy backend configuration was copied.

**The admin migration has been applied to the new project, and the first verified staff account has been provisioned with owner approval.** Additional accounts require trusted staff provisioning. A customer session cannot enter the dashboard. Missing admin RPCs produce an explicit access/setup error; there is no fake dashboard fallback.

## Included features

- Responsive sidebar/header, dark mode, staff login/logout, account name and password forms.
- Cabin table, discount filters, sorting, add/edit/duplicate/delete, cover uploads, gallery and amenities editing.
- Settings form with explicit Save, cross-field validation and server constraints.
- Booking status filters, sorting, pagination, details and guest information.
- Arrival confirmation, checkout, unpaid cancellation, admin-only verified payment recording via reviewed RPCs.
- Guest search, contact filter, profile and paginated reservation history. Guest editing/deletion is intentionally unavailable.
- Overview cards, reservations/collections chart, stay duration chart, today activity and recent reservations.
- Transactional staff RPCs and private append-only booking activity records.

Payment recording is a proposed **manual reconciliation workflow**, not payment processing. It cannot charge cards, process refunds or mark demo reservations paid. Managers are denied payment recording by the backend. Check-in never changes payment status. No rescheduling or booking hard-delete API is provided.

## Familiar structure

```text
src/
  App.jsx                   # Routes + ordinary providers
  pages/                    # Page composition
  features/
    authentication/         # Login/profile forms, useUser/useLogin/useLogout
    cabins/                 # CabinTable → CabinRow → CreateCabinForm, separate hooks
    bookings/               # BookingTable, BookingDetail, separate hooks
    check-in-out/           # CheckinBooking, TodayActivity, useCheckin/useCheckout
    guests/                 # Guest directory and profile queries
    settings/               # UpdateSettingsForm + hooks
    dashboard/              # DashboardLayout, Stats, SalesChart, DurationChart
  services/                 # Readable Supabase queries and RPC calls
  ui/                       # Small reusable components styled with Tailwind
  context/                  # Dark mode only
  utils/                    # Dates, money, constants
supabase/
  reference-migrations/     # Unchanged customer baseline, for isolated replay
  migrations/               # Proposed admin additions, NOT applied to hosted DB
  tests/                    # Original customer regression + admin security tests
```

## Verification

```bash
npm run lint
npm run test
npm run build
npm run format:check
npx playwright install chromium # once per machine
npm run test:e2e
npm run test:db
node --env-file=.env scripts/verify-live.mjs
```

`test:db` starts an ephemeral PostgreSQL 17.11 instance bound to localhost:55439. It replays the customer baseline with minimal Auth/Storage contracts, runs the original customer security suite before/after the admin migration, then exercises real grants, RLS, pricing, availability, catalog CRUD and staff transitions. It never connects to hosted Supabase and leaves no synthetic customers there. No Docker is required. See [testing details](docs/TESTING.md) for the limits of this isolated harness.

Browser tests intercept Supabase with synthetic fixtures; they do not establish live staff integration or payment processing. `verify-live.mjs` makes read-only anonymous requests to the specified NEW project.

## Before live use

Read [the database approval packet](docs/DATABASE_REVIEW.md), [staff provisioning](docs/STAFF_PROVISIONING.md), and [deployment instructions](docs/DEPLOYMENT.md). Do not run `supabase db push` blindly: customer baseline files are stored separately for reference, and the shared backend's authoritative migration history belongs to the customer ecosystem.

The existing customer website and original dashboard repositories are unchanged. No production database changes, staff grants, or deployment are authorized by simply running the app.

## Final review

[Final audit, tested fixes, remaining limits and interview exercises](docs/FINAL_CODE_REVIEW.md).

## Learn the implementation

[Learning guide](docs/LEARNING_GUIDE.md) maps each feature to the course project and explains the meaningful differences. [Implementation status](docs/IMPLEMENTATION_STATUS.md) distinguishes local completion from pending hosted work.
