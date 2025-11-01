-- D1 schema for tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  column TEXT NOT NULL,
  "order" REAL
);

-- Helpful index when filtering by column
CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column);

-- Optional: seed example
-- INSERT INTO tasks (id, title, description, column, "order") VALUES ('1','Sample','First task','backlog', 1000);
