"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { useState } from "react";

export default function Providers({ children }) {
  const [client] = useState(() => new QueryClient());
  const theme = createTheme({
    cssVariables: true,
    palette: {
      mode: "light",
      primary: { main: "#0052CC" },
      secondary: { main: "#6554C0" },
      background: { default: "#f4f5f7", paper: "#ffffff" },
      text: { primary: "#172B4D", secondary: "#5E6C84" },
    },
    typography: {
      fontFamily: "Inter, var(--font-geist-sans), system-ui, Arial",
    },
    shape: { borderRadius: 10 },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
          rounded: { borderRadius: 10 },
          elevation1: {
            boxShadow:
              "0 1px 3px rgba(9,30,66,0.12), 0 1px 2px rgba(9,30,66,0.24)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            boxShadow:
              "0 1px 3px rgba(9,30,66,0.12), 0 1px 2px rgba(9,30,66,0.24)",
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 12 } },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined" },
      },
    },
  });

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
