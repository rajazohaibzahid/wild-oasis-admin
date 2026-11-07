import EmbeddedPostgres from 'embedded-postgres';
import { readFile, readdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Always ephemeral and localhost-only: this runner cannot target hosted Supabase.
const directory = await mkdtemp(join(tmpdir(), 'wild-oasis-admin-db-'));
const database = new EmbeddedPostgres({
  databaseDir: join(directory, 'data'),
  user: 'postgres',
  password: 'local-test-only',
  port: 55439,
  persistent: false,
  postgresFlags: ['-h', '127.0.0.1'],
  onLog() {},
  onError(message) {
    if (String(message).includes('FATAL')) console.error(String(message));
  },
});
let client;
try {
  await database.initialise();
  await database.start();
  client = database.getPgClient();
  await client.connect();
  await client.query(await readFile('supabase/tests/bootstrap.sql', 'utf8'));
  for (const file of (await readdir('supabase/reference-migrations'))
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    await client.query(await readFile(`supabase/reference-migrations/${file}`, 'utf8'));
  }
  console.log('PASS: customer foundation replayed on isolated PostgreSQL.');
  await client.query(await readFile('supabase/tests/customer-regression.sql', 'utf8'));
  console.log('PASS: original customer security regression before admin migration.');
  for (const file of (await readdir('supabase/migrations'))
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    await client.query(await readFile(`supabase/migrations/${file}`, 'utf8'));
  }
  await client.query(await readFile('supabase/tests/customer-regression.sql', 'utf8'));
  console.log('PASS: original customer regression unchanged after admin migration.');
  const result = await client.query(await readFile('supabase/tests/admin-security.sql', 'utf8'));
  for (const item of Array.isArray(result) ? result : [result]) {
    for (const row of item.rows || []) if (row.result) console.log(row.result);
  }
  const version = await client.query('show server_version');
  console.log(
    `PASS: all database suites on PostgreSQL ${version.rows[0].server_version}. No hosted writes.`,
  );
} finally {
  if (client) await client.end();
  await database.stop();
}
