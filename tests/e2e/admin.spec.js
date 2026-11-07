import { test, expect } from '@playwright/test';

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'staff@example.invalid',
  user_metadata: { full_name: 'Alex Morgan' },
};
const cabin = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Cedar & Still',
  subtitle: 'The forest hideaway',
  description: 'A quiet place in nature.',
  max_capacity: 2,
  regular_price: 260,
  discount: 30,
  image: 'https://images.unsplash.com/cabin.jpg',
  gallery: [],
  amenities: ['Wi-Fi'],
  is_active: true,
  is_featured: true,
  display_order: 1,
};
const guest = {
  id: '33333333-3333-4333-8333-333333333333',
  full_name: 'Jamie Taylor',
  email: 'guest@example.invalid',
  nationality: 'Canada',
  phone: '+1 555 0100',
  created_at: '2026-11-01T00:00:00Z',
};
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(new Date());
const tomorrow = new Date(`${today}T00:00:00Z`);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 3);
const booking = {
  id: '44444444-4444-4444-8444-444444444444',
  cabin_id: cabin.id,
  guest_id: guest.id,
  cabins: cabin,
  guests: guest,
  start_date: today,
  end_date: tomorrow.toISOString().slice(0, 10),
  num_nights: 3,
  num_guests: 2,
  total_price: 690,
  cabin_price: 690,
  extras_price: 0,
  is_paid: false,
  is_demo: true,
  has_breakfast: false,
  status: 'confirmed',
  created_at: `${today}T00:00:00Z`,
};

async function mockBackend(page, { staff = true, missingMigration = false } = {}) {
  const requests = [];
  const cabins = [{ ...cabin }];
  let currentBooking = { ...booking };
  const session = {
    access_token: 'synthetic-test-token',
    refresh_token: 'synthetic-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
    user,
  };
  await page.addInitScript((value) => {
    localStorage.setItem('wild-oasis-admin-auth', JSON.stringify(value));
    localStorage.setItem('wild-oasis-admin-theme', 'light');
  }, session);
  await page.route('https://images.unsplash.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="200" height="150" fill="#7c9c78"/></svg>',
    }),
  );
  await page.route('https://flvzioghreivoxdyekya.supabase.co/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const isJson = request.headers()['content-type']?.includes('application/json');
    requests.push({ path, method: request.method(), body: isJson ? request.postDataJSON() : null });
    let body;
    const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path.includes('/storage/v1/object/cabin-images/'))
      body = { Key: 'cabin-images/test-upload.png' };
    else if (path.includes('/auth/v1/user')) body = user;
    else if (path.includes('/auth/v1/logout')) body = {};
    else if (path.endsWith('/rpc/staff_access')) {
      if (missingMigration)
        return route.fulfill({
          status: 404,
          headers,
          body: JSON.stringify({ code: 'PGRST202', message: 'Missing RPC' }),
        });
      body = staff;
    } else if (path.endsWith('/rpc/staff_dashboard'))
      body = {
        booking_count: 12,
        paid_revenue: 2300,
        checkins: 4,
        occupancy: 62.5,
        daily: [{ date: today, booked_value: 3200, paid_revenue: 2300 }],
        durations: [
          { name: '3–4 nights', value: 8 },
          { name: '5–7 nights', value: 4 },
        ],
        recent: [{ ...booking, guest_name: guest.full_name, cabin_name: cabin.name }],
      };
    else if (path.endsWith('/rpc/staff_booking_audit')) body = [];
    else if (path.endsWith('/rpc/staff_check_in')) {
      currentBooking = { ...currentBooking, status: 'checked_in' };
      body = booking.id;
    } else if (path.endsWith('/rpc/staff_check_out')) {
      currentBooking = { ...currentBooking, status: 'completed' };
      body = booking.id;
    } else if (path.endsWith('/rpc/staff_cancel_booking')) {
      currentBooking = { ...currentBooking, status: 'cancelled' };
      body = booking.id;
    } else if (path.endsWith('/cabins')) {
      if (request.method() === 'POST') {
        const created = { id: crypto.randomUUID(), ...request.postDataJSON() };
        cabins.push(created);
        body = created;
      } else if (request.method() === 'PATCH') {
        Object.assign(cabins[0], request.postDataJSON());
        body = cabins[0];
      } else if (request.method() === 'DELETE') {
        body = { id: cabins.pop().id };
      } else body = cabins;
    } else if (path.endsWith('/bookings')) {
      body = url.searchParams.has('id') ? currentBooking : [currentBooking];
      headers['content-range'] = '0-0/1';
    } else if (path.endsWith('/guests')) {
      body = url.searchParams.has('id') ? guest : [guest];
      headers['content-range'] = '0-0/1';
    } else if (path.endsWith('/settings'))
      body = {
        id: 1,
        min_booking_length: 2,
        max_booking_length: 21,
        max_guests_per_booking: 8,
        breakfast_price: 18,
        max_advance_days: 365,
        currency: 'USD',
        time_zone: 'Asia/Karachi',
        ...request.postDataJSON(),
      };
    else
      return route.fulfill({
        status: 500,
        headers,
        body: JSON.stringify({ message: `Unexpected mock endpoint ${path}` }),
      });
    await route.fulfill({ status: 200, headers, body: JSON.stringify(body) });
  });
  return requests;
}

async function navigate(page, name) {
  const toggle = page.getByRole('button', { name: 'Open navigation' });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
}

test('login is rendered without a session and private routes redirect', async ({ page }) => {
  await page.goto('/bookings');
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page).toHaveURL(/login/);
});

test('customers and missing staff RPC cannot enter the dashboard', async ({ page }) => {
  const requests = await mockBackend(page, { staff: false });
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Staff access required' })).toBeVisible();
  expect(requests.some((request) => request.path.endsWith('/staff_dashboard'))).toBe(false);
});

test('missing migration fails closed', async ({ page }) => {
  await mockBackend(page, { missingMigration: true });
  await page.goto('/dashboard');
  await expect(page.getByText(/staff access migration is awaiting owner approval/)).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
});

test('staff dashboard, navigation, dark mode, guest history and settings', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockBackend(page);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'A good day at the oasis.' })).toBeVisible();
  await expect(page.getByText('Recorded collections', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.screenshot({
    path: `test-results/dashboard-${test.info().project.name}.png`,
    fullPage: true,
  });
  await navigate(page, 'Guests');
  await expect(page).toHaveURL(/\/guests$/);
  await expect(page.getByText('Jamie Taylor', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'View guest' }).click();
  await expect(page.getByRole('heading', { name: 'Booking history' })).toBeVisible();
  await navigate(page, 'Settings');
  await expect(page.getByLabel('Minimum nights per booking')).toHaveValue('2');
  await expect(page.getByRole('button', { name: 'Save settings' })).toBeDisabled();
  await page.getByLabel('Breakfast / guest / night (USD)').fill('20');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Settings updated')).toBeVisible();
  expect(errors).toEqual([]);
});

test('staff cabin add, edit, duplicate and confirmed delete', async ({ page }) => {
  const requests = await mockBackend(page);
  await page.goto('/cabins');
  await page.getByRole('button', { name: 'Add cabin' }).click();
  await page.getByLabel('Cabin name').fill('Maple Retreat');
  await page.getByLabel('Subtitle', { exact: true }).fill('A quiet woodland stay');
  await page.getByLabel('Description', { exact: true }).fill('A test cabin in the forest.');
  await page.getByLabel('Cover image URL').fill('https://images.unsplash.com/maple.jpg');
  await page.getByRole('button', { name: 'Create cabin', exact: true }).click();
  await expect(page.getByText('Cabin created', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Actions for Cedar & Still').click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Nightly price (USD)').fill('280');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Cabin updated')).toBeVisible();
  const edit = requests.find(
    (request) => request.path.endsWith('/cabins') && request.method === 'PATCH',
  );
  expect(edit.body.regular_price).toBe(280);
  await page.getByLabel('Actions for Cedar & Still').click();
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await expect(page.getByText(/Cedar & Still \(copy/)).toBeVisible();
  const inserts = requests.filter(
    (request) => request.path.endsWith('/cabins') && request.method === 'POST',
  );
  expect(inserts[1].body.is_active).toBe(false);
  await page.getByLabel('Actions for Cedar & Still', { exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Cabin deleted')).toBeVisible();
  expect(
    requests.some((request) => request.path.includes('/storage/') && request.method === 'DELETE'),
  ).toBe(false);
});

test('checkin preserves payment and uses validated RPC', async ({ page }) => {
  const requests = await mockBackend(page);
  await page.goto(`/checkin/${booking.id}`);
  await expect(page.getByRole('button', { name: 'Confirm check-in' })).toBeDisabled();
  await expect(
    page.getByText('Check-in records arrival only. Payment remains unpaid.'),
  ).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Confirm check-in' }).click();
  await expect(page).toHaveURL(new RegExp(`/bookings/${booking.id}`));
  await expect(page.getByText('Awaiting payment', { exact: false })).toBeVisible();
  expect(requests.find((request) => request.path.endsWith('/staff_check_in')).body).toEqual({
    p_booking: booking.id,
  });
  expect(
    requests.some((request) => request.path.endsWith('/bookings') && request.method === 'PATCH'),
  ).toBe(false);
});

test('cabin cover upload is saved as a new public storage URL', async ({ page }) => {
  const requests = await mockBackend(page);
  await page.goto('/cabins');
  await page.getByLabel('Actions for Cedar & Still').click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Or upload a new cover image (up to 10 MB)').setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from('synthetic-test-image'),
  });
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Cabin updated')).toBeVisible();
  const upload = requests.find(
    (request) =>
      request.path.includes('/storage/v1/object/cabin-images/') && request.method === 'POST',
  );
  expect(upload).toBeTruthy();
  const saved = requests.find(
    (request) => request.path.endsWith('/cabins') && request.method === 'PATCH',
  );
  expect(saved.body.image).toContain('/storage/v1/object/public/cabin-images/cabins/');
  expect(
    requests.some((request) => request.path.includes('/storage/') && request.method === 'DELETE'),
  ).toBe(false);
});
