// Cloudflare Worker with D1 for /tasks CRUD
// Free to deploy; no card required on Cloudflare free plan.

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type,authorization",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    },
    ...init,
  });

const noContent = () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type,authorization",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    },
  });

const bad = (message, status = 400) => json({ error: message }, { status });

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") return noContent();

      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, "");

      // Ensure schema exists (idempotent). This avoids "no such table: tasks"
      // on first deploy if migrations haven't been executed yet.
      if (env.DB) {
        await ensureSchema(env);
      }

      // Health check
      if (path === "/health") {
        if (!env.DB) return bad("D1 binding DB is missing", 500);
        const row = await env.DB.prepare("SELECT 1 as ok").first();
        return json({ ok: row ? row.ok : 0 });
      }

      // /tasks and /tasks/:id
      if (path === "/tasks" && request.method === "GET") {
        return listTasks(url, env);
      }
      if (path === "/tasks" && request.method === "POST") {
        return createTask(request, env);
      }
      const match = path.match(/^\/tasks\/([^/]+)$/);
      if (match) {
        const id = decodeURIComponent(match[1]);
        if (request.method === "PATCH") return updateTask(id, request, env);
        if (request.method === "DELETE") return deleteTask(id, env);
        if (request.method === "GET") return getTask(id, env);
      }

      return bad("Not found", 404);
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      return json({ error: msg }, { status: 500 });
    }
  },
};

async function ensureSchema(env) {
  // Create table and index if they don't exist. Using batch for fewer roundtrips.
  try {
    await env.DB.batch([
      env.DB.prepare(
        'CREATE TABLE IF NOT EXISTS tasks (\n          id TEXT PRIMARY KEY,\n          title TEXT NOT NULL,\n          description TEXT DEFAULT "",\n          "column" TEXT NOT NULL,\n          "order" REAL\n        )'
      ),
      env.DB.prepare(
        'CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks("column")'
      ),
    ]);
  } catch (e) {
    // Surface schema errors in /health and general calls
    throw new Error(`Schema init failed: ${e && e.message ? e.message : e}`);
  }
}

async function listTasks(url, env) {
  const column = url.searchParams.get("column");
  const q = url.searchParams.get("q");
  const start = parseInt(url.searchParams.get("_start") || "0", 10);
  const limit = parseInt(url.searchParams.get("_limit") || "20", 10);
  // Support multi-field sorting: e.g., _sort=order,id&_order=asc,desc
  const sortParam = (url.searchParams.get("_sort") || "id")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const orderParam = (url.searchParams.get("_order") || "desc")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  // Validate fields and build ORDER BY list
  const allowed = new Set(["id", "order"]);
  if (!sortParam.length) sortParam.push("id");
  for (const s of sortParam) {
    if (!allowed.has(s)) return bad("Invalid _sort");
  }
  const orderBy = sortParam
    .map((field, i) => {
      const dir = orderParam[i] || orderParam[orderParam.length - 1] || "DESC";
      const safeDir = dir === "ASC" || dir === "DESC" ? dir : "DESC";
      const sqlField = field === "id" ? "CAST(id AS INTEGER)" : '"order"';
      return `${sqlField} ${safeDir}`;
    })
    .join(", ");

  let sql = `SELECT id, title, description, "column", "order" FROM tasks`;
  const where = [];
  const params = [];

  if (column) {
    where.push(`"column" = ?`);
    params.push(column);
  }
  if (q) {
    where.push(`(title LIKE ? OR description LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like);
  }
  if (where.length) sql += ` WHERE ` + where.join(" AND ");

  sql += ` ORDER BY ${orderBy}`;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(limit, start);

  const res = await env.DB.prepare(sql)
    .bind(...params)
    .all();
  return json(res.results || []);
}

async function getTask(id, env) {
  const res = await env.DB.prepare(
    'SELECT id, title, description, "column", "order" FROM tasks WHERE id = ?'
  )
    .bind(id)
    .first();
  if (!res) return bad("Not found", 404);
  return json(res);
}

async function createTask(request, env) {
  const body = await readJson(request);
  if (!body || !body.title) return bad("title is required");
  const id = genId();
  const title = String(body.title);
  const description = body.description ? String(body.description) : "";
  const column = body.column ? String(body.column) : "backlog";
  const order = body.order != null ? Number(body.order) : Date.now();

  await env.DB.prepare(
    'INSERT INTO tasks (id, title, description, "column", "order") VALUES (?, ?, ?, ?, ?)'
  )
    .bind(id, title, description, column, order)
    .run();

  return json({ id, title, description, column, order }, { status: 201 });
}

async function updateTask(id, request, env) {
  const existing = await env.DB.prepare("SELECT id FROM tasks WHERE id = ?")
    .bind(id)
    .first();
  if (!existing) return bad("Not found", 404);

  const body = await readJson(request);
  if (!body) return bad("Invalid JSON");

  const fields = [];
  const params = [];
  if (body.title != null) {
    fields.push("title = ?");
    params.push(String(body.title));
  }
  if (body.description != null) {
    fields.push("description = ?");
    params.push(String(body.description));
  }
  if (body.column != null) {
    fields.push('"column" = ?');
    params.push(String(body.column));
  }
  if (body.order != null) {
    fields.push('"order" = ?');
    params.push(Number(body.order));
  }

  if (!fields.length) return noContent();

  params.push(id);
  const sql = `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`;
  await env.DB.prepare(sql)
    .bind(...params)
    .run();

  return noContent();
}

async function deleteTask(id, env) {
  await env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
  return noContent();
}

function genId() {
  // Numeric-like IDs sort correctly when cast; keep as string to match existing app expectations
  return String(Math.floor(Date.now() + Math.random() * 1000));
}

async function readJson(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
