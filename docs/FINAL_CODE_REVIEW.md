# Final code review — Wild Oasis Admin & Escapes

Reviewed November 8, 2026. Fixes live on **review/final-code-audit** in each repository; main branches and production data/RLS are unchanged by this review.

## Scope and confidence

Baselines: admin `9611f3c4f99e5aa1cda79411a8e3702e775db9f7`, customer `c517ef2c4f6c6a0649aaac1c5a8fb01ce707e72c`; both matched fetched origin/main before work. `wild-oasis-revision` supplied the original page/feature/hook/service patterns. Inspection covered routing/layout, authentication, forms, services/query keys, cabin/booking/guest/settings/dashboard features, migrations/permissions, storage contracts, tests and release documentation. Existing uncommitted changes were absent; no original style-reference code was modified.

The owner selected **isolated local tests only** for synthetic accounts/bookings. Hosted inspection was read-only. No account signup, email sending, catalog/settings write, booking mutation, role grant, schema/RLS change, deployment or destructive Git action was performed against production during this review. Earlier separately approved migration/provisioning work is not being repeated.

P1 = broken core workflow or unintended cross-domain mutation; P2 = functional correctness, cache/configuration or deployment concern. No critical exploit is claimed. A fixed frontend edge case is not evidence that database authorization was bypassed.

## Prioritized findings and fixes

| Priority | Classification                                    | Evidence / previous behavior                                                                                                                          | Exact source                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Recommended change implemented / why it matters                                                                                                                                           | Verification                                                                          |
| -------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| P1       | Verified bug, fixed                               | Staff profile saves changed the guest profile before changing Auth display metadata.                                                                  | [admin: src/services/apiAuth.js:36](https://github.com/rajazohaibzahid/wild-oasis-admin/blob/review/final-code-audit/src/services/apiAuth.js#L36)                                                                                                                                                                                                                                                                                                             | Removed the guest UPDATE. Staff names use display-only Auth metadata; roles still come only from private membership.                                                                      | apiAuth.test.js asserts no table access and failure handling.                         |
| P1       | Verified crash, fixed                             | Inactive cabins are hidden by current customer catalog RLS; booking relationships can be null while the reservation remains readable.                 | [customer: src/features/bookings/MyBookings.jsx:30](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/features/bookings/MyBookings.jsx#L30); [customer: src/features/bookings/BookingDetail.jsx:44](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/features/bookings/BookingDetail.jsx#L44)                                                                                      | Null-safe cabin/guest rendering preserves dates, price and status. No extra data is exposed and no RLS policy is weakened.                                                                | review-bookings.test.jsx + isolated SQL deactivation/history checks.                  |
| P1       | Verified race, fixed                              | A pending startup getUser() could resolve after SIGNED_OUT and replace the newer signed-out state.                                                    | [customer: src/features/authentication/AuthProvider.jsx:25](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/features/authentication/AuthProvider.jsx#L25)                                                                                                                                                                                                                                                              | Ignore stale startup results once a newer auth event has changed session state. Prevents a false signed-in UI.                                                                            | review-auth.test.jsx reproduces delayed lookup after sign-out and recovery.           |
| P1       | Verified workflow bug, fixed                      | ReservationForm defaulted to two guests even for a one-person cabin; a one-option select could display 1 while state remained invalid.                | [customer: src/features/bookings/ReservationForm.jsx:18](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/features/bookings/ReservationForm.jsx#L18)                                                                                                                                                                                                                                                                    | Bound the initial and rendered/submitted count to cabin/settings capacity. Server capacity validation remains authoritative.                                                              | reservation-form.test.jsx adds a one-person cabin case.                               |
| P2       | Verified display bug, fixed                       | maximumFractionDigits:0 rounded USD amounts such as 230.49 into 230.                                                                                  | [admin: src/utils/helpers.js:3](https://github.com/rajazohaibzahid/wild-oasis-admin/blob/review/final-code-audit/src/utils/helpers.js#L3)                                                                                                                                                                                                                                                                                                                     | Display two decimal places in financial values. Never round away money while presenting reservation/payment records.                                                                      | helpers.test.js cents regression.                                                     |
| P2       | Verified workflow omission, fixed                 | Today activity selected confirmed start_date = today, hiding guests arriving late but still eligible for check-in.                                    | [admin: src/services/apiDashboard.js:19](https://github.com/rajazohaibzahid/wild-oasis-admin/blob/review/final-code-audit/src/services/apiDashboard.js#L19)                                                                                                                                                                                                                                                                                                   | Use start_date <= today and end_date > today for pending arrivals; retain due/overdue checkout selection.                                                                                 | today-activity.test.js checks the query boundary.                                     |
| P2       | Verified timezone bug, fixed                      | Timestamp display used the browser timezone, which could show a different creation/audit date from the property.                                      | [admin: src/utils/helpers.js:12](https://github.com/rajazohaibzahid/wild-oasis-admin/blob/review/final-code-audit/src/utils/helpers.js#L12)                                                                                                                                                                                                                                                                                                                   | Convert timestamps to Asia/Karachi dates; preserve date-only stay values.                                                                                                                 | helpers.test.js tests 20:01 UTC crossing property midnight.                           |
| P2       | Verified bounded-API mismatch, fixed              | Settings permit 730 advance days but cabin_calendar rejects spans over 370 days.                                                                      | [customer: src/features/bookings/ReservationForm.jsx:37](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/features/bookings/ReservationForm.jsx#L37); [customer: src/features/bookings/ReservationCalendar.jsx:19](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/features/bookings/ReservationCalendar.jsx#L19)                                                                | Limit shading requests to 370 days and disclose coverage. Inputs/authoritative quote still support the full allowed horizon.                                                              | reservation-form.test.jsx 730-day settings case.                                      |
| P2       | Verified URL error-state bug, fixed               | Reversed date parameters disabled the availability query but still filtered against an empty result, presenting no cabins rather than the date error. | [customer: src/features/cabins/useAvailability.js:8](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/features/cabins/useAvailability.js#L8)                                                                                                                                                                                                                                                                            | Ask the validating availability RPC whenever both dates exist, then show its error. Do not invent client availability.                                                                    | Isolated browser test for reversed URL dates.                                         |
| P2       | Verified URL pagination bug, fixed                | Fractional page values were accepted and used in Array.slice, skipping cabins and selecting no pagination button.                                     | [customer: src/pages/Cabins.jsx:19](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/pages/Cabins.jsx#L19)                                                                                                                                                                                                                                                                                                              | Require a positive safe integer; otherwise use page 1.                                                                                                                                    | Isolated browser page=1.5 regression.                                                 |
| P2       | Verified recovery UX gap, fixed                   | The reset route accepted any existing signed-in session as though a recovery link had been verified.                                                  | [customer: src/pages/Auth.jsx:68](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/pages/Auth.jsx#L68)                                                                                                                                                                                                                                                                                                                  | Require both user and PASSWORD_RECOVERY state for the recovery form. This is flow separation, not a demonstrated bypass of Supabase authorization.                                        | review-recovery.test.jsx checks normal vs recovery sessions and exact reset URL.      |
| P2       | Verified production configuration mismatch, fixed | Admin URL fields accepted image hosts excluded by the customer Vercel img-src policy.                                                                 | [admin: src/services/apiCabins.js:4](https://github.com/rajazohaibzahid/wild-oasis-admin/blob/review/final-code-audit/src/services/apiCabins.js#L4); [customer: vercel.json:22](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/vercel.json#L22)                                                                                                                                                                           | Validate HTTPS URLs against Unsplash/new-project Storage in forms and service. Upload remains UUID-based and never deletes shared files.                                                  | apiCabins.test.js host checks; mocked browser upload; real Storage policy SQL checks. |
| P2       | Verified migration-history drift, fixed locally   | Hosted staff migration version is 20261107100718, admin used a different local timestamp, and customer history omitted the staff migration.           | [admin: supabase/migrations/20261107100718_staff_admin_operations.sql:1](https://github.com/rajazohaibzahid/wild-oasis-admin/blob/review/final-code-audit/supabase/migrations/20261107100718_staff_admin_operations.sql#L1); [customer: supabase/migrations/20261107100718_staff_admin_operations.sql:1](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/supabase/migrations/20261107100718_staff_admin_operations.sql#L1) | Align the admin filename and include the identical already-applied SQL in the customer history. No hosted migration was executed in this review.                                          | Files are byte-identical; isolated baseline + admin replay passes.                    |
| P2       | Verified cache retention, hardened                | Admin domain cache keys omit user IDs; a different identity delivered through an Auth event retained prior cached queries.                            | [admin: src/hooks/useAuthSession.js:18](https://github.com/rajazohaibzahid/wild-oasis-admin/blob/review/final-code-audit/src/hooks/useAuthSession.js#L18)                                                                                                                                                                                                                                                                                                     | Clear cached server state before installing a different identity. Normal UI login/logout already cleared caches; unauthorized data exposure through the route guard was not demonstrated. | auth-session.test.jsx checks identity replacement clears guest cache.                 |
| P2       | Open configuration warning                        | Hosted advisor reports leaked-password protection disabled.                                                                                           | [customer: docs/SETUP_AND_RELEASE.md:49](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/docs/SETUP_AND_RELEASE.md#L49)                                                                                                                                                                                                                                                                                                    | Owner should review/enable password protection and hosted minimum length through an approved configuration change. No setting was changed.                                                | Live read-only security advisor; see official remediation below.                      |

## Open risks and intentional limits

- **Email integration remains unverified.** The public hosted Auth settings endpoint reports email signup enabled and `mailer_autoconfirm=false` (email confirmation required). This endpoint does not reveal the site URL, redirect allowlist, SMTP configuration, hosted password minimum or email delivery. These remain owner/staging checks. No management credential was extracted to bypass the connected tools' limits.
- **Actual staff browser login was not re-tested.** A read-only authenticated-role SQL simulation using the already provisioned verified staff subject passed `staff_access` and analytics. This is not a password/JWT/browser authentication test. Do not share the real staff password to enable testing; use approved staging accounts later.
- **Inactive cabin names/photos remain hidden to customers.** The crash is fixed; historical cabin snapshots/ownership-based reads need a separately reviewed backend design if the business wants those details visible after deactivation.
- **Cross-app caches are not Realtime subscriptions.** Admin mutations invalidate admin caches, not another browser application's QueryClient. Customer catalog/settings/booking reads refresh on appropriate navigation/focus once stale or on reload. A continuously focused page is not promised instant push updates; quote/create RPCs independently validate current authoritative settings/prices.
- **Historical occupancy is an approximation.** Inventory history is not modeled; the dashboard uses current active cabins plus cabins with overlapping stays. A historical inventory ledger is deferred. Revenue means recorded non-demo collections, not unpaid reservation totals, provider settlements, refunds or profit.
- **Image cleanup is intentionally conservative.** Upload failure never deletes another cabin's referenced files. Failed record saves may leave an orphan for reviewed cleanup. Browser host validation prevents new unsupported image links; existing links require operator review if their hosts fall outside the approved customer CSP.
- **Guest edits/deletion, rescheduling, refunds, partial/reversed payments, customer cancellations and browser staff provisioning are intentionally deferred.** Cancellation is staff-only, confirmed/unpaid with a reason; check-in/out never mark payment received. No new privileged API was introduced during this review.
- **No broad rewrite was justified.** Separate mutation hooks are intentionally explicit. Native dialog/details controls and small Tailwind primitives remain. Optional menu focus polish, dynamic discovery guest limits beyond the current eight-guest catalog, and scalability/pagination beyond the customer history API row limit are lower-priority follow-ups, not claimed complete.

Security advisor INFO notices on `private.staff_members` and `private.booking_events` are intentional deny-by-default tables: RLS is enabled and browser roles have no table grants/policies. Privileged implementations check membership on every request; public wrappers are invokers. The GiST overlap constraint, reviewed-price check, per-customer idempotency and price snapshots remain untouched. Browser keys remain publishable; no service-role key is used.

Sources: [Supabase password flows](https://supabase.com/docs/guides/auth/passwords), [Auth events](https://supabase.com/docs/reference/javascript/auth-onauthstatechange), [password-protection remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), [private-table no-policy notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Current docs/changelog were consulted; no relevant JavaScript Auth API breaking change required a library upgrade.

## Test evidence

| Check                                  | Admin                              | Customer                  | Environment / limits                                                                                      |
| -------------------------------------- | ---------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| ESLint                                 | Pass                               | Pass                      | Real source checks                                                                                        |
| Formatting                             | Pass                               | Pass                      | Prettier checks                                                                                           |
| Unit/component tests                   | 19 passed                          | 34 passed                 | Mocked SDK/hooks where appropriate; real React/Query/form behavior                                        |
| Production build                       | Pass                               | Pass                      | Actual Vite builds                                                                                        |
| Browser tests                          | 14 passed                          | 8 passed, 2 skipped       | Desktop + mobile Chromium; synthetic intercepted API fixtures; no hosted writes                           |
| PostgreSQL security/flow suites        | Pass                               | Shared baseline/flow pass | Ephemeral real PostgreSQL 17.11, minimal Auth/Storage contracts; synthetic users/booking rows rolled back |
| Provisioned staff membership/analytics | Read-only SQL role simulation pass | —                         | Not a real browser login                                                                                  |
| Hosted Auth settings/advisors          | Read-only inspection               | Shared backend            | Email-confirmation requirement verified; email delivery/redirects unverified                              |

Admin browser tests exercise route guards, staff denial, CRUD, duplicate inactivity, image upload URL/mutation contract, guest history, settings, dark mode and check-in's unchanged unpaid flag. Customer browser public discovery tests now intercept Supabase rather than relying on live seeded prices/counts. The two fixture-dependent live authenticated customer tests remain explicitly skipped.

The SQL runner replays the original customer baseline, runs its security regression before/after the already-approved admin SQL, then admin and cross-app suites. The cross-app suite proves customer creation → staff reads → check-in → customer checked-in status → checkout → customer completed status; catalog price/settings → updated authoritative quote; cancellation → customer cancelled history and released availability. It verifies the inactive-cabin RLS condition that caused the UI crash. This is a shared **database-contract flow**, not end-to-end email verification + two browser applications against real managed Auth/Storage.

### Reproduce safely

Admin:

```sh
npm run lint
npm run format:check
npm test
npm run build
npm run test:db
PLAYWRIGHT_PORT=6144 npm run test:e2e
```

Customer isolated browser run (dummy key, all public API requests intercepted):

```sh
npm ci
npm run lint
npm run format:check
npm test
npm run build
PLAYWRIGHT_PORT=6143 VITE_SUPABASE_URL=https://flvzioghreivoxdyekya.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_isolated_browser_fixture npm run test:e2e
```

Install Chromium first using the existing project instructions. The customer checkout defaults its browser cache to `.cache/browsers`; set `PLAYWRIGHT_BROWSERS_PATH` to an existing compatible Playwright cache when reusing this Mac's installation. No actual token/password is needed by these fixture tests. Do not add `.cache/browser-fixtures.json` for production accounts; those optional tests can create bookings and update profiles.

## Architecture and learning guide

### Admin structure and flow

`src/App.jsx` composes ordinary React Router pages and providers. `pages/` compose feature views. `features/cabins`, `bookings`, `check-in-out`, `settings`, `authentication`, `guests` and `dashboard` own focused components/hooks. `services/` owns readable Supabase table queries and named RPC calls; `ui/` owns small Tailwind/native controls. DarkModeContext is shared UI state; Query manages server state.

Trace `pages/Cabins.jsx → features/cabins/CabinTable.jsx → useCabins.js → services/apiCabins.js → cabins RLS`. For edits, CreateCabinForm validates via React Hook Form, `useEditCabin` calls `editCabin`, and success invalidates cabins/dashboard. The service does not construct authoritative booking prices or grant roles.

Staff profile forms now update Auth display metadata only. The customer guest profile has its own form/service. A dedicated staff profile table would only be justified by future staff-specific persisted fields. Display metadata never confers privileges. The route guard improves UX, while SQL membership checks are the real boundary.

BookingTable reads filter/sort/page from URL params into the Query key. BookingDetail uses a UUID-specific key. Check-in/out/cancellation invalidate affected queries; they send a booking ID/reason to validated RPCs rather than accepting arbitrary writable fields. Review `useCheckin.js`, `apiBookings.js`, and the private SQL implementation together.

### Customer structure and flow

`src/app/App.jsx` owns routes and lazy boundaries, `components/layout` the existing visual shell, and each `features/*` directory owns readable hooks/services/components. AuthProvider supplies identity/recovery state; Query caches public data and user-ID-scoped profile/bookings. ProfileForm and Auth use React Hook Form/Zod; the intentionally stateful reservation form owns dates/review/idempotency state.

Trace `CabinDetail → ReservationForm → useQuote → apiBookings.getQuote → quote_booking`. On review/confirm, `useCreateBooking → create_booking` sends selections, the idempotency key and an acknowledged expected total. PostgreSQL derives the guest from Auth, checks email/profile/capacity/window, recalculates prices, protects inventory and stores snapshots atomically. Never move these protections into client-only calculations merely to shorten the code.

Booking history queries are keyed by customer ID; sign-out clears caches. A new auth event now takes precedence over a delayed startup lookup. Recovery state is required by the password-reset view. Server ownership/RLS remains authoritative even if frontend state or a URL is manipulated.

### Shared patterns to study

- **Jonas patterns retained:** ordinary named components, pages/features/hooks/services, descriptive Query results, mutation invalidation, React Hook Form, local useState, router params/search params, small compositional UI.
- **Production additions:** server-controlled membership instead of signup roles; separate arrival/payment facts; transactional transitions/audits; verified pricing; half-open date ranges; idempotent retries; explicit image policies; bounded RPCs; failure states and isolated regression tests.
- **Tailwind:** classes remain directly in JSX; no design-system rewrite or custom CSS framework was added. Null fallbacks and auth guards preserve the existing layouts.
- **Cache freshness:** invalidation marks affected keys stale and triggers active query refreshes. It cannot reach another application's memory. Identity changes/sign-out require deliberate private-cache handling.
- **Forms:** validate for helpful feedback, select only allowed service fields, then rely on server constraints. Keep field errors distinct from network/RLS failures. Notes/review values must survive safe retries; do not regenerate an idempotency key on every click.
- **Dates:** stay dates are calendar dates, not arbitrary instants; property-local today is Asia/Karachi. Timestamps need explicit timezone conversion. Avoid deriving occupied nights from millisecond duration across DST.
- **Advanced study later:** Postgres row/advisory locks, GiST exclusion constraints, invoker/definer privileges/search paths, PKCE/email recovery, concurrent retries, query cancellation and cross-client refresh strategies. They exist for specific correctness/security guarantees, not to make basic component code clever.

### Practical source links

- [admin: src/features/cabins/useCabins.js:1](https://github.com/rajazohaibzahid/wild-oasis-admin/blob/review/final-code-audit/src/features/cabins/useCabins.js#L1)
- [admin: src/features/cabins/CreateCabinForm.jsx:1](https://github.com/rajazohaibzahid/wild-oasis-admin/blob/review/final-code-audit/src/features/cabins/CreateCabinForm.jsx#L1)
- [admin: src/features/bookings/useBookings.js:1](https://github.com/rajazohaibzahid/wild-oasis-admin/blob/review/final-code-audit/src/features/bookings/useBookings.js#L1)
- [admin: src/ui/ProtectedRoute.jsx:1](https://github.com/rajazohaibzahid/wild-oasis-admin/blob/review/final-code-audit/src/ui/ProtectedRoute.jsx#L1)
- [customer: src/features/bookings/ReservationForm.jsx:1](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/features/bookings/ReservationForm.jsx#L1)
- [customer: src/features/bookings/useCreateBooking.js:1](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/features/bookings/useCreateBooking.js#L1)
- [customer: src/features/authentication/AuthProvider.jsx:1](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/features/authentication/AuthProvider.jsx#L1)
- [customer: src/features/profile/ProfileForm.jsx:1](https://github.com/rajazohaibzahid/wild-oasis-escapes/blob/review/final-code-audit/src/features/profile/ProfileForm.jsx#L1)

## Interview questions

Admin:

1. Trace a cabin edit from form submit through mutation/invalidation/RLS and explain why the form does not own a separate server-data cache.
2. Why does a successful Auth login not grant staff access, and why is ProtectedRoute insufficient by itself?
3. Why are check-in, checkout and payment recording separate operations? What must a transaction/audit event guarantee?
4. How do URL filter/sort/page parameters affect Query keys, and what happens to private caches on identity change?
5. Why can uploaded images be shared, and why is deleting an image automatically during a failed edit unsafe?

Customer:

1. Trace quote/review/create and explain what happens when a price changes after review.
2. Explain half-open date ranges, back-to-back stays and the database exclusion constraint.
3. Explain the idempotency key and an uncertain network response after a successful booking insert.
4. What differs between signup confirmation, normal sign-in, PKCE callback and password recovery? Which parts are not proven by mocked tests?
5. Why can a booked cabin relationship be null under RLS, and how should UI resilience differ from relaxing permissions?

## Five practice exercises

1. Add a non-persistent cabin-table search filter using URL params, retaining sort/discount state; write one behavior test.
2. Write date tests around Karachi midnight, leap day and back-to-back stays without changing booking SQL.
3. Add a read-only booking payment filter and include it in the Query key/service whitelist.
4. Build a cancelled-reservation empty/history state using a null cabin fixture; retain the existing Tailwind design.
5. Simulate a failed booking response followed by a retry and explain why the same request ID must be reused; keep server validation intact.

## Deployment readiness gate

- [x] Separate review branches; main preserved; secrets and local account fixtures excluded.
- [x] Minimal frontend fixes, deterministic regression tests, builds/lint/formatting.
- [x] Current shared database grants/RLS/overlap constraint inspected read-only.
- [x] Already-applied migration version represented consistently in both histories; no new production SQL applied.
- [ ] Verify exact hosted Auth URLs/redirect allowlist, SMTP, minimum password length, leaked-password protection and real verification/reset emails on staging.
- [ ] Run real staff login with an approved synthetic staging account and ordinary browser JWT.
- [ ] Exercise both apps together on staging: upload/public image, booking changes, refreshed catalog/settings, customer status and availability.
- [ ] Verify final deployed hosts/CSP/deep links and document payment/cancellation/retention policies for any business use.
- [ ] Obtain separate approval for any hosted configuration/data/schema change and deployment.

**Readiness:** improved and locally tested portfolio applications; full production readiness is not established by this review.

## Every changed file

See [the complete changed-file index](REVIEW_CHANGED_FILES.md) for the exact path and purpose of every modified, added or renamed file in both repositories.
