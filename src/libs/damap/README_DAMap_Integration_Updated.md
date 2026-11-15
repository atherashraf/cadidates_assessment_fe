# DAMap Library — Installation and Integration Guide

`damap-lib` is the reusable React, TypeScript, OpenLayers, GIS, authentication, API, and UI library developed within **DAMap UI**. This README explains how to integrate it into another **React + Vite** application, initialize it before any DAMap service is used, and maintain its source with Git subtree.

> **Integration modes are different.** If you copy DAMap source into `src/libs/damap`, use the `@damap/...` alias. If you install DAMap as an npm-compatible package, use `damap` only when that package's `exports` and build setup support the imported entry point. Do not mix imports from separate copies of the library: initialization and authentication must share the same module instance.

## Contents

1. [Prerequisites](#prerequisites)
2. [Choose an installation method](#choose-an-installation-method)
3. [Configure Vite and TypeScript](#configure-vite-and-typescript-for-source-integration)
4. [Configure environment variables](#configure-environment-variables)
5. [Initialize DAMap](#initialize-damap-before-react-renders)
6. [Scaffold a new application (theme, routes, layout)](#scaffold-a-new-application-theme-routes-layout)
7. [Verify and troubleshoot](#verify-the-integration)
8. [API usage reference](#-map-api-and-application-api)
9. [Maintaining the library](#maintaining-the-library-with-git-subtree)

## Prerequisites

- A React + TypeScript + Vite application.
- Access to the `damap-lib` repository and its required dependencies.
- A working backend URL/port for DAMap authentication and GIS requests.
- A configured TypeScript `@/` alias if the application uses imports such as `@/pages/LoginPage`.

Install the dependencies declared by your DAMap version. For MUI-based applications using the default Emotion engine, ensure Emotion is present:

```bash
npm install @emotion/react @emotion/styled
```

Do not assume these are the only DAMap dependencies; consult the library's `package.json` and resolve its peer dependencies.

## Choose an installation method

### Option A — Git subtree (recommended for source-level development)

Run from the **consuming application's repository root**:

```bash
git remote add damap-lib https://github.com/atherashraf/damap-lib.git
git fetch damap-lib
git subtree add --prefix=src/libs/damap damap-lib main --squash
npm install
```

If the `damap-lib` remote already exists, omit `git remote add`. This places the source under:

```text
src/libs/damap/
```

**Use source imports:**

```ts
import { initDamap, getDamapConfig } from "@damap/config";
import LoginForm from "@damap/components/auth/LoginForm";
```

With source integration, **do not** add `"damap": "file:src/libs/damap"` just to make these aliases work. That creates a second import route which can lead to duplicate module instances. Configure the alias instead, as shown below.

### Option B — Local package

```bash
npm install ../damap-lib
```

Or, if the source folder contains a valid package manifest:

```bash
npm install ./src/libs/damap
```

The package must expose the entry points you import and must be consumable by your bundler. When using the published/package entry point, prefer:

```ts
import { initDamap, getDamapConfig } from "damap";
```

### Option C — GitHub package dependency

```bash
npm install github:atherashraf/damap-lib
```

This works only if the repository is installable as a package with usable entry points and all required files/dependencies. The original package manifest shown later in this document exports TypeScript source rather than a compiled `dist/` bundle, so test your chosen bundler and deployment environment. **GitHub installation is not the same as publishing to npm.**

## Configure Vite and TypeScript for source integration

This section is required for **Option A**, because DAMap source imports use `@damap/...`.

### `vite.config.ts`

Add the DAMap alias to your existing Vite config (merge it with any existing plugins/settings):

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@damap": fileURLToPath(new URL("./src/libs/damap", import.meta.url)),
    },
  },
});
```

### `tsconfig.app.json`

Merge these `compilerOptions` into the application's existing TypeScript config; **do not replace the entire file**:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@damap/*": ["src/libs/damap/*"]
    }
  },
  "include": ["src"]
}
```

If your project uses a different tsconfig for the application, configure aliases there instead. Vite's alias handles runtime resolution; TypeScript's `paths` handles editor/type resolution. Both are needed.

### `src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_MAP_URL?: string;
  readonly VITE_APP_PORT?: string;
  readonly VITE_MAP_PORT?: string;
  readonly VITE_MAP_ENDPOINT?: string;
  readonly VITE_MAP_EXTENT?: string;
  readonly VITE_DEFAULT_MAP_EXTENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

This resolves `TS2339: Property 'env' does not exist on type 'ImportMeta'` when Vite's type declarations are included by TypeScript.

## Configure environment variables

Create `.env.development` in the consuming application's root:

```dotenv
VITE_APP_NAME=Candidate Assessment
VITE_APP_URL=http://localhost:8000
VITE_MAP_URL=http://localhost:8000
VITE_MAP_ENDPOINT=/api
# Optional alternative to explicit URLs:
# VITE_APP_PORT=8000
# VITE_MAP_PORT=8000
# Optional extent: minX,minY,maxX,maxY in EPSG:3857
# VITE_MAP_EXTENT=6800000,2700000,8600000,4500000
```

Replace the sample backend URLs with those of your application. If map and application APIs are separate, set `VITE_MAP_URL` and `VITE_APP_URL` independently. **Only expose non-secret configuration through `VITE_` variables**, because Vite embeds them in client-side code. Restart Vite after editing `.env` files.

For a production deployment, configure URLs/ports appropriate to your hosting setup; do not assume the development backend URLs will work in production.

## Initialize DAMap before React renders

DAMap's API and authentication services require `initDamap()` to run **once, before they are used**. Put the initialization in a dedicated module and import it from the application entry point.

### `src/damap.bootstrap.ts` — source/subtree version

```ts
import { initDamap } from "@damap/config";

const env = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  return value.trim() || undefined;
};

const isDev = import.meta.env.DEV;

const appUrl = isDev
  ? env(import.meta.env.VITE_APP_URL) || env(import.meta.env.VITE_MAP_URL)
  : "";
const mapUrl = isDev
  ? env(import.meta.env.VITE_MAP_URL) || env(import.meta.env.VITE_APP_URL)
  : "";

initDamap({
  appName: env(import.meta.env.VITE_APP_NAME) || "DAMap Application",
  endpoint: env(import.meta.env.VITE_MAP_ENDPOINT) || "/api",
  appUrl,
  mapUrl,
  appPort: isDev
    ? env(import.meta.env.VITE_APP_PORT) || env(import.meta.env.VITE_MAP_PORT)
    : undefined,
  mapPort: isDev
    ? env(import.meta.env.VITE_MAP_PORT) || env(import.meta.env.VITE_APP_PORT)
    : undefined,
  mapExtent: [6800000, 2700000, 8600000, 4500000],
});
```

This matches the WASA-style initialization fields. The extent is a **sample Pakistan extent in EPSG:3857**; replace it for your project. If you need configurable extents, validate and parse `VITE_MAP_EXTENT` before passing the four numbers to `mapExtent`.

The example uses empty production URLs, following the WASA same-origin convention. If your production API lives on another origin, adapt the bootstrap to use an explicit production URL. Confirm that the chosen `endpoint` matches your backend route conventions.

**Package-install variant:** replace only the import with `import { initDamap } from "damap";` if the installed package exports it. Do not import bootstrap from one DAMap copy and authentication services from another.

### `src/main.tsx`

```tsx
import "./damap.bootstrap";
// If DAMap CSS is available at the chosen integration path,
// import it once here (see Styling section below).

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Keep the bootstrap as a **module-level side effect**, not inside `App`, a component render, or `useEffect`. The entry point should import it before rendering any component that uses DAMap authentication or APIs.

### Styling

For **package integration**, if the package exposes the stylesheet:

```ts
import "damap/damap.css";
```

For **source/subtree integration**, import the source stylesheet directly through the configured alias if it exists:

```ts
import "@damap/damap.css";
```

Import the stylesheet only once in the application's entry point. The package's CSS export must exist for the package form to work.

## Scaffold a new application (theme, routes, layout)

The steps above integrate **DAMap itself**. The following optional, reusable **host-application shell** shows how to set up a new React/Vite app around DAMap. `AppLayout`, `AppHeader`, `AppFooter`, `AppRoutes`, and `useLayoutVM` belong to the **consuming application**, not to the DAMap library. Adapt the branding and routes for each project.

### Recommended source structure

```text
src/
├── main.tsx                  # DAMap bootstrap imported before React renders
├── damap.bootstrap.ts        # initDamap configuration
├── vite-env.d.ts             # Vite environment typing
├── App.tsx                   # MUI theme and BrowserRouter
├── AppRoutes.tsx             # public/protected routes
├── theme/
│   └── appTheme.ts           # light/dark theme factory
├── hooks/
│   └── useLayoutVM.tsx       # shared title/footer/height context
├── layout/
│   ├── AppLayout.tsx         # common shell with Outlet
│   ├── AppHeader.tsx
│   └── AppFooter.tsx
├── pages/
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
└── libs/
    └── damap/               # only for source/subtree integration
```

Install host application dependencies as needed:

```bash
npm install react-router-dom @mui/material @mui/icons-material @emotion/react @emotion/styled
```

Use the DAMap version and dependency versions compatible with your application. The snippets below assume your `@/` and `@damap/` aliases are configured as described earlier.

### `src/theme/appTheme.ts` — theme factory

```ts
import { createTheme } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: mode === "dark" ? "#70e0ce" : "#156b80" },
      background: {
        default: mode === "dark" ? "#0b1623" : "#f6f8fb",
        paper: mode === "dark" ? "#152434" : "#ffffff",
      },
    },
    shape: { borderRadius: 10 },
    typography: { fontFamily: 'Roboto, Arial, sans-serif' },
  });
}
```

### `src/hooks/useLayoutVM.tsx` — page-specific shell settings

```tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type FooterMode = "sticky" | "normal" | "hidden";

type LayoutContextValue = {
  title: string;
  setTitle: (value: string) => void;
  footerMode: FooterMode;
  setFooterMode: (value: FooterMode) => void;
  headerHeight: number;
  footerHeight: number;
  outletHeight: number;
  setOutletHeight: (value: number) => void;
};

const DEFAULT_TITLE = "My Application";
const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutVMProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [footerMode, setFooterMode] = useState<FooterMode>("sticky");
  const [outletHeight, setOutletHeight] = useState(0);
  return (
    <LayoutContext.Provider value={{
      title, setTitle, footerMode, setFooterMode,
      headerHeight: 65, footerHeight: 50, outletHeight, setOutletHeight,
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutVM(options?: { title?: string; footerMode?: FooterMode }) {
  const context = useContext(LayoutContext);
  if (!context) throw new Error("useLayoutVM requires LayoutVMProvider");
  const { setTitle, setFooterMode } = context;
  const title = options?.title;
  const footerMode = options?.footerMode;
  useEffect(() => {
    if (title !== undefined) setTitle(title);
    if (footerMode !== undefined) setFooterMode(footerMode);
    return () => {
      if (title !== undefined) setTitle(DEFAULT_TITLE);
      if (footerMode !== undefined) setFooterMode("sticky");
    };
  }, [title, footerMode, setTitle, setFooterMode]);
  return context;
}
```

`sticky` and `normal` are retained as application-level modes for future customization; the simple shell below renders both as a bottom footer. `hidden` omits it.

### `src/layout/AppLayout.tsx` — full-height shared shell

```tsx
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useLayoutEffect, useRef } from "react";
import { LayoutVMProvider, useLayoutVM } from "@/hooks/useLayoutVM";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";

function Shell({ toggleMode }: { toggleMode: () => void }) {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const { footerMode, setOutletHeight } = useLayoutVM();

  useLayoutEffect(() => {
    const element = mainRef.current;
    if (!element) return;
    const measure = () => setOutletHeight(element.clientHeight);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [setOutletHeight]);

  return (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <AppHeader toggleMode={toggleMode} />
      <Box ref={mainRef} component="main" sx={{ flex: "1 1 0", minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <Outlet />
      </Box>
      {footerMode !== "hidden" && <AppFooter />}
    </Box>
  );
}

export default function AppLayout({ toggleMode }: { toggleMode: () => void }) {
  return <LayoutVMProvider><Shell toggleMode={toggleMode} /></LayoutVMProvider>;
}
```

**Important:** Pages inside this layout should use `flex: 1` or `minHeight: "100%"` where appropriate, **not** a second `minHeight: "100dvh"`. The main outlet already represents the viewport space remaining after the header and footer. The measured `outletHeight` can also be used to size map containers.

### `src/layout/AppHeader.tsx` and `AppFooter.tsx`

These are intentionally simple host-app components. Replace the title, navigation, branding, and footer text for your application. The header theme toggle is passed from the application via the shell's route element.

```tsx
// src/layout/AppHeader.tsx
import { AppBar, IconButton, Toolbar, Typography, Box, Tooltip } from "@mui/material";
import { Brightness4Rounded, HomeRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useLayoutVM } from "@/hooks/useLayoutVM";

export default function AppHeader({ toggleMode }: { toggleMode: () => void }) {
  const navigate = useNavigate();
  const { title, headerHeight } = useLayoutVM();
  return (
    <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Toolbar sx={{ minHeight: `${headerHeight}px !important`, gap: 1 }}>
        <Tooltip title="Dashboard"><IconButton onClick={() => navigate("/dashboard")}><HomeRounded /></IconButton></Tooltip>
        <Typography variant="h6" sx={{ flex: 1, textAlign: "center" }} noWrap>{title}</Typography>
        <Tooltip title="Toggle theme"><IconButton onClick={toggleMode}><Brightness4Rounded /></IconButton></Tooltip>
      </Toolbar>
    </AppBar>
  );
}
```

```tsx
// src/layout/AppFooter.tsx
import { Box, Typography } from "@mui/material";
import { useLayoutVM } from "@/hooks/useLayoutVM";

export default function AppFooter() {
  const { footerHeight } = useLayoutVM();
  return (
    <Box component="footer" sx={{ height: footerHeight, flexShrink: 0, borderTop: 1, borderColor: "divider", display: "flex", alignItems: "center", px: 2 }}>
      <Typography variant="caption" color="text.secondary">© {new Date().getFullYear()} My Application · Powered by DAMap</Typography>
    </Box>
  );
}
```

### `src/AppRoutes.tsx` — nested routes

```tsx
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "@/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { AuthGuard } from "@damap/components/auth/AuthGuard";

export default function AppRoutes({ toggleMode }: { toggleMode: () => void }) {
  return (
    <Routes>
      <Route element={<AppLayout toggleMode={toggleMode} />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
```

The `AuthGuard` import above matches the **source integration** used in Candidate Assessment; confirm the component's export and props in your installed DAMap version. For a package install, replace it with a supported public package export rather than assuming internal `@damap/...` paths are available.

### `src/App.tsx` — theme and router composition

```tsx
import { useMemo, useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import { createAppTheme } from "@/theme/appTheme";
import AppRoutes from "@/AppRoutes";

function initialMode(): PaletteMode {
  const saved = localStorage.getItem("app-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [mode, setMode] = useState<PaletteMode>(initialMode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const toggleMode = () => setMode(current => {
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("app-theme", next);
    return next;
  });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter><AppRoutes toggleMode={toggleMode} /></BrowserRouter>
    </ThemeProvider>
  );
}
```

### `src/pages/LoginPage.tsx` and `DashboardPage.tsx`

```tsx
// src/pages/LoginPage.tsx
import { Box } from "@mui/material";
import LoginForm from "@damap/components/auth/LoginForm";
import { useLayoutVM } from "@/hooks/useLayoutVM";

export default function LoginPage() {
  useLayoutVM({ title: "Sign in" });
  return (
    <Box sx={{ flex: 1, display: "grid", placeItems: "center", p: 2 }}>
      <LoginForm title="Welcome back" subtitle="Sign in to continue" defaultPostLoginPath="/dashboard" />
    </Box>
  );
}
```

```tsx
// src/pages/DashboardPage.tsx
import { Box, Typography } from "@mui/material";
import { useLayoutVM } from "@/hooks/useLayoutVM";

export default function DashboardPage() {
  useLayoutVM({ title: "Dashboard" });
  return <Box sx={{ flex: 1, p: 3 }}><Typography variant="h4">Dashboard</Typography></Box>;
}
```

**Order of responsibility:** `main.tsx` initializes DAMap → `App.tsx` provides theme/router → `AppRoutes.tsx` chooses public/protected pages → `AppLayout.tsx` provides the shared header/footer and `Outlet` → each page sets its title via `useLayoutVM`. `LoginForm` and `AuthGuard` then consume the **already initialized** DAMap library.

---

## Verify the integration

Check that the bootstrap and the authentication code use the **same** DAMap module instance. You can temporarily inspect the configuration:

```ts
import { getDamapConfig } from "@damap/config";
console.log("DAMap configuration:", getDamapConfig());
```

Remove debug logging when finished, especially if configuration may contain sensitive values.

```bash
npx tsc --noEmit
npm run build
npm run dev -- --force
```

For projects using `tsconfig.app.json`, use `npx tsc -p tsconfig.app.json --noEmit` if your root `tsconfig.json` is solution-style.

### Troubleshooting

| Error | Likely cause | Resolution |
| --- | --- | --- |
| `TS2307: Cannot find module 'damap'` | Source integration was used without installing a package named `damap` | Import `initDamap` from `@damap/config` and configure the alias; or install a valid package |
| `TS2307: Cannot find module '@damap/config'` | Vite/TypeScript aliases are missing or point to the wrong folder | Check `vite.config.ts`, `tsconfig.app.json`, and `src/libs/damap/config.ts` |
| `TS2339: Property 'env' does not exist on type 'ImportMeta'` | Vite types are not included | Add `src/vite-env.d.ts` and ensure it is included by tsconfig |
| `Call initDamap({...}) first` | API/authentication ran before bootstrap, or different DAMap copies were imported | Import `./damap.bootstrap` in `main.tsx` before mounting React and use one consistent import strategy |
| `Could not resolve '@emotion/styled'` | Missing MUI Emotion styling dependencies | `npm install @emotion/react @emotion/styled` |
| CSS import fails | The stylesheet is not exposed at the import path | Use `@damap/damap.css` for source integration, or verify package `exports` |
| Requests reach the wrong backend | Map and application API URL/port values are swapped or missing | Check `.env.development`, bootstrap target configuration, and browser network requests |

## Package imports versus source imports

| Integration | Bootstrap import | Component import | Stylesheet import |
| --- | --- | --- | --- |
| Git subtree/source | `@damap/config` | `@damap/components/...` | `@damap/damap.css` |
| Installed package (if exported) | `damap` | Public package exports only | `damap/damap.css` |

A source-level alias is not automatically a published package API. Prefer public package exports for true package consumers; use internal aliases only when embedding DAMap source.

---

# 🌐 Map API and Application API

DAMap supports two API targets:

```text
map
app
```

They correspond to:

```text
target: "map"  → config.mapUrl
target: "app"  → config.appUrl
```

The base `MapApi` class uses the **Map API** as its default target.

```
protected readonly defaultTarget: "map" | "app" = "map";
```

Therefore normal DAMap requests do not need to specify a target:

```ts
await mapApi.get(
    MapAPIs.DCH_LAYER_INFO,
    { uuid }
);
```

This automatically uses:

```text
config.mapUrl
```

A request can explicitly target the Application API:

```ts
await mapApi.get(
    AppAPIs.LBDC_DASHBOARD_DATA,
    {},
    { target: "app" }
);
```

---

# 🧩 Application-Specific API

Applications can extend `MapApi` and change the default target.

Example:

```ts
import type { RefObject } from "react";
import { MapApi } from "damap";

export default class AppApi extends MapApi {

    protected readonly defaultTarget: "map" | "app" = "app";

    constructor(snackbarRef: RefObject<any>) {
        super(snackbarRef);
    }
}
```

Now requests made through `AppApi` automatically use:

```text
config.appUrl
```

Example:

```ts
const api = new AppApi(snackbarRef);

await api.get(
    AppAPIs.LBDC_DASHBOARD_DATA
);
```

There is no need to specify:

```ts
{ target: "app" }
```

for normal application requests.

---

## Override the Target Per Request

The default target can always be overridden.

For example, an `AppApi` instance can call a DAMap endpoint:

```ts
await api.get(
    MapAPIs.DCH_LAYER_INFO,
    { uuid },
    { target: "map" }
);
```

Likewise, a `MapApi` instance can explicitly call the application backend:

```ts
await mapApi.get(
    AppAPIs.LBDC_DASHBOARD_DATA,
    {},
    { target: "app" }
);
```

This provides the following architecture:

```text
                    DAMap Configuration
                           │
                 ┌─────────┴─────────┐
                 │                   │
              mapUrl               appUrl
                 │                   │
                 ▼                   ▼
              Map API             App API
                 ▲                   ▲
                 │                   │
              MapApi              AppApi
          default = "map"      default = "app"
```

---

# 🔌 API Request Options

DAMap API methods support common request options:

```ts
type RequestOptions = {
    isJSON?: boolean;
    isGzip?: boolean;
    signal?: AbortSignal;
    target?: "map" | "app";
};
```

Example:

```ts
await api.get(
    MapAPIs.DCH_LAYER_INFO,
    { uuid },
    {
        target: "map",
        signal: controller.signal
    }
);
```

---

# 🛑 Request Cancellation

DAMap supports native `AbortController` request cancellation.

```ts
const controller = new AbortController();

const data = await api.get(
    MapAPIs.DCH_LAYER_INFO,
    { uuid },
    {
        signal: controller.signal
    }
);
```

Cancel the request:

```ts
controller.abort();
```

This is particularly useful for React components where requests should be cancelled when a component unmounts or request parameters change.

Example:

```ts
useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
        const data = await api.get(
            MapAPIs.DCH_LAYER_INFO,
            { uuid },
            {
                signal: controller.signal
            }
        );

        if (data) {
            setLayerData(data);
        }
    }

    loadData();

    return () => controller.abort();

}, [uuid]);
```

---

# 🗺️ URL and Parameter Handling

DAMap automatically handles path parameters.

Given:

```ts
DCH_LAYER_INFO:
    "api/dch/layer_info/{uuid}/"
```

Calling:

```ts
api.get(
    MapAPIs.DCH_LAYER_INFO,
    { uuid: "abc-123" }
);
```

produces a request similar to:

```text
<mapUrl>/api/dch/layer_info/abc-123/
```

Parameters that are not URL placeholders are automatically added as query parameters.

Example:

```ts
api.get(
    "api/dch/layers/",
    {
        category: "Hydrology",
        active: true
    }
);
```

produces:

```text
<mapUrl>/api/dch/layers/?category=Hydrology&active=true
```

Array parameters are serialized using repeated query parameters.

---

# 📤 FormData Uploads

DAMap supports file and `FormData` uploads:

```ts
const formData = new FormData();

formData.append("file", file);

await api.postFormData(
    MapAPIs.DCH_UPLOAD_SHP_FILE,
    formData
);
```

The appropriate multipart request headers are handled by the browser.

---

# 🗜️ GZIP Responses

DAMap API requests can process GZIP-compressed responses.

```ts
const data = await api.get(
    MapAPIs.DCH_LAYER_ATTRIBUTES,
    { uuid },
    {
        isGzip: true
    }
);
```

Compressed responses are decompressed before being returned to the caller.

---

# 🧱 Package Structure

Current package structure:

```text
damap/
│
├── api/
├── assets/
├── components/
├── hooks/
├── pages/
├── types/
├── utils/
│
├── config.ts
├── damap.ts
├── damap.css
└── package.json
```

The exact internal structure may evolve as additional reusable functionality is moved into the library.

---

## Package manifest and publishing status

The original README described this source-oriented manifest:

```json
{
  "name": "damap",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./damap.ts",
    "./damap.css": "./damap.css"
  }
}
```

This is **not evidence of an npm-published distribution**. With `private: true`, the package is not intended for publication. It also exports TypeScript source rather than compiled JavaScript and does not expose internal `@damap/...` paths as public subpath exports. For general npm consumption, prepare a build (`dist/`), declaration files, peer dependencies, documented exports, and a versioned release before publishing.

---

## Maintaining the library with Git subtree

The **source of truth** for reusable DAMap development is the `src/libs/damap` directory in `damap-ui`. The standalone repository is `https://github.com/atherashraf/damap-lib.git`.

### Configure the remote (once)

```bash
git remote add damap-lib https://github.com/atherashraf/damap-lib.git
git fetch damap-lib
```

### Push changes from `damap-ui` to `damap-lib`

```bash
git subtree split --prefix=src/libs/damap -b damap-lib-sync
git push damap-lib damap-lib-sync:main
git branch -D damap-lib-sync
```

If the remote branch has diverged, resolve the history intentionally rather than routinely using `--force`. The original workflow used `--force`, which can overwrite remote changes.

### Pull changes into an existing subtree

```bash
git fetch damap-lib
git subtree pull --prefix=src/libs/damap damap-lib main --squash
```

These commands apply to a repository that already contains the subtree and has a matching `damap-lib` remote. `subtree-push.bat` and `subtree-pull.bat` may also be available in the original project.

---

# 🧭 Recommended Development Workflow

The current recommended workflow is:

1. Develop and test DAMap functionality inside `damap-ui`.
2. Keep reusable functionality under:

```text
src/libs/damap
```

3. Keep application-specific functionality outside the DAMap library.
4. Synchronize reusable changes to `damap-lib` using git subtree.
5. Consume `damap-lib` from other applications.
6. Extend `MapApi` for application-specific APIs instead of duplicating DAMap request logic.

Conceptually:

```text
damap-ui
    │
    ├── application/demo code
    │
    └── src/libs/damap
              │
              │ subtree
              ▼
          damap-lib
              │
      ┌───────┼────────┐
      ▼       ▼        ▼
    LBDC     WASA     Other Apps
```

---

# 🔮 Future Improvements

Potential future improvements include:

- move DAMap to a dedicated monorepo/package structure

```text
packages/
└── damap/
```

- generate production build output under `dist/`
- publish versioned releases
- publish to an npm registry
- introduce semantic versioning
- eliminate consumer dependency on internal `@damap` aliases
- add automated tests
- add CI/CD package builds
- generate API documentation
- add reusable TypeScript API interfaces
- add migration/release notes for consuming applications

---

# 👨‍💻 Author

**Ather Ashraf**

GIS / Spatial Data Science / React / OpenLayers / Web GIS