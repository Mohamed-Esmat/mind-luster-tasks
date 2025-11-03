"use client";
import {
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useUIStore } from "../lib/store";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function TaskCard({ task, columnId }) {
  const openEdit = useUIStore((s) => s.openEdit);
  const confirmDelete = useUIStore((s) => s.confirmDelete);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(task.id),
    data: { type: "task", task, columnId },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
    cursor: "grab",
    willChange: "transform",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTapHighlightColor: "transparent",
    WebkitTouchCallout: "none",
    // Prevent the browser from hijacking touch gestures during an active drag
    touchAction: isDragging ? "none" : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      variant="outlined"
      sx={{
        mb: 1.25,
        opacity: isDragging ? 0.3 : 1,
        borderRadius: 1.5,
        boxShadow: "0 3px 10px rgba(9,30,66,0.1)",
        transition:
          "box-shadow 220ms cubic-bezier(0.2, 0, 0, 1), transform 220ms cubic-bezier(0.2, 0, 0, 1)",
        "&:hover": {
          boxShadow: "0 6px 16px rgba(9,30,66,0.15)",
          transform: "translateY(-1px)",
        },
        ...(isDragging ? { zIndex: 1300 } : null),
      }}
      style={style}
    >
      <CardHeader
        avatar={
          <IconButton
            aria-label="drag"
            size="small"
            sx={{ cursor: isDragging ? "grabbing" : "grab", mr: 0.5 }}
            {...attributes}
            {...listeners}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        }
        title={task.title}
        titleTypographyProps={{ variant: "subtitle1" }}
        action={
          <>
            <IconButton aria-label="edit" onClick={() => openEdit(task)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton aria-label="delete" onClick={() => confirmDelete(task)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </>
        }
        sx={{ pb: 0.5 }}
      />
      <CardContent sx={{ pt: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {task.description}
        </Typography>
      </CardContent>
    </Card>
  );
}
