# Learning guide — from the course dashboard to Wild Oasis Admin

## Start with the familiar flow

```text
Page → Feature component → Custom hook → Service → Supabase
                             ↓
                     TanStack Query cache
```

Read `src/App.jsx`, then `pages/Cabins.jsx`, `features/cabins/CabinTable.jsx`, `useCabins.js`, and `services/apiCabins.js`. These correspond directly to the original project. The application uses ordinary named function components and separate files for queries, mutations and services. There is no Redux, TypeScript, custom query framework or generic resource repository.

The original admin reference was inspected before coding: App routing, pages, cabins, bookings, dashboard, settings, authentication, check-in/out, services, hooks, Modal, Menus and Table. Customer migration and architecture documents determined the actual backend contracts.

## 1. App layout and shared UI

**Original counterparts:** `AppLayout`, `Sidebar`, `Header`, `ProtectedRoute`, `Modal`, `Menus`, `Table`, `Filter`, `SortBy`, `Pagination`.

**Same:** nested React Router routes and an Outlet, sidebar navigation, shared primitives, URL filters and local component state.

**Changed and why:** `Table` uses native table semantics instead of a custom grid-based compound API. `Modal` uses the native `<dialog>` element, which supplies modal focus trapping, inert background and Escape behavior; the effect restores focus on close. `Menus` uses keyboard-operable native details/summary and Escape handling rather than a provider shared across unrelated rows. These are simpler to debug and preserve accessibility. Controls are labelled and tables scroll within their own container on small screens.

**Tailwind:** `AppLayout` uses `lg:pl-64`; Sidebar uses responsive translate utilities; Header and tables use `dark:` variants. The 32-line global stylesheet contains imports, fonts, a dark variant and small base rules. There are no separate per-component CSS files.

**Query/data:** layout reads `useUser`; the layout itself does not fetch domain records. DarkModeContext is the only shared client-state context and stores the choice in localStorage.

**Supabase boundary:** ProtectedRoute checks both the verified user and `staff_access()`; it never queries the private membership table. It is a UI gate; the backend independently checks every operation.

**Review personally:** follow the route nesting in App, the Outlet in AppLayout, and a filter changing URLSearchParams while retaining other filters.

## 2. Staff authentication and account

**Original counterparts:** `LoginForm`, `useLogin`, `useLogout`, `useUser`, `UpdateUserDataForm`, `UpdatePasswordForm`, `ProtectedRoute`.

**Same:** React Hook Form owns form values/errors; mutation hooks call `apiAuth`; Query supplies user state; logout clears cached data.

**Changed and why:** a valid customer session does not imply staff access. `useStaffAccess(userId)` checks current membership through a narrow RPC, rechecking on focus and every minute. Missing migration/errors deny access. The application has no signup or role-grant form. `apiAuth.updateCurrentUser` reauthenticates the current password before a password change, and updates the authoritative guest display name as well as display metadata for profile changes.

**Tailwind:** form fields, errors, two-column account cards and the forest-green login panel are JSX utilities. Input/FormRow keep repeated field styling readable.

**Query/data:** `useLogin` clears old cache and sets `['user']`. `useAuthSession` handles Supabase sign-out/user changes, and `useLogout` clears private cached results. The admin uses a separate auth storage key from the customer app.

**Supabase boundary:** user_metadata is display data only. `private.staff_members` decides authorization; all definer operations call `private.is_staff()`. The browser accepts only this project's publishable key.

**Review personally:** read ProtectedRoute's early returns, then compare the backend membership check. Try a customer session and a missing RPC in the browser tests.

## 3. Cabins

**Original counterparts:** `CabinTable`, `CabinRow`, `CreateCabinForm`, `useCabins`, `useCreateCabin`, `useEditCabin`, `useDeleteCabin`, `apiCabins`.

**Same:** Cabins page → table → row; rows open forms/modals; separate mutation hooks invalidate the cabins query and notify success/error. One form handles create/edit through ordinary `isEditSession` logic.

**Changed and why:** actual fields are `max_capacity`, `regular_price`, `is_active`, etc. The customer website also needs subtitle, gallery, amenities, featured and display order fields. Duplication uses a unique name and creates an inactive copy so it cannot immediately appear in customer inventory. The original delete-on-upload-error rollback is not copied. Upload occurs first; saves never remove shared files or destructively undo edited records. A failed save after upload may leave an orphan for reviewed cleanup; the error explains that.

**Tailwind:** CabinRow's image, text, spacing, badges and hover states are utility classes. CreateCabinForm uses `grid ... sm:grid-cols-3` for prices/capacity. Modal and form controls are small reusable components.

**Query/data example from actual code:**

```js
export function useCabins() {
  const {
    data: cabins,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cabins'],
    queryFn: getCabins,
  });
  return { cabins, isLoading, error, refetch };
}
```

`getCabins()` performs the readable `.from('cabins').select('*')` query. Mutations invalidate `['cabins']` and `['dashboard']`; they do not maintain a second local list of server records. Filter and sort are derived during render, with no useEffect/useMemo.

**Supabase boundary:** existing staff RLS protects catalog writes. The `cabin-images` bucket allows JPEG/PNG/WebP up to 10 MB. Upload filenames use UUIDs and `upsert:false`; duplicate cabins may safely share the same URL. Foreign keys block deleting cabins with booking history; mark them inactive instead. No client storage cleanup is attempted.

**Review personally:** trace onSubmit → useCreateCabin → createCabin → upload/save → invalidation. Compare the original rollback behavior to the deliberate preserve-files behavior.

## 4. Settings

**Original counterparts:** `UpdateSettingsForm`, `useSettings`, `useUpdateSetting`, `apiSettings`.

**Same:** read settings through Query, edit familiar booking limits, mutate through a dedicated service and refresh cache.

**Changed and why:** React Hook Form validates fields together, and an explicit Save updates one coherent settings object rather than saving each input on blur. This avoids temporary contradictory min/max values. Only supported fields are sent; currency/timezone remain fixed by existing server constraints. The proposed migration also prevents the minimum stay from exceeding the booking horizon. Old booking snapshots are untouched.

**Tailwind:** responsive two-column input grid, card border, button row and disabled states are direct utilities.

**Query/data:** form defaults come from `useSettings()`. `useUpdateSetting()` invalidates settings/dashboard; successful save resets the dirty baseline to the saved row. The service selects the updated row so silent zero-row RLS failures become errors.

**Supabase boundary:** existing staff-only UPDATE policy plus database range/cross-field constraints remain authoritative. The server's reservation functions revalidate current settings and take pricing/config locks.

**Review personally:** watch `isDirty`, `reset(updated)`, `getValues()` cross-field validation and the service's explicit field selection.

## 5. Bookings, check-in/out and payments

**Original counterparts:** `BookingTable`, `BookingRow`, `BookingDetail`, `BookingDataBox`, `useBookings`, `useBooking`, `useDeleteBooking`, `CheckinBooking`, `useCheckin`, `useCheckout`.

**Same:** URL status/sort/page drive a Query key and a paginated Supabase query; booking details are a separate route/query; mutation hooks refresh relevant views. Relationships load cabin and guest display information.

**Changed and why:** the new statuses are `confirmed`, `checked_in`, `completed`, `cancelled`. Arrival confirmation never marks payment paid. `useDeleteBooking` preserves the familiar filename but returns an explicit `cancelBooking` operation; no hard delete service exists. No mutable booking fields are sent from React. Dates/pricing/rescheduling remain under the customer backend's guarantees. Cancellation requires a reason; recording a real full payment requires a receipt reference and owner-approved admin permission. Demo reservations cannot be marked collected.

**Tailwind:** badges use a small status-to-color map with complete utility strings. The details card, confirmation form, notes and action row use utilities, with native text rendering instead of raw HTML.

**Query/data:** `['bookings', status, sortBy, page, guestId]` distinguishes list requests. `['booking', bookingId]` and its audit subkey distinguish details. Mutations invalidate booking/list/dashboard/today keys. Whitelisted sort fields avoid arbitrary backend sorting; pagination rejects malformed URL values. The original render-time prefetch side effects are not copied.

**Actual service example:**

```js
export async function checkinBooking(id) {
  return runStaffOperation('staff_check_in', { p_booking: id });
}
```

**Supabase boundary:** the public wrapper invokes a private implementation that verifies current membership, locks the row, validates transition/date/reason and writes an audit event atomically. No UPDATE grant is added to bookings. The original availability GiST constraint remains unchanged. Staff can still view unpaid stays; a payment workflow must reflect reality, not a convenient checkbox on check-in.

**Review personally:** trace arrival through the hook/service to the SQL function, then verify `is_paid` changes only in `record_payment`. Read the cancellation and manager-payment denial tests. Business rules are explicit proposals in DATABASE_REVIEW.md and await approval.

## 6. Guests

**Original counterpart:** an extension of the original BookingDataBox guest relationship and ordinary table/query patterns; the original Users signup screen is not reused for granting staff roles.

**Same:** page → feature table → query hook → readable API module. Related history reuses BookingTable.

**Changed and why:** the real backend has UUID profiles tied to Auth, with full_name/email/phone/nationality. Search is URL-based and strips PostgREST filter punctuation. Guest editing/deletion is omitted because no owner-approved operation exists. No passport/national-ID fields are invented.

**Tailwind:** contact cards use a responsive dl grid; directory uses native scrollable tables.

**Query/data:** `useGuests` keys search/contact/page separately; `useGuest` keys the selected UUID. Guest history passes guestId to the normal bookings service instead of duplicating it.

**Supabase boundary:** staff read policies and customer ownership are unchanged. Direct navigation to another guest UUID does not bypass RLS. The private route prevents ordinary customer use of the staff directory UI.

**Review personally:** inspect the selected profile columns and the filtered guest history query. Compare tests for customer row isolation.

## 7. Dashboard and today activity

**Original counterparts:** `DashboardLayout`, `Stats`, `Stat`, `SalesChart`, `DurationChart`, `TodayActivity`, `TodayItem`, `useRecentBookings`, `useTodayActivity`.

**Same:** the layout composes independent feature components, a date-range filter drives Query, and Recharts draws sales/duration charts.

**Changed and why:** server aggregation avoids silently stopping at the API's row limit. Unpaid reservation totals are never labelled collected revenue. A payment audit event supplies the recording date and amount. Check-ins count actual events rather than all confirmed reservations. Occupancy clips each non-cancelled reserved interval to the selected window and divides by cabin inventory nights. The definition and historical-inventory limitation are visible. All property dates use Asia/Karachi.

**Tailwind:** responsive stat-card grid, chart cards, activity lists and colors are direct utilities. The dashboard route is lazy-loaded to keep chart dependencies out of the login route. CSS is not used to disguise fake data.

**Query/data:** `useRecentBookings` chooses 7/30/90 days from URL `last`, requests `staff_dashboard(start,end)`, and supplies its result to child components. TodayActivity uses its own date-keyed query and navigates to the ordinary booking/check-in routes. Mutation invalidation updates this Query cache.

**Supabase boundary:** the aggregate RPC checks staff membership and bounded dates. It returns only aggregate financial data and five recent records. Its private implementation reads the existing schema and private event table without exposing a privileged table/view.

**Review personally:** compare the old Stats `totalPrice` sum with the new `paid_revenue` ledger query. Read the occupancy test and the chart's text data alternative.

## Course patterns and current production practices

| Course pattern retained                      | Adaptation here                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| Ordinary components, separate hooks/services | Modern Query `isPending` is returned as familiar `isLoading`            |
| Protected routes                             | Independent server membership checks; errors fail closed                |
| UI delete confirmation                       | Cancellation/history preservation for consequential records             |
| Check-in form                                | Arrival and payment are separate facts                                  |
| Styled shared components                     | Small Tailwind-based primitives and JSX utilities                       |
| Modal/menu compound contexts                 | Native dialog/details where they simplify accessibility                 |
| Local dashboard calculations                 | Bounded server aggregation and explicit financial semantics             |
| Global session query                         | Clear private caches on sign-out/account switch; separate admin storage |

Do not add clever abstraction merely to remove a few repeated mutation lines. The visible `useCreateCabin`/`useEditCabin` hooks make invalidation and notifications easy to follow. Security belongs in the backend even when React could implement a shorter shortcut.

## Suggested review order

1. Run lint/tests/build; open App and AppLayout.
2. Trace cabins from page to form to mutation to service.
3. Review settings form default values and explicit save.
4. Trace list URL → queryKey → paginated bookings service.
5. Compare check-in and payment SQL, including row lock and audit insertion.
6. Read customer regression and admin security tests.
7. Inspect dashboard definitions and learn what each number does and does not represent.
8. Review the production approval packet before any hosted database write.
