"use client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useUIStore } from "../lib/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTask } from "../lib/api";

export default function DeleteConfirmDialog() {
  const { open, task } = useUIStore((s) => s.deleteConfirm);
  const close = useUIStore((s) => s.closeDelete);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      qc.invalidateQueries();
      close();
    },
  });

  return (
    <Dialog open={open} onClose={close}>
      <DialogTitle>Delete Task</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to delete: {task?.title}?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => mut.mutate(task.id)}
          disabled={mut.isLoading}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
