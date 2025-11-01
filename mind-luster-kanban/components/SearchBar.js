"use client";
import { useMemo, useState } from "react";
import debounce from "lodash.debounce";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useUIStore } from "../lib/store";

export default function SearchBar() {
  const setSearch = useUIStore((s) => s.setSearch);
  const [local, setLocal] = useState("");

  const onDebounced = useMemo(
    () => debounce((v) => setSearch(v), 300), // debounce the search input to avoid excessive updates.
    [setSearch]
  );

  return (
    <TextField
      fullWidth
      size="small"
      placeholder="Search by title or description..."
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        onDebounced(e.target.value);
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
}
