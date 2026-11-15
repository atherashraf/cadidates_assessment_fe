export type DamapOptions = {
    mapUrl?: string; appUrl?: string;
    mapPort?: string; appPort?: string;
    endpoint?: string; appName?: string;
    allowMultipleLayers?: boolean;
    mapExtent: [number, number, number, number];
};

let cfg: DamapOptions | null = null;

// const authCredentials = import.meta.env.VITE_AUTH_CREDENTIALS;


function resolveUrl(url?: string, port?: string): string {
    // Explicit empty string = relative same-origin paths only (staging/prod nginx).
    if (url === "") {
        return "";
    }

    // Explicit URL takes priority
    if (url?.trim()) {
        return url.trim().replace(/\/+$/, "");
    }

    // Otherwise use current host and configured port
    const {protocol, hostname, origin} = window.location;

    return port?.trim() ? `${protocol}//${hostname}:${port.trim()}` : origin;
}

export function initDamap(options: DamapOptions): void {
    // If the caller sets mapPort/appPort/mapUrl/appUrl (even to undefined),
    // honor that and do not fall back to import.meta.env. Needed so staging
    // can force same-origin /api via nginx without baking :8998 into URLs.
    // console.log("initDamap", options);
    const mapPort = ("mapPort" in options
        ? options.mapPort?.trim()
        : import.meta.env.VITE_MAP_PORT || import.meta.env.VITE_APP_PORT) || undefined;
    const appPort = ("appPort" in options
        ? options.appPort?.trim()
        : import.meta.env.VITE_APP_PORT || import.meta.env.VITE_MAP_PORT || mapPort) || undefined;

    const mapUrlOpt = "mapUrl" in options ? options.mapUrl : undefined;
    const appUrlOpt = "appUrl" in options ? options.appUrl : undefined;

    // Warn only when URLs and ports are both unavailable.
    if (!mapUrlOpt?.trim() && !appUrlOpt?.trim() && !mapPort && !appPort) {
        console.warn("[DAMap] No API URL or port configured. " + "Please provide at least VITE_MAP_PORT, " + "or configure VITE_MAP_URL / VITE_API_URL. " + "Falling back to the current browser origin.");
    }

    cfg = {
        ...options,

        mapPort, appPort,

        mapUrl: resolveUrl(mapUrlOpt, mapPort),

        appUrl: resolveUrl(appUrlOpt, appPort),
    };
    // console.log("cfg", cfg);
}

export function getDamapConfig(): DamapOptions {
    if (!cfg) {
        throw new Error("Call initDamap({...}) first.");
    }

    return cfg;
}