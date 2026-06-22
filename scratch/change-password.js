import pg from 'pg';
import { hashPassword } from '../lib/auth.js';

const connectionString = "postgresql://postgres.bszaqbfrbmuhlwavpvrz:bvlhEpYn1mtSPjxX@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function run() {
  const newPassword = "N3xtG3N@77$";
  const newHash = hashPassword(newPassword);
  console.log(`Generated new hash: ${newHash}`);

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected to PostgreSQL database!");

  // Find all admin users and update their password hash
  const res = await client.query('SELECT * FROM admin_users');
  console.log(`Found ${res.rows.length} admin user(s).`);

  for (const admin of res.rows) {
    console.log(`Updating password for admin: ${admin.email}`);
    await client.query('UPDATE admin_users SET password_hash = $1 WHERE admin_id = $2', [newHash, admin.admin_id]);
  }

  await client.end();
  console.log("Admin password update complete.");
}

run().catch((e) => {
  console.error("Error during password update:", e);
});
