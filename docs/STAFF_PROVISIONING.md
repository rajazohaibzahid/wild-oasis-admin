# Provision the first staff member

The authority is `private.staff_members(user_id, role)`, never email text, editable user metadata, or a frontend route. No staff signup button exists in the admin app.

1. The intended person creates and verifies a normal account using the existing customer site's supported account flow, or an explicitly approved trusted invitation. This implementation did not create an account.
2. In the NEW Supabase project, a trusted operator verifies the exact Auth user UUID, account email and email confirmation. Do not paste tokens/passwords into chat or logs.
3. Obtain owner approval for that exact UUID and the `admin` or `manager` role. Keep the approval record in an operator log. Both roles have catalog/read/state operations; only admin may record payments in this proposal.
4. Only after approval, run the following from a trusted database session with placeholders replaced. The exact UUID is the match; email alone is insufficient.

```sql
insert into private.staff_members (user_id, role)
select id, 'admin'
from auth.users
where id = 'VERIFIED-AND-APPROVED-UUID'::uuid
  and email_confirmed_at is not null;
```

5. Verify exactly one membership exists and sign in to the admin app with the ordinary account password. `staff_access()` must return true; no service-role key is used by the browser.
6. Test a separate customer account cannot enter or invoke staff RPCs. Enable MFA and appropriate session/offboarding procedures before a real-business launch.

To revoke access, obtain the necessary operational approval and remove the exact membership through a trusted operator. RLS/RPC checks consult membership on every request. The UI rechecks every minute and on focus; revocation does not require a new JWT. Existing rendered information may remain visible until recheck, but subsequent protected operations are denied. Never distribute shared staff credentials.

No real user UUID or role grant is included in any migration or seed file.
