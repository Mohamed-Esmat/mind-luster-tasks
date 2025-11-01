// Cloudflare Worker with D1 for /tasks CRUD
// Free to deploy; no card required on Cloudflare free plan.

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type,authorization',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    },
    ...init,
  });

const noContent = () =>
  new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type,authorization',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    },
  });

const bad = (message, status = 400) => json({ error: message }, { status });

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return noContent();

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');

    // /tasks and /tasks/:id
    if (path === '/tasks' && request.method === 'GET') {
      return listTasks(url, env);
    }
    if (path === '/tasks' && request.method === 'POST') {
      return createTask(request, env);
    }
    const match = path.match(/^\/tasks\/([^/]+)$/);
    if (match) {
      const id = decodeURIComponent(match[1]);
      if (request.method === 'PATCH') return updateTask(id, request, env);
      if (request.method === 'DELETE') return deleteTask(id, env);
      if (request.method === 'GET') return getTask(id, env);
    }

    return bad('Not found', 404);
  },
};

async function listTasks(url, env) {
  const column = url.searchParams.get('column');
  const q = url.searchParams.get('q');
  const start = parseInt(url.searchParams.get('_start') || '0', 10);
  const limit = parseInt(url.searchParams.get('_limit') || '20', 10);
  const sort = url.searchParams.get('_sort') || 'id'; // 'id' or 'order'
  const order = (url.searchParams.get('_order') || 'desc').toUpperCase(); // ASC|DESC

  if (!['id', 'order'].includes(sort)) return bad('Invalid _sort');
  if (!['ASC', 'DESC'].includes(order)) return bad('Invalid _order');

  let sql = `SELECT id, title, description, column, "order" FROM tasks`;
  const where = [];
  const params = [];

  if (column) {
    where.push(`column = ?`);
    params.push(column);
  }
  if (q) {
    where.push(`(title LIKE ? OR description LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like);
  }
  if (where.length) sql += ` WHERE ` + where.join(' AND ');

  sql += ` ORDER BY ${sort === 'id' ? 'CAST(id AS INTEGER)' : '"order"'} ${order}`;
  sql += ` LIMIT ? OFFSET ?`;
  params.push(limit, start);

  const res = await env.DB.prepare(sql).bind(...params).all();
  return json(res.results || []);
}

async function getTask(id, env) {
  const res = await env.DB.prepare(
    'SELECT id, title, description, column, "order" FROM tasks WHERE id = ?'
  ).bind(id).first();
  if (!res) return bad('Not found', 404);
  return json(res);
}

async function createTask(request, env) {
  const body = await readJson(request);
  if (!body || !body.title) return bad('title is required');
  const id = genId();
  const title = String(body.title);
  const description = body.description ? String(body.description) : '';
  const column = body.column ? String(body.column) : 'backlog';
  const order = body.order != null ? Number(body.order) : Date.now();

  await env.DB.prepare(
    'INSERT INTO tasks (id, title, description, column, "order") VALUES (?, ?, ?, ?, ?)'
  ).bind(id, title, description, column, order).run();

  return json({ id, title, description, column, order }, { status: 201 });
}

async function updateTask(id, request, env) {
  const existing = await env.DB.prepare(
    'SELECT id FROM tasks WHERE id = ?'
  ).bind(id).first();
  if (!existing) return bad('Not found', 404);

  const body = await readJson(request);
  if (!body) return bad('Invalid JSON');

  const fields = [];
  const params = [];
  if (body.title != null) { fields.push('title = ?'); params.push(String(body.title)); }
  if (body.description != null) { fields.push('description = ?'); params.push(String(body.description)); }
  if (body.column != null) { fields.push('column = ?'); params.push(String(body.column)); }
  if (body.order != null) { fields.push('"order" = ?'); params.push(Number(body.order)); }

  if (!fields.length) return noContent();

  params.push(id);
  const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
  await env.DB.prepare(sql).bind(...params).run();

  return noContent();
}

async function deleteTask(id, env) {
  await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
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
