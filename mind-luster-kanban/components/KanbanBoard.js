"use client";
import { useMemo, useState } from "react";
import { Box, Container, Stack, Typography, Button } from "@mui/material";
import { COLUMNS } from "../lib/constants";
import Column from "./Column";
import SearchBar from "./SearchBar";
import TaskDialog from "./TaskDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTask } from "../lib/api";
import { useUIStore } from "../lib/store";
import { qk } from "../lib/queryKeys";

export default function KanbanBoard() {
  const qc = useQueryClient();
  const [activeTask, setActiveTask] = useState(null);
  const openCreate = useUIStore((s) => s.openCreate);
  const dialogKey = useUIStore((s) => s.dialogKey);
  const search = useUIStore((s) => s.search);
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || (navigator && navigator.maxTouchPoints > 0));

  const sensors = useSensors(
    // On touch devices, prefer a short press delay so scroll works naturally
    // and drag starts only after a brief hold. On desktop, use a small distance.
    useSensor(
      PointerSensor,
      isTouchDevice
        ? { activationConstraint: { delay: 180, tolerance: 8 } }
        : { activationConstraint: { distance: 6 } }
    ),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const updateMut = useMutation({
    mutationFn: ({ id, column, order }) => updateTask(id, { column, order }),
    onMutate: async ({ id, column, order }) => {
      // Optimistic update: update any cached pages containing the task
      await qc.cancelQueries(); // cancel any outgoing refetches
      const allQueries = qc.getQueryCache().getAll();
      const prev = allQueries.map((q) => ({
        key: q.queryKey,
        data: qc.getQueryData(q.queryKey),
      })); // store previous data for rollback
      allQueries.forEach((q) => {
        const data = qc.getQueryData(q.queryKey);
        if (data && Array.isArray(data.pages)) {
          const newPages = data.pages.map((page) =>
            page.map((item) =>
              item.id === id
                ? { ...item, column: column ?? item.column, order }
                : item
            )
          );
          qc.setQueryData(q.queryKey, { ...data, pages: newPages });
        }
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.prev?.forEach(({ key, data }) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries();
    },
  });

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          gap={2}
        >
          <Typography variant="h4" fontWeight={700}>
            Kanban Board
          </Typography>
          <Stack
            direction={{ xs: "column", md: "row" }}
            gap={1}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Box sx={{ minWidth: { md: 360 } }}>
              <SearchBar />
            </Box>
            <Button variant="contained" onClick={() => openCreate("backlog")}>
              Add Task
            </Button>
          </Stack>
        </Stack>
        <DndContext
          sensors={sensors}
          modifiers={[restrictToWindowEdges]}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={(e) =>
            setActiveTask(e.active.data.current?.task || null)
          }
          onDragEnd={(e) => {
            setActiveTask(null);
            const { active, over } = e;
            if (!active || !over) return;
            const task = active.data.current?.task;
            if (!task) return;

            // Helpers to read current column items from cache. the task lists are paginated, we need to aggregate all pages to get the full list of tasks in a column.
            const getColumnTasks = (colId) => {
              const data = qc.getQueryData(qk.column(colId, search));
              const pages = data?.pages || [];
              const map = new Map();
              for (const page of pages) {
                for (const it of page) {
                  if (!map.has(it.id)) map.set(it.id, it);
                }
              }
              const arr = Array.from(map.values());
              arr.sort((a, b) => {
                const ao = a.order;
                const bo = b.order;
                if (ao != null && bo != null) return ao - bo;
                if (ao != null) return -1;
                if (bo != null) return 1;
                const an = Number(a.id);
                const bn = Number(b.id);
                if (!Number.isNaN(an) && !Number.isNaN(bn)) return bn - an;
                return String(b.id).localeCompare(String(a.id));
              });
              return arr;
            };

            // Determine destination column: could be a task (sortable) or a column (droppable). when dragging a task, the drop target could either be another task (to reorder) or the column area itself (to move to end). We need to figure out which column the task is being dropped into.
            const overData = over.data?.current; // overData contains metadata about the drop target, including its type (task or column) and associated columnId if it's a task.
            const destColumn =
              overData?.type === "task"
                ? overData.columnId
                : overData?.type === "column"
                ? over.id
                : over.id;
            if (!destColumn) return;

            const srcColumn = task.column;
            const srcItems = getColumnTasks(srcColumn);
            const destItemsRaw = getColumnTasks(destColumn);

            // If reordering within the same column, remove the active from dest list before index calc. if we're moving the task within the same column, we need to exclude it from the destination list to accurately calculate its new position.
            const destItems =
              destColumn === srcColumn
                ? destItemsRaw.filter((it) => it.id !== task.id)
                : destItemsRaw;

            // Determine target index within destination. If hovering a task,
            // insert before or after it depending on the pointer position
            // relative to that task's vertical center.
            let toIndex;
            if (overData?.type === "task") {
              const overId = over.id;
              const overIdx = destItems.findIndex(
                (it) => String(it.id) === String(overId)
              );
              // Default to inserting before the hovered item if we can't compute geometry
              let insertAfter = false;
              const activeRect =
                e.active.rect.current.translated || e.active.rect.current;
              const overRect = e.over?.rect;
              if (activeRect && overRect) {
                const activeCenterY = activeRect.top + activeRect.height / 2;
                const overCenterY = overRect.top + overRect.height / 2;
                insertAfter = activeCenterY > overCenterY;
              }
              toIndex =
                (overIdx < 0 ? destItems.length : overIdx) +
                (insertAfter ? 1 : 0);
              // clamp
              if (toIndex < 0) toIndex = 0;
              if (toIndex > destItems.length) toIndex = destItems.length;
            } else {
              // dropped over the column area -> append to end.
              toIndex = destItems.length;
            }

            // No-op: same column and position unchanged (approx)
            if (
              destColumn === srcColumn &&
              overData?.type === "task" &&
              String(over.id) === String(active.id)
            ) {
              return; // dropped onto itself in same column
            }

            // Compute fractional order between neighbors at toIndex.
            const prev = destItems[toIndex - 1];
            const next = destItems[toIndex];
            const between = (a, b) => {
              const ao = a?.order;
              const bo = b?.order;
              if (ao != null && bo != null) return (ao + bo) / 2;
              if (ao != null) return ao + 1024;
              if (bo != null) return bo - 1024;
              return Date.now();
            };
            const newOrder = between(prev, next);

            updateMut.mutate({
              id: task.id,
              column: destColumn,
              order: newOrder,
            });
          }}
          // Use pointer-based collision detection so when dragging from one
          // column to another the pointer position determines the target
          // task/slot. This allows dropping between items across columns
          // (instead of falling back to a center-based heuristic).
          collisionDetection={pointerWithin}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {COLUMNS.map((col) => (
              <Column key={col.id} columnId={col.id} label={col.label} />
            ))}
          </Box>
          <DragOverlay
            dropAnimation={{
              duration: 220,
              easing: "cubic-bezier(0.2, 0, 0, 1)",
              dragSourceOpacity: 0.25,
            }}
          >
            {activeTask ? (
              <Box sx={{ width: 320 }}>
                {/* simple overlay mimic */}
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: 8,
                  }}
                >
                  <Typography variant="subtitle1">
                    {activeTask.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeTask.description}
                  </Typography>
                </Box>
              </Box>
            ) : null}
          </DragOverlay>
        </DndContext>
      </Stack>
      <TaskDialog key={dialogKey} />
      <DeleteConfirmDialog />
    </Container>
  );
}
