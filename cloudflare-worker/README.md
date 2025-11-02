# Cloudflare Workers + D1 API (Free, No Card)

A tiny JSON API for your Kanban app using Cloudflare Workers and D1 (SQLite). Implements `/tasks` CRUD compatible with your frontend (supports `_start/_limit`, `_sort=id|order`, `_order=asc|desc`, `column`, `q`). CORS enabled.

## Why this?

- Cloudflare Free plan — typically no payment method required
- Global, fast, generous free limits
- D1 provides persistent SQLite storage

## Endpoints

- `GET /tasks` — query params: `column`, `q`, `_start`, `_limit`, `_sort=id|order`, `_order=asc|desc`
- `GET /tasks/:id`
- `POST /tasks` — body: `{ title, description?, column?, order? }`
- `PATCH /tasks/:id` — partial update of `{ title?, description?, column?, order? }`
- `DELETE /tasks/:id`

## Quick Start

Prereqs: Node 18+, `npm i -g wrangler` (or use `npx wrangler`)

1. Create the D1 Database

```bash
cd cloudflare-worker
wrangler d1 create mind_luster_db
# Copy the returned database_id and paste it into wrangler.toml under d1_databases.database_id
```

2. Apply schema

```bash
# This runs the SQL against your D1 database
wrangler d1 execute mind_luster_db --file=./schema.sql
```

3. Dev

```bash
wrangler dev
# Worker runs at http://127.0.0.1:8787
# Try: curl "http://127.0.0.1:8787/tasks?_start=0&_limit=10&_sort=id&_order=desc"
```

4. Deploy

```bash
wrangler deploy
# You’ll get a URL like https://mind-luster-api.your-subdomain.workers.dev
```

5. Point the frontend

- In your Netlify Site (mind-luster-kanban), set:
  - `NEXT_PUBLIC_API_BASE_URL` = your Workers URL (e.g., `https://mind-luster-api....workers.dev`)
- Redeploy the site.

## Importing Existing Data (optional)

For a quick start, create some tasks with POST requests, or write a small script to generate INSERTs from your `db.json` and pipe them through:

6. Seed demo tasks (optional)

```bash
# Load meaningful sample tasks so the UI looks populated
wrangler d1 execute mind_luster_db --file=./seeds.sql --remote
# Then browse: https://mind-luster-api....workers.dev/tasks?_start=0&_limit=20&_sort=order,id&_order=asc,desc
```

```bash
wrangler d1 execute mind_luster_db --file=insert.sql
```

## Notes

- CORS is `*` by default; lock it down by setting `ALLOW_ORIGIN` in `wrangler.toml` and checking it in `json()` helper if you need.
- The schema uses `id TEXT PRIMARY KEY`; ids are generated server-side as numeric-like strings to keep ordering logic simple.
- `order` is a REAL (float) field so you can insert between neighbors using fractional order values.

## Costs / Limits

- Cloudflare Workers Free: generous daily requests
- D1 Free: storage and query limits suitable for demos/dev

## Custom Domains

- You can add a custom domain to your Worker route in Cloudflare (optional). Netlify frontend can continue using the Workers URL or your custom domain.
