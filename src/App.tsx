
import { useMemo, useState } from "react";
import type { PaletteMode } from "@mui/material";

import {
  CssBaseline,
  ThemeProvider,
} from "@mui/material";

import {
  BrowserRouter,
} from "react-router-dom";

import { createAppTheme } from "./theme/appTheme";
import AppRoutes from "@/AppRoutes";

// ============================================================
// Theme
// ============================================================

function getInitialMode(): PaletteMode {
  const stored = localStorage.getItem("candidate-theme");

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
}



// ============================================================
// Application
// ============================================================



export default function App() {
  const [mode, setMode] = useState<PaletteMode>(
      getInitialMode
  );

  const theme = useMemo(
      () => createAppTheme(mode),
      [mode]
  );

  const toggleMode = () => {
    setMode((previous) => {
      const next = previous === "light"
          ? "dark"
          : "light";

      localStorage.setItem("candidate-theme", next);

      return next;
    });
  };

  return (
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <BrowserRouter>
          <AppRoutes toggleMode={toggleMode} />
        </BrowserRouter>
      </ThemeProvider>
  );
}
