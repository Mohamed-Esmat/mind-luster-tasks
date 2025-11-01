"use client";
import { useMemo, useRef, useEffect } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { listTasks } from "../lib/api";
import { qk } from "../lib/queryKeys";
import { PAGE_SIZE } from "../lib/constants";
import TaskCard from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useUIStore } from "../lib/store";

const headerColor = (id) => {
  switch (id) {
    case "backlog":
      return "#3b82f6"; // blue
    case "in-progress":
      return "#f59e0b"; // amber
    case "review":
      return "#a855f7"; // violet
    case "done":
      return "#22c55e"; // green
    default:
      return "#6b7280";
  }
};

export default function Column({ columnId, label }) {
  const search = useUIStore((s) => s.search);
  const qc = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: qk.column(columnId, search),
    queryFn: ({ pageParam = 1 }) =>
      listTasks({ column: columnId, page: pageParam, search }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    initialPageParam: 1,
  });

  const tasks = useMemo(() => {
    const pages = data?.pages || [];
    const map = new Map();
    for (const page of pages) {
      for (const item of page) {
        if (!map.has(item.id)) map.set(item.id, item);
      }
    }
    const arr = Array.from(map.values());
    // Sort by custom order (asc) then by id (desc) as a stable fallback
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
  }, [data]);

  // Infinite scroll sentinel
  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        });
      },
      { root: el.parentElement, rootMargin: "0px", threshold: 1.0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, data]);

  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: { type: "column", columnId },
  });

  return (
    <Stack spacing={1} sx={{ minWidth: 0 }}>
      <Box
        sx={{
          bgcolor: headerColor(columnId),
          background: `linear-gradient(180deg, ${headerColor(
            columnId
          )} 0%, ${headerColor(columnId)}CC 100%)`,
          color: "#fff",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          px: 2,
          py: 1.2,
          fontWeight: 700,
          boxShadow: "0 2px 6px rgba(9,30,66,0.2)",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {label}
        </Typography>
      </Box>

      <Box
        ref={setNodeRef}
        className="kanban-scroll"
        sx={{
          borderRadius: 1,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          minHeight: 300,
          bgcolor: isOver ? "action.hover" : "background.paper",
          p: 1,
          border: "1px solid",
          borderColor: "divider",
          boxShadow:
            "0 1px 3px rgba(9,30,66,0.12), 0 1px 2px rgba(9,30,66,0.24)",
          overflowY: "auto",
          height: "calc(100vh - 260px)",
        }}
      >
        {isLoading && (
          <Stack alignItems="center" py={2}>
            <CircularProgress size={20} />
          </Stack>
        )}
        {isError && (
          <Typography color="error">
            {error?.message || "Error loading tasks"}
          </Typography>
        )}

        <SortableContext
          items={tasks.map((t) => String(t.id))}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} columnId={columnId} />
          ))}
        </SortableContext>

        <Box
          ref={sentinelRef}
          sx={{ height: 24, width: "100%", bgcolor: "background.paper" }}
        />
        {isFetchingNextPage && (
          <Stack alignItems="center" py={1}>
            <CircularProgress size={16} />
          </Stack>
        )}
        {!isLoading && tasks.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            py={2}
          >
            No tasks
          </Typography>
        )}
      </Box>
    </Stack>
  );
}
