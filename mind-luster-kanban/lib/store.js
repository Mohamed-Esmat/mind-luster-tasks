import { create } from "zustand";

export const useUIStore = create((set) => ({
  search: "",
  setSearch: (search) => set({ search }),
  dialogKey: 0,
  dialog: { open: false, mode: "create", task: null },
  openCreate: (column = "backlog") =>
    set((s) => ({
      dialogKey: s.dialogKey + 1,
      dialog: {
        open: true,
        mode: "create",
        task: { title: "", description: "", column },
      },
    })),
  openEdit: (task) =>
    set((s) => ({
      dialogKey: s.dialogKey + 1,
      dialog: { open: true, mode: "edit", task },
    })),
  closeDialog: () =>
    set({ dialog: { open: false, mode: "create", task: null } }),
  deleteConfirm: { open: false, task: null },
  confirmDelete: (task) => set({ deleteConfirm: { open: true, task } }),
  closeDelete: () => set({ deleteConfirm: { open: false, task: null } }),
}));
