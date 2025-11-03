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
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
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

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 220ms cubic-bezier(0.2, 0, 0, 1)",
    // cursor: isDesktop ? (isDragging ? "grabbing" : "grab") : "default",
    willChange: "transform",
    userSelect: "none",
    WebkitUserSelect: "none",
    WebkitTapHighlightColor: "transparent",
    WebkitTouchCallout: "none",
    touchAction: isDragging ? "none" : undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      {...(isDesktop ? { ...attributes, ...listeners } : {})}
      variant="outlined"
      sx={{
        mb: 1,
        boxShadow: isDragging ? 4 : 0,
        opacity: isDragging ? 0.9 : 1,
        cursor: isDesktop ? (isDragging ? "grabbing" : "grab") : "default",
      }}
      style={style}
    >
      <CardHeader
        avatar={
          isDesktop ? null : (
            <IconButton
              aria-label="drag"
              size="small"
              sx={{ cursor: isDragging ? "grabbing" : "grab", mr: 0.5 }}
              {...(!isDesktop ? { ...attributes, ...listeners } : {})}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          )
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
