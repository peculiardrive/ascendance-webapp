# Supabase Setup

Supabase organization:

```text
https://supabase.com/dashboard/org/kiyycwzywfcdfptotnwk
```

Supabase project:

```text
Ascendance Trilogy
https://supabase.com/dashboard/project/bszaqbfrbmuhlwavpvrz
```

Project ref:

```text
bszaqbfrbmuhlwavpvrz
```

Region:

```text
eu-west-1
```

## 1. Create Or Select A Project

In the Supabase organization dashboard:

1. Click **New project**.
2. Choose the organization for Ascendance.
3. Name the project, for example:

```text
ascendance-webapp
```

4. Choose a strong database password and save it somewhere secure.
5. Pick the nearest region for your main audience.
6. Wait for the project to finish provisioning.

## 2. Get Connection Strings

Open the Supabase project, then click **Connect**.

For Vercel/serverless Prisma usage, use:

- `DATABASE_URL`: Transaction pooler connection string, usually port `6543`
- `DIRECT_URL`: Session pooler or direct connection string, usually port `5432`

Recommended for this project:

```text
DATABASE_URL="postgresql://postgres.bszaqbfrbmuhlwavpvrz:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.bszaqbfrbmuhlwavpvrz:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

Supabase's Prisma guide recommends using the pooler for serverless deployments and a direct/session connection for migrations. Transaction pooling on port `6543` should use `pgbouncer=true` so Prisma does not rely on prepared statements.

## 3. Add Local Environment

Create a local `.env` file from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Paste your actual Supabase connection strings into `.env`.

## 4. Create Tables And Seed Books

After `.env` is configured:

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

This creates the Ascendance database tables and seeds the trilogy content.

## 5. Add Vercel Environment Variables

In Vercel, add these environment variables to the BrandZillaTech project:

```text
DATABASE_URL
DIRECT_URL
```

Then redeploy.

## 6. Important Production Note

The current deployed API still uses temporary JSON storage. After Supabase is connected and seeded, the next implementation step is to switch `app/api/*` routes from `lib/store.js` to Prisma queries in `lib/prisma.js`.
