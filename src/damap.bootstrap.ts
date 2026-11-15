
import { initDamap } from "@damap/config";

// ============================================================
// Default Map Extent (EPSG:3857)
// ============================================================

const PAKISTAN_EXTENT: [number, number, number, number] = [
    6800000,
    2700000,
    8600000,
    4500000,
];

// ============================================================
// Environment Helpers
// ============================================================

const trimEnv = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const parseMapExtent = (
    value?: string
): [number, number, number, number] => {
    if (!value) return PAKISTAN_EXTENT;

    const values = value.split(",").map((v) => Number(v.trim()));

    if (
        values.length !== 4 ||
        values.some((v) => !Number.isFinite(v)) ||
        values[0] >= values[2] ||
        values[1] >= values[3]
    ) {
        console.warn(
            `[DAMap] Invalid VITE_DEFAULT_MAP_EXTENT: "${value}". ` +
            "Using Pakistan extent."
        );
        return PAKISTAN_EXTENT;
    }

    return values as [number, number, number, number];
};

// ============================================================
// Environment Detection
// ============================================================

const isDev = import.meta.env.DEV;

// ============================================================
// API Configuration
// ============================================================

const mapPort = isDev
    ? trimEnv(import.meta.env.VITE_MAP_PORT) ||
    trimEnv(import.meta.env.VITE_APP_PORT)
    : undefined;

const appPort = isDev
    ? trimEnv(import.meta.env.VITE_APP_PORT) ||
    trimEnv(import.meta.env.VITE_MAP_PORT)
    : undefined;

// Development:
//   Explicit URL if configured; otherwise resolveUrl()
//   constructs URL using current hostname and backend port.
//
// Production:
//   Empty string forces relative same-origin URLs.

const mapUrl = isDev
    ? trimEnv(import.meta.env.VITE_MAP_URL) ||
    trimEnv(import.meta.env.VITE_APP_URL)
    : "";

const appUrl = isDev
    ? trimEnv(import.meta.env.VITE_APP_URL) ||
    trimEnv(import.meta.env.VITE_MAP_URL)
    : "";

// ============================================================
// API Endpoint
// ============================================================

const endpoint =
    trimEnv(import.meta.env.VITE_MAP_ENDPOINT) || "/api";

// ============================================================
// Map Extent
// ============================================================

const mapExtent = parseMapExtent(
    trimEnv(import.meta.env.VITE_DEFAULT_MAP_EXTENT) ||
    trimEnv(import.meta.env.VITE_MAP_EXTENT)
);

// ============================================================
// Initialize DAMap
// ============================================================

initDamap({
    mapPort,
    appPort,
    mapUrl,
    appUrl,
    endpoint,
    appName: trimEnv(import.meta.env.VITE_APP_NAME),
    mapExtent,
});

// ============================================================
// Debug Information
// ============================================================

// console.log("[DAMap] Bootstrap initialized", {
//     mode: import.meta.env.MODE,
//     isDev,
//     mapPort,
//     appPort,
//     mapUrl: mapUrl ?? "(resolved by initDamap)",
//     appUrl: appUrl ?? "(resolved by initDamap)",
//     endpoint,
//     appName: import.meta.env.VITE_APP_NAME,
//     mapExtent,
// });
