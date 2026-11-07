import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert.equal(url, 'https://flvzioghreivoxdyekya.supabase.co', 'Refuse to inspect another project');
assert.ok(key?.startsWith('sb_publishable_'), 'Use a publishable key only');
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: cabins, error: cabinsError } = await client
  .from('cabins')
  .select('id,name,is_active')
  .limit(100);
assert.ifError(cabinsError);
assert.ok(cabins.every((cabin) => cabin.is_active));
const { data: settings, error: settingsError } = await client
  .from('settings')
  .select('time_zone,currency')
  .single();
assert.ifError(settingsError);
assert.equal(settings.time_zone, 'Asia/Karachi');
assert.equal(settings.currency, 'USD');
for (const table of ['guests', 'bookings']) {
  const { data, error } = await client.from(table).select('id').limit(1);
  assert.ok(error, `Anonymous ${table} reads must be denied`);
  assert.equal(data, null);
}
const { data: staff, error: staffError } = await client.rpc('staff_access');
assert.ok(staffError || staff === false, 'Anonymous caller must never receive staff access');
console.log(
  `PASS: new project public reads (${cabins.length} active cabins), safe settings, anonymous guest/booking denial and staff boundary. Read-only requests only.`,
);
