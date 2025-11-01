## Kanban-style To‑Do Dashboard (Next.js)

An interactive Kanban board with four columns (Backlog, In Progress, Review, Done) built with Next.js (App Router), Material UI, dnd‑kit, React Query, and Zustand. It supports CRUD, cross‑column drag and drop with precise placement, infinite scroll per column, debounced search, optimistic updates, and a lightweight mocked REST API powered by json‑server.

### Stack

- Next.js 16 (App Router) and React 19
- Material UI 6 for the UI and theming
- dnd‑kit for drag and drop (sortable + overlay)
- @tanstack/react-query v5 for data fetching and caching
- Zustand for local UI state (search value, dialogs)
- axios for HTTP calls
- json‑server for a local REST API (db.json)

---

## Quickstart

1) Install dependencies

```bash
npm install
```

2) Start both servers (Next.js and json‑server)

```bash
npm run dev:all
```

- App → http://localhost:3000
- API → http://localhost:4000 (e.g., http://localhost:4000/tasks)

Alternative (run separately):

```bash
npm run server   # json-server on :4000 (reads db.json)
npm run dev      # Next.js app on :3000
```

Build and production:

```bash
npm run build
npm start
```

Optional env var:

- `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:4000`)

---

## Features in Detail

### Columns and Tasks
- Columns: `backlog`, `in-progress`, `review`, `done`.
- Each task has: `id`, `title`, `description`, `column` and optional `order`.

Example task:

```json
{
  "id": 101,
  "title": "Design homepage",
  "description": "Include hero section",
  "column": "backlog",
  "order": 1730412345
}
```

### CRUD
- Create/Edit via MUI dialogs.
- Delete with confirmation.
- React Query invalidates cache on successful mutations.

### Drag & Drop (precise placement)
- dnd‑kit sensors (Pointer + Keyboard) + DragOverlay.
- Collision detection uses pointer‑based strategy so the pointer position determines the target slot between items, even across columns.
- When you drop, we compute the destination index relative to the hovered item using the vertical centers of the dragged and hovered cards (insert before/after accordingly).
- We persist ordering via a fractional `order` value computed between neighbors (prev/next). This avoids renumbering the entire column on each drop.
- Optimistic updates apply immediately; server confirmation follows via `updateTask`.

### Infinite Scroll per Column
- React Query `useInfiniteQuery` per column.
- Offset pagination with `?_start=N&_limit=PAGE_SIZE` (json‑server). This avoids a json‑server quirk where `_page` could repeat results.
- IntersectionObserver sentinel at the bottom of each column triggers `fetchNextPage`.
- Client‑side de‑duplication by `id` safeguards against overlaps.

### Search
- Debounced input (Zustand stores the value).
- Because some json‑server builds ignore `q`, we apply a client‑side fallback filter (title/description contains query). Query value participates in the React Query key so caches are isolated per search.

### Caching & Optimistic Updates
- Query keys: `['column', columnId, search]`.
- On drag, we optimistically update any cached page containing the task (column + order), then invalidate after the mutation settles.

---

## File Structure

- `app/` — Next.js App Router entry points and layout
- `components/` — Kanban UI (Board, Column, TaskCard, dialogs, SearchBar)
- `lib/api.js` — axios client + helpers (list/create/update/delete tasks)
- `lib/constants.js` — columns list, page size, base URL
- `lib/queryKeys.js` — React Query keys
- `lib/store.js` — Zustand store (search, dialogs)
- `db.json` — json‑server data source

---

## API Notes (json‑server)

- Base: `http://localhost:4000`
- Tasks collection: `GET /tasks` supports `?_start`, `?_limit`, `_sort`, `_order`.
- Known quirk: `_page` can return the same slice; prefer `_start`.
- Example requests:

```bash
curl "http://localhost:4000/tasks?_start=0&_limit=10&_sort=id&_order=desc"
curl "http://localhost:4000/tasks?column=backlog&_start=0&_limit=10"
```

---

## Troubleshooting

- No tasks loading: ensure json‑server is running on :4000 and CORS is allowed (json‑server default).
- Drag feels off: make sure you aren’t dropping exactly onto the dragged item; pointer‑based collision is enabled. If needed, we can further tune onDragOver for your layout.
- Duplicate tasks while scrolling: pagination uses `_start/_limit` and de‑dupe; verify your `db.json` has unique IDs.

---

## Demo

- Live App: <YOUR_KANBAN_DEMO_URL>
- API (if hosted separately): <YOUR_JSON_SERVER_URL>

Replace placeholders with your deployment links (e.g., Vercel for the app, Render/Heroku for json‑server).

---

## Roadmap / Ideas

- Drag re‑ordering with batch renumbering when many fractional inserts have occurred
- Keyboard shortcuts
- Tests (unit with Vitest, e2e with Playwright)
- Accessibility polish (drag announcements, focus traps)
