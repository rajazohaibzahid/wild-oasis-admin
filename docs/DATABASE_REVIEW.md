> **Hosted update — November 7, 2026:** The owner explicitly approved the reviewed admin migration in chat. It was applied successfully to `flvzioghreivoxdyekya` as migration `20261107100718_staff_admin_operations` (the local filename has been aligned to this hosted version; the initial review used timestamp `20261107085611`). The first email-confirmed account was subsequently provisioned as admin with explicit owner approval; its identity is retained only in an ignored local operator record. Earlier pending-approval statements below describe the original implementation handoff.

# Proposed admin database changes — owner approval required

## Verified target and baseline

Target: **WildOasisEscapes**, `flvzioghreivoxdyekya`, PostgreSQL 17.11, healthy when inspected. No old-project endpoint is present in the application configuration.

The live migration list matches these reference files from `wild-oasis-escapes`:

1. `20261106230919_reservation_foundation.sql`
2. `20261106231839_demo_cabin_collection.sql`
3. `20261106233008_consolidate_cabin_policies.sql`
4. `20261106233337_require_reviewed_price.sql`
5. `20261106233907_mark_portfolio_reservations_as_demo.sql`

The reference snapshots are isolated from pending admin migrations to avoid accidentally replaying foundation DDL on a populated hosted project. Reference revisions: admin `9d276b2acc8e7b76e11356aa8245eeb022b31e1e`, customer `c517ef2c4f6c6a0649aaac1c5a8fb01ce707e72c`.

Tables inspected: `public.cabins`, `public.guests`, `public.bookings`, `public.settings`, `private.staff_members`. All have RLS. At inspection there were 8 cabins, 1 settings row, no guests/bookings/staff. The existing private membership table intentionally has no browser policies or grants. The security advisor's informational no-policy finding is consistent with that deny-by-default design.

## Exact migration for review

`supabase/migrations/20261107100718_staff_admin_operations.sql`

| Addition                                 | Why required                                                                             | Authorization                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Settings minimum/horizon constraint      | Prevent settings from making every future stay invalid                                   | Existing staff settings policy; database CHECK                                        |
| `public.staff_access()`                  | Let the route guard check authoritative membership without exposing the membership table | Authenticated role only; returns `private.is_staff()`                                 |
| `private.booking_events`                 | Preserve actor, transition, reason/reference, payment snapshot and timestamp             | RLS enabled; no browser table grants                                                  |
| `public.staff_check_in(uuid)`            | Confirm actual arrival during the reserved stay                                          | Current staff membership; confirmed → checked_in                                      |
| `public.staff_check_out(uuid)`           | Complete an arrived stay, including early or overdue departure                           | Current staff; checked_in → completed                                                 |
| `public.staff_cancel_booking(uuid,text)` | Release inventory without deleting history                                               | Current staff; unpaid confirmed bookings only; required reason                        |
| `public.staff_record_payment(uuid,text)` | Record an independently verified full payment                                            | Current **admin** membership; no demo/paid/cancelled rows; required receipt reference |
| `public.staff_booking_audit(uuid)`       | Read booking staff history                                                               | Current staff membership                                                              |
| `public.staff_dashboard(date,date)`      | Aggregate without the REST 1,000-row limit                                               | Current staff; bounded historical range                                               |

Public functions are SECURITY INVOKER wrappers with empty search paths and explicit grants. Private implementations use SECURITY DEFINER only for their narrowly scoped access, check `auth.uid()` through current database membership, fully qualify relations, and revoke PUBLIC/anon execution. The private schema must remain outside exposed Data API schemas.

## Business rules proposed for approval

- Check-in requires property-local today in `[start_date,end_date)` and does not imply payment.
- Checkout requires checked_in, permits early/overdue completion, and retains reserved date/pricing snapshots. It does not free early-departure nights; a later reviewed rescheduling workflow is needed for that.
- Only confirmed unpaid bookings may be cancelled. Paid cancellations, refunds, reversal of a payment and partial payments are unsupported.
- Payment recording is limited to `admin`, records the entire snapshot total and requires independent confirmation. No card data is stored. Existing `is_demo=true` bookings can never be recorded as collected money.
- No client can directly update bookings, including staff. State changes lock the booking row and append an audit event in the same transaction. A repeated transition is rejected, rather than generating duplicate audit/payment events.
- No operation changes dates, cabin, capacity, guest, authoritative price, request ID or demo flag. The GiST exclusion constraint remains unchanged.
- No guest editing/deletion is added. Staff may read guest profiles; customers retain their existing ownership policies.
- Catalog/storage and settings permissions are unchanged. Existing SQL constraints remain authoritative; one additional CHECK requires the minimum stay to fit within the booking horizon.

## Analytics semantics

New reservations count rows created in the selected period, including cancelled/demo rows. Chart reservation value excludes cancellations. Recorded collections sum payment audit events recorded in the period, excluding demo rows; this is a reconciliation metric, not provider settlement or accrual accounting. Pre-migration paid rows with no audit event are not retroactively counted.

Check-ins count audit events in the period. Duration buckets use non-cancelled arrivals in the period. Occupied nights intersect the requested calendar interval with non-cancelled reserved date ranges. Inventory includes active cabins and inactive cabins with an overlapping stay; this handles simple cabin deactivation but cannot reconstruct historic inventory changes without an inventory history table. This limitation is visible in the UI/docs. Recent reservations are the latest five globally; today activity is a separate property-local query.

## Tests already exercised locally

The runner uses real PostgreSQL 17.11, original customer migrations and regression SQL. Admin tests cover customer metadata escalation denial, staff route membership, grants/RLS, catalog CRUD, settings constraints, invalid transitions, future arrivals, check-in payment preservation, cancellation availability, duplicate/payment denial, manager/admin separation, audit access, range bounds, occupancy arithmetic, anonymous access and membership revocation. The original customer suite passes before and after the proposed migration.

Minimal Auth/Storage schemas stand in for managed Supabase services. This does not verify hosted PostgREST schema-cache visibility, hosted Auth email/redirect settings or live Storage uploads. Browser interactions are separately tested with synthetic API fixtures. Those live checks remain required after approval.

## Apply only after explicit approval

1. Reconfirm the target ref and inspect any migrations added since this baseline.
2. Review this exact SQL and the business rules above; record owner approval.
3. Apply only the admin migration to `flvzioghreivoxdyekya` through the approved migration mechanism. Do not replay foundation SQL or reset the hosted database.
4. Reload/recheck API schema visibility, run security advisors, verify anonymous/customer denial and public catalog/availability behavior.
5. Provision the exact approved verified staff UUID separately, following STAFF_PROVISIONING.md.
6. Exercise staff login, cabin upload/read, booking transitions, and customer visibility with approved staging fixtures before real business use.

The initial implementation performed no hosted writes; the migration and first staff membership were subsequently applied after separate explicit owner approvals. Stop before production deployment until the owner approves it separately.

Rollback is a reviewed forward migration: disable the named staff endpoints first, retain audit records, and assess existing changed booking states. Do not drop audit history or automatically reverse payment/booking states.
