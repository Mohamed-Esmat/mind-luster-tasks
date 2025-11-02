-- Meaningful demo tasks for the Kanban board
-- Columns: backlog | in-progress | review | done
-- Order: smaller numbers appear first (ascending)

DELETE FROM tasks;

-- Backlog
INSERT INTO tasks (id, title, description, "column", "order") VALUES
('1001', 'Project kickoff & scope', 'Define success metrics, risks, and initial milestones.', 'backlog', 1000),
('1002', 'Brand palette & typography', 'Choose colors, typography scale, and UI tokens.', 'backlog', 2000),
('1003', 'Auth UX wireframes', 'Sketch login, signup, and reset flows.', 'backlog', 3000);

-- In Progress
INSERT INTO tasks (id, title, description, "column", "order") VALUES
('2001', 'Kanban board layout', 'Implement 4 columns with responsive grid and basic styles.', 'in-progress', 1000),
('2002', 'Drag & drop polish', 'Tune pointer-based collision and drop animations.', 'in-progress', 2000),
('2003', 'Cloudflare D1 API', 'Deploy Workers + D1 with /tasks CRUD and CORS.', 'in-progress', 3000);

-- Review
INSERT INTO tasks (id, title, description, "column", "order") VALUES
('3001', 'Infinite scroll UX', 'Check sentinel behavior and loading spinners per column.', 'review', 1000),
('3002', 'Search relevance', 'Verify client-side filter matches titles/descriptions.', 'review', 2000);

-- Done
INSERT INTO tasks (id, title, description, "column", "order") VALUES
('4001', 'Project skeleton', 'Next.js app, MUI theme, state & query providers.', 'done', 1000),
('4002', 'CRUD dialogs', 'Create/Edit with validation and delete confirmation.', 'done', 2000),
('4003', 'Local dev API', 'json-server with mock data and scripts.', 'done', 3000);
