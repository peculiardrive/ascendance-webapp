# Supabase + Prisma Setup

This folder prepares Ascendance for durable Supabase Postgres storage.

Use Supabase's **Connect** panel to get:

- `DATABASE_URL`: Supavisor transaction pooler string for Vercel/serverless, usually port `6543`
- `DIRECT_URL`: Session pooler or direct connection string for migrations, usually port `5432`

For Prisma on Supabase transaction pooling, add `?pgbouncer=true` to the transaction-pooler `DATABASE_URL`.

Then run:

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Production still needs these environment variables added to Vercel before switching API routes fully to Prisma.
