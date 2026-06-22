import pg from 'pg';

const connectionString = "postgresql://postgres.bszaqbfrbmuhlwavpvrz:bvlhEpYn1mtSPjxX@aws-0-eu-west-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log("Connected to PostgreSQL database!");

  // Count tables
  const userCount = await client.query('SELECT COUNT(*) FROM users');
  const bookCount = await client.query('SELECT COUNT(*) FROM books');
  const purchaseCount = await client.query('SELECT COUNT(*) FROM purchases');
  const giftCount = await client.query('SELECT COUNT(*) FROM gifts');

  console.log("\n--- Database Counts ---");
  console.log("Users:", userCount.rows[0].count);
  console.log("Books:", bookCount.rows[0].count);
  console.log("Purchases:", purchaseCount.rows[0].count);
  console.log("Gifts:", giftCount.rows[0].count);

  // List all purchases
  const purchases = await client.query('SELECT * FROM purchases ORDER BY created_at DESC');
  console.log("\n--- Purchases in Database ---");
  for (const p of purchases.rows) {
    console.log(`- ID: ${p.purchase_id}, User ID: ${p.user_id}, Product: ${p.product_type}, Book ID: ${p.book_id}, Amount: ${p.amount}, Status: ${p.payment_status}, Ref: ${p.payment_reference}, Created: ${p.created_at}`);
  }

  await client.end();
}

run().catch((e) => {
  console.error("Error connecting or querying:", e);
});
