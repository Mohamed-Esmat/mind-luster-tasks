"use client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";
import { COLUMNS } from "../lib/constants";
import { useUIStore } from "../lib/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask, updateTask } from "../lib/api";
import { useState } from "react";

export default function TaskDialog() {
  const dialog = useUIStore((s) => s.dialog);
  const close = useUIStore((s) => s.closeDialog);
  const qc = useQueryClient();
  const [form, setForm] = useState(
    () => dialog.task || { title: "", description: "", column: "backlog" }
  );

  const createMut = useMutation({
    mutationFn: createTask,
    onSuccess: (task) => {
      // invalidate column list
      qc.invalidateQueries();
      close();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, updates }) => updateTask(id, updates),
    onSuccess: () => {
      qc.invalidateQueries();
      close();
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.title?.trim()) return; // minimal validation
    if (dialog.mode === "create") {
      createMut.mutate({
        title: form.title.trim(),
        description: form.description?.trim() || "",
        column: form.column || "backlog",
      });
    } else if (dialog.mode === "edit") {
      const { id, ...rest } = form;
      updateMut.mutate({ id, updates: rest });
    }
  };

  const dialogKey = useUIStore((s) => s.dialogKey);

  return (
    <Dialog open={dialog.open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>
        {dialog.mode === "edit" ? "Edit Task" : "New Task"}
      </DialogTitle>
      <form
        onSubmit={onSubmit}
        key={`${dialogKey}-${dialog.mode}-${dialog.task?.id ?? "new"}`}
      >
        <DialogContent>
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              multiline
              minRows={3}
            />
            <TextField
              select
              label="Column"
              value={form.column}
              onChange={(e) => setForm({ ...form, column: e.target.value })}
            >
              {COLUMNS.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMut.isLoading || updateMut.isLoading}
          >
            {dialog.mode === "edit" ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
