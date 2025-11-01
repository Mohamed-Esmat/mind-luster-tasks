# mind-luster (Projects Workspace)

This repository contains two small projects:

1. Kanban‑style To‑Do Dashboard (`mind-luster-kanban/`)

   - Next.js + React 19 + MUI + dnd‑kit + React Query + Zustand
   - Local mocked REST API with `json-server`
   - CRUD, precise cross‑column drag & drop, infinite scroll, search

2. Bonus jQuery Dynamic List (`bonus-jquery/`)
   - Simple jQuery app with add/delete, animations, and localStorage persistence

---

## Quick Links

- Kanban App: `mind-luster-kanban`
- jQuery App: `bonus-jquery`

Demo links (replace with your deployments):

- Kanban Live: 'mind-luster-kanban-esmat.netlify.app/'
- jQuery Live: bonus-jquery-esmat.netlify.app/`

---

## 1) Kanban‑style To‑Do Dashboard

### Overview

An interactive Kanban board with four columns (Backlog, In Progress, Review, Done). Built using modern React tooling, it supports:

- Create, edit, delete tasks
- Drag & drop between columns with exact placement
- Infinite scrolling per column
- Search with debounced input
- Caching/invalidations with optimistic updates

### Tech Stack

- Next.js 16 (App Router), React 19
- Material UI 6
- dnd‑kit (core + sortable + overlay)
- @tanstack/react-query v5
- Zustand for small UI state
- axios
- json‑server for the API (reads `db.json`)

### How to run (development)

```bash
cd mind-luster-kanban
npm install
npm run dev:all    # runs json-server (:4000) and Next (:3000)
# App: http://localhost:3000    API: http://localhost:4000
```

Run separately if desired:

```bash
npm run server   # json-server on :4000
npm run dev      # Next dev on :3000
```

Build/production:

```bash
npm run build
npm start
```

Optional env var:

- `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:4000`)

### Architecture & Logic

- React Query manages server state; query keys are scoped by column and search (`['column', columnId, search]`).
- Infinite scroll: `useInfiniteQuery` with offset pagination using `?_start`/`?_limit`. IntersectionObserver triggers fetching more.
- Search: if server doesn't filter as expected, a client-side filter (title/description) is applied before display.
- Drag & drop: pointer-based collision detection guides precise placement. On drop, we calculate whether to insert before/after the hovered card by comparing vertical centers, then compute a fractional `order` between neighbors and send an `updateTask(id, { column, order })`.
- Optimistic updates: when dragging, we update any cached pages containing the task; after mutation settles, we invalidate queries to sync.

### API

- Base: `http://localhost:4000`
- Collection: `/tasks`
- Supported query params: `_start`, `_limit`, `_sort`, `_order`, and field filters like `?column=backlog`.
- Tip: prefer `_start/_limit` over `_page/_limit` due to json‑server quirks.

### Troubleshooting

- If tasks don’t load, ensure `npm run server` is running or adjust `NEXT_PUBLIC_API_BASE_URL`.
- If drag feels inaccurate, ensure you hover above/below the target card; pointer‑based collision is enabled. We can further tune onDragOver if needed.

---

## 2) Bonus jQuery Dynamic List

### Overview

A small jQuery app that adds and removes list items with tiny animations and persists items to localStorage.

### How to run

Option 1: open directly

- Open `bonus-jquery/index.html` in your browser

Option 2: serve locally

```bash
cd bonus-jquery
npx serve -p 5173 .
# http://localhost:5173
```

### Logic

- Input validation with a small fading error message.
- Add: creates a new `<li>` with text and a Delete button; optional fade-in animation.
- Delete: fade out then remove; storage sync after removal.
- Storage: items are read from and written to `localStorage` under the key `bonus_jquery_items_v1`. On load, items are bootstrapped without animations or extra writes.

### Extend

- Edit-in-place, clear-all, drag-reorder (jQuery UI), theming via stored preference.

---

## Repository Structure

- `mind-luster-kanban/` — Next.js Kanban app
- `bonus-jquery/` — standalone jQuery demo

Each subfolder has its own README with deeper details.

---

## Contributing / Next Steps

- Feel free to open issues/PRs to add tests, improve accessibility, or expand features (e.g., persisted reordering across pages, batch operations, dark mode).
