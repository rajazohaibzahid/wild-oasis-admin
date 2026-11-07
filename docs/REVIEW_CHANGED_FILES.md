# Changed files — final review

All changes are isolated on `review/final-code-audit`. Existing designs and folder structures remain. No production data, grants, policies or configuration were changed.

## Admin

| Exact file                                                      | Change / purpose                                                                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                                     | Link the final audit and correct shared-backend status where applicable.                                                                     |
| `docs/DATABASE_REVIEW.md`                                       | Align the documented local migration path with the already-applied hosted version.                                                           |
| `docs/FINAL_CODE_REVIEW.md`                                     | Prioritized findings, evidence, test limits, learning guide, interview questions, exercises and release gate.                                |
| `docs/IMPLEMENTATION_STATUS.md`                                 | Record the isolated review and current GitHub/backend status.                                                                                |
| `docs/LEARNING_GUIDE.md`                                        | Correct staff display-name ownership: Auth metadata only, not guest profiles.                                                                |
| `docs/REVIEW_CHANGED_FILES.md`                                  | This exhaustive changed-file index for both repositories.                                                                                    |
| `playwright.config.js`                                          | Allow isolated browser-server ports; admin also uses strictPort to avoid silently testing another app.                                       |
| `scripts/test-database.mjs`                                     | Run the new cross-app flow in ephemeral PostgreSQL after existing security suites.                                                           |
| `src/features/cabins/CreateCabinForm.jsx`                       | Explain/validate supported cover and gallery image hosts.                                                                                    |
| `src/hooks/useAuthSession.js`                                   | Clear admin domain caches before replacing the signed-in identity.                                                                           |
| `src/services/apiAuth.js`                                       | Remove the silent guest-profile mutation from staff display-name updates.                                                                    |
| `src/services/apiCabins.js`                                     | Validate customer-compatible HTTPS image hosts before storing image references.                                                              |
| `src/services/apiDashboard.js`                                  | Include overdue-but-eligible confirmed arrivals in today activity.                                                                           |
| `src/utils/helpers.js`                                          | Preserve USD cents and use property timezone for timestamp dates.                                                                            |
| `supabase/migrations/20261107085611_staff_admin_operations.sql` | Rename only: the original local timestamp did not match hosted history.                                                                      |
| `supabase/migrations/20261107100718_staff_admin_operations.sql` | Represent the identical already-applied staff SQL under its actual hosted version; no new DDL applied.                                       |
| `supabase/tests/cross-app-flow.sql`                             | Exercise customer/staff history, catalog/settings quotes, transitions, cancellation and inactive-cabin RLS using local rolled-back fixtures. |
| `tests/apiAuth.test.js`                                         | Regress staff metadata-only saves and current-password verification failure.                                                                 |
| `tests/apiCabins.test.js`                                       | Cover unsupported image hosts as well as immutable upload/preserve-file behavior.                                                            |
| `tests/auth-session.test.jsx`                                   | Check that an identity replacement discards private cached data.                                                                             |
| `tests/e2e/admin.spec.js`                                       | Exercise a synthetic Storage upload, assert its saved URL, and use CSP-compatible fixture images.                                            |
| `tests/helpers.test.js`                                         | Regress cents and property-local timestamp display.                                                                                          |
| `tests/today-activity.test.js`                                  | Regress late-arrival query boundaries.                                                                                                       |

## Customer

| Exact file                                                      | Change / purpose                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `README.md`                                                     | Link the final audit and correct shared-backend status where applicable.                                      |
| `docs/FINAL_CODE_REVIEW.md`                                     | Prioritized findings, evidence, test limits, learning guide, interview questions, exercises and release gate. |
| `docs/FUTURE_ADMIN_ARCHITECTURE.md`                             | Distinguish the original planning notes from the now-applied staff backend.                                   |
| `docs/REVIEW_CHANGED_FILES.md`                                  | This exhaustive changed-file index for both repositories.                                                     |
| `docs/SETUP_AND_RELEASE.md`                                     | Correct six-migration history and the separate admin application status.                                      |
| `playwright.config.js`                                          | Allow isolated browser-server ports; admin also uses strictPort to avoid silently testing another app.        |
| `src/features/authentication/AuthProvider.jsx`                  | Prevent late startup getUser results from replacing newer auth events.                                        |
| `src/features/bookings/BookingDetail.jsx`                       | Render unavailable cabin/guest relations safely without changing RLS.                                         |
| `src/features/bookings/MyBookings.jsx`                          | Keep booking history usable when an inactive cabin is hidden by RLS.                                          |
| `src/features/bookings/ReservationCalendar.jsx`                 | Disclose the calendar shading coverage date.                                                                  |
| `src/features/bookings/ReservationFields.jsx`                   | Pass calendar coverage to the existing calendar component.                                                    |
| `src/features/bookings/ReservationForm.jsx`                     | Bound calendar requests and derive guest count from current capacity/settings.                                |
| `src/features/cabins/useAvailability.js`                        | Let the validating RPC return errors for invalid complete date ranges.                                        |
| `src/pages/Auth.jsx`                                            | Require recovery state for reset mode and replace the nested form ternary with explicit conditions.           |
| `src/pages/Cabins.jsx`                                          | Reject fractional/unsafe page parameters.                                                                     |
| `supabase/migrations/20261107100718_staff_admin_operations.sql` | Represent the identical already-applied staff SQL under its actual hosted version; no new DDL applied.        |
| `tests/e2e/customer.spec.js`                                    | Use deterministic public API fixtures and regress invalid date URLs/fractional pagination.                    |
| `tests/e2e/publicBackend.js`                                    | Intercept all customer public Supabase API calls with isolated synthetic fixtures.                            |
| `tests/reservation-form.test.jsx`                               | Regress 730-day calendar requests and one-person cabin selection.                                             |
| `tests/review-auth.test.jsx`                                    | Reproduce stale startup lookup vs sign-out/recovery event races.                                              |
| `tests/review-bookings.test.jsx`                                | Render list/details with a null cabin relationship.                                                           |
| `tests/review-recovery.test.jsx`                                | Check normal/recovery route separation and the generic reset-request flow.                                    |
