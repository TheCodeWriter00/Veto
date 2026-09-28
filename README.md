# VETO — Anonymous Ethical Arena

A live, completely anonymous arena for adversarial ethical reasoning. Two unidentified
sides clash over one irreconcilable decision while a live chamber casts anonymous votes
on reasoning alone. Scoring is crowd-weighted: the smaller the room, the denser every vote.

## The scoring engine

```
c(n) = √(n / 100)          crowd factor
v(n) = round(100 / c(n))   points per vote (capped 1000, floored 1)
```

- 4 votes → 1,000 pts/vote · 41 → 156 · 100 → 100 · 10,000 → 10 · 1,000,000 → 1
- Winner takes every vote earned. Runner keeps the smaller pool. Exact tie → split points, room dissolves.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **PostgreSQL** via **Drizzle ORM**
- Tailwind CSS v4

## Local development

```bash
npm install
cp .env.example .env   # or create .env with DATABASE_URL
npx drizzle-kit push   # create tables
npm run dev
```

Open http://localhost:3000. The arena seeds itself (6 dilemmas, 6 chambers) on first run.

## Deploy (3 minutes)

The app needs exactly one thing in production: a `DATABASE_URL`.

1. **Push to GitHub** (create a repo, then):
   ```bash
   git remote add origin https://github.com/<you>/veto.git
   git push -u origin main
   ```

2. **Create a Postgres database** — Neon (neon.tech), Supabase, or Vercel Postgres.
   Copy the connection string (must include `sslmode=require` for hosted Postgres).

3. **Create the tables** once:
   ```bash
   DATABASE_URL="postgresql://user:pass@host/veto?sslmode=require" npx drizzle-kit push
   ```

4. **Deploy on Vercel** — vercel.com → Add New → Project → import the repo.
   Set environment variable `DATABASE_URL` to your connection string. Deploy.

5. Add a custom domain under Settings → Domains.

Verify with `https://your-domain/api/health` → `{"ok":true}`.

## Environment variables

| Name          | Required | Purpose                        |
| ------------- | -------- | ------------------------------ |
| `DATABASE_URL`| ✅       | PostgreSQL connection string   |

No other secrets are needed — there is no authentication and no client-side key.
