import axios from "axios";
import { API_BASE_URL, PAGE_SIZE } from "./constants";

export const client = axios.create({ baseURL: API_BASE_URL });

// Task shape: { id, title, description, column }

export async function listTasks({ column, page = 1, search = "" }) {
  const params = new URLSearchParams();
  if (column) params.set("column", column);
  // json-server v1 may ignore `q`;
  // use offset-based pagination (_start) for consistent slices
  const start = (Number(page) - 1) * Number(PAGE_SIZE);
  params.set("_start", String(start));
  params.set("_limit", String(PAGE_SIZE));
  // Sort by manual order first, then id desc as fallback
  params.set("_sort", "order,id");
  params.set("_order", "asc,desc");
  const { data } = await client.get(`/tasks?${params.toString()}`);
  if (search) {
    const s = search.toLowerCase();
    const filtered = data.filter(
      // return data.filter(
      (t) =>
        String(t.title || "")
          .toLowerCase()
          .includes(s) ||
        String(t.description || "")
          .toLowerCase()
          .includes(s)
    );
    // Keep the same ordering client-side
    return filtered.sort((a, b) => {
      const ao = a.order;
      const bo = b.order;
      if (ao != null && bo != null) return ao - bo;
      if (ao != null) return -1;
      if (bo != null) return 1;
      // fallback: newer first if numeric ids, otherwise string compare desc
      const an = Number(a.id);
      const bn = Number(b.id);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return bn - an;
      return String(b.id).localeCompare(String(a.id));
    }); // This logic ensures that the tasks are sorted first by their manual order (the 'order' field) in ascending order. If two tasks have the same 'order' value or if one of them doesn't have an 'order' value, it falls back to sorting by their IDs in descending order. This way, tasks with a defined order appear first, and among those with the same order, newer tasks (with higher IDs) appear before older ones. This is important for maintaining a consistent and expected order of tasks when filtering by search terms.
  }
  return data;
}

export async function createTask(payload) {
  const { data } = await client.post("/tasks", payload);
  return data;
}

export async function updateTask(id, updates) {
  const { data } = await client.patch(`/tasks/${id}`, updates);
  return data;
}

export async function deleteTask(id) {
  await client.delete(`/tasks/${id}`);
  return id;
}
