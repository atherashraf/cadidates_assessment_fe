
/**
 * @file MapApiContext.tsx
 * @description
 * React integration for the DAMap HTTP API client.
 *
 * Provides a shared MapApi instance through an optional React
 * Context provider, along with convenient access methods for
 * React components, custom hooks, and standalone services.
 *
 * Features:
 * - Optional MapApiProvider for application-level configuration.
 * - useMapApi() hook for React components and custom hooks.
 * - getMapApi() for non-React services and utility functions.
 * - Shared fallback MapApi instance when no provider exists.
 * - Optional snackbar integration for API notifications.
 *
 * @example
 * // 1. Use directly in a React component (no provider required).
 * import { useMapApi } from "@damap/api/MapApiContext";
 *
 * function MyComponent() {
 *     const api = useMapApi();
 *     // Use api.get(), api.post(), etc.
 * }
 *
 * @example
 * // 2. Use with an optional provider.
 * <MapApiProvider snackbarRef={snackbarRef}>
 *     <App />
 * </MapApiProvider>
 *
 * @example
 * // 3. Use outside React components.
 * import { getMapApi } from "@damap/api/MapApiContext";
 *
 * const api = getMapApi();
 * const layers = await api.get(MapAPIs.DCH_GET_ALL_LAYERS);
 */

import {
    createContext,
    useContext,
    useMemo,
} from "react";

import type {
    ReactNode,
    RefObject,
} from "react";

import MapApi from "@damap/api/MapApi";

import type {
    DASnackbarHandle,
} from "@damap/components/base/DASnackbar";

// ============================================================
// Shared Fallback Instance
// ============================================================

/**
 * Default snackbar reference used by the fallback MapApi.
 *
 * The reference is initially null, meaning API requests can
 * execute normally, but snackbar notifications are unavailable
 * unless a snackbar instance is attached.
 */
const fallbackSnackbarRef: RefObject<DASnackbarHandle | null> = {
    current: null,
};

/**
 * Shared fallback MapApi instance.
 *
 * Used when useMapApi() is called without a MapApiProvider
 * and by getMapApi() in standalone TypeScript services.
 *
 * @remarks
 * This instance is shared within the current JavaScript module
 * environment. It is intended for browser-based applications.
 */
const defaultMapApi = new MapApi(fallbackSnackbarRef);

// ============================================================
// React Context
// ============================================================

/**
 * React Context holding an optional MapApi instance.
 *
 * When no provider is mounted, the context value is null
 * and useMapApi() returns the shared fallback instance.
 */
const MapApiContext = createContext<MapApi | null>(null);

// ============================================================
// Provider Properties
// ============================================================

/**
 * Configuration properties for MapApiProvider.
 *
 * @property snackbarRef
 * Reference to the DAMap snackbar component used for displaying
 * API notifications.
 *
 * @property children
 * React elements that can access the configured MapApi instance.
 */
export interface MapApiProviderProps {
    snackbarRef: RefObject<DASnackbarHandle | null>;
    children: ReactNode;
}

// ============================================================
// Optional React Provider
// ============================================================

/**
 * Provides a configured MapApi instance to descendant
 * React components.
 *
 * The API instance is memoized and recreated only when
 * the snackbarRef object changes.
 *
 * This provider is optional. Components using useMapApi()
 * without a provider receive the shared fallback instance.
 *
 * @param props - Provider configuration and children.
 * @returns React Context provider containing a MapApi instance.
 *
 * @example
 * const snackbarRef = useRef<DASnackbarHandle>(null);
 *
 * return (
 *     <MapApiProvider snackbarRef={snackbarRef}>
 *         <Application />
 *     </MapApiProvider>
 * );
 */
export function MapApiProvider({
                                   snackbarRef,
                                   children,
                               }: MapApiProviderProps) {

    const apiInstance = useMemo(
        () => new MapApi(snackbarRef),
        [snackbarRef],
    );

    return (
        <MapApiContext.Provider value={apiInstance}>
            {children}
        </MapApiContext.Provider>
    );
}

// ============================================================
// React Hook
// ============================================================

/**
 * Returns the MapApi instance available to the current
 * React component.
 *
 * If a MapApiProvider exists in the component tree,
 * its configured instance is returned.
 *
 * Otherwise, the shared fallback instance is returned.
 *
 * @returns MapApi instance.
 *
 * @remarks
 * This is a React custom hook and must follow the
 * Rules of Hooks. Call it only at the top level of
 * React function components or other custom hooks.
 *
 * @example
 * function LayerList() {
 *     const api = useMapApi();
 *
 *     const loadLayers = async () => {
 *         const layers = await api.get(
 *             MapAPIs.DCH_GET_ALL_LAYERS
 *         );
 *
 *         console.log(layers);
 *     };
 *
 *     return <button onClick={loadLayers}>Load</button>;
 * }
 */
export function useMapApi(): MapApi {
    const context = useContext(MapApiContext);

    return context ?? defaultMapApi;
}

// ============================================================
// Standalone API Access
// ============================================================

/**
 * Returns the shared fallback MapApi instance without
 * requiring React Context or a React component.
 *
 * Suitable for:
 * - TypeScript service classes.
 * - API utility functions.
 * - Standalone asynchronous operations.
 * - Non-React application modules.
 *
 * @returns Shared fallback MapApi instance.
 *
 * @remarks
 * This function always returns the fallback singleton,
 * even when a MapApiProvider exists elsewhere.
 *
 * The fallback instance does not automatically inherit
 * the provider's snackbar reference.
 *
 * @example
 * import { getMapApi } from "@damap/api/MapApiContext";
 *
 * export class LayerService {
 *     static async getLayers() {
 *         const api = getMapApi();
 *
 *         return api.get(
 *             MapAPIs.DCH_GET_ALL_LAYERS
 *         );
 *     }
 * }
 */
export function getMapApi(): MapApi {
    return defaultMapApi;
}

export default MapApiProvider;
