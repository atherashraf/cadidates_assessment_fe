/**
 * ============================================================================
 * MapApi Usage Examples
 * ============================================================================
 *
 * MapApi supports:
 * - Standard HTTP methods: GET, POST, PUT, PATCH, DELETE
 * - Raw binary streaming: getArrayBuffer (MVT vector tiles, binary rasters)
 * - FormData uploads
 * - URL/path parameter interpolation
 * - Query parameters
 * - AbortSignal request cancellation
 * - Map API and Application API routing
 *
 * Request target:
 *   "map" -> uses the configured mapUrl
 *   "app" -> uses the configured appUrl
 *   Default target is "map"
 *
 * ============================================================================
 * Binary & Vector Tile Requests
 * ============================================================================
 *
 * // Binary MVT Tile Fetch (Silent error handling for map canvas)
 * const buffer = await api.getArrayBuffer(tileUrl, {}, { signal });
 *
 */

import type { RefObject } from "react";
import * as pako from "pako";
import AuthServices from "@damap/api/authServices";
import type {DASnackbarHandle} from "../components/base/DASnackbar.tsx";
import {getDamapConfig} from "@damap/config";
import {toUserFacingApiError} from "@damap/api/apiErrorMessage.ts";

// ============================================================================
// Types & API Endpoint Constants
// ============================================================================

export const MapAPIs = Object.freeze({
    API_OAUTH_LOGIN: "api/jwt/oauth/login/{type}/",
    API_TOKEN: "api/auth/jwt/token/",
    API_REFRESH_ACCESS_TOKEN: "api/auth/jwt/refresh_access_token/",
    API_LOGIN_JSON: "api/auth/jwt/login/json",
    API_VERIFY_TOKEN: "api/auth/jwt/token/verify",
    API_2FA_CREATE_SESSION: "api/auth/2fa/create_session",
    API_2FA_SESSION: "api/auth/2fa/session",
    API_2FA_CLOSE_SESSION: "api/auth/2fa/close",
    API_2FA_VERIFY_OTP: "api/auth/2fa/verify_otp",


    DCH_LAYER_INFO: "api/dch/layer_info/{uuid}/",
    DCH_ALL_LAYER_INFO: "api/dch/all_layer_info/",
    DCH_LAYER_EXTENT: "api/dch/layer_extent/{uuid}/",
    DCH_LAYER_MVT: "api/dch/layer_mvt/{uuid}/",
    DCH_LAYER_WFS: "api/dch/wfs/{uuid}/{format}/",
    DCH_LAYER_RASTER: "api/dch/raster_tile/{uuid}",
    DCH_SAVE_STYLE: "api/dch/save_style/{uuid}/{map_uuid}/",
    DCH_SAVE_SLD: "api/dch/upload_sld_style/{uuid}/{map_uuid}/",
    DCH_GET_STYLE: "api/dch/get_style/{uuid}/{map_uuid}/",
    DCH_LAYER_VISIBILITY_ZOOM: "api/dch/update_layer_visibility_zoom/{uuid}/",
    DCH_LAYER_FIELDS: "api/dch/layer_fields/{uuid}/",


    DCH_LAYER_CLEAR_CACHE: "api/dch/clear_cache/",

    DCH_LAYER_SELECT: "api/dch/spatial_select/{uuid}/",
    DCH_LAYER_PKCOLS: "api/dch/layer_pk_cols/{uuid}/",


    DCH_GEE_LAYER: "api/gee/gee_layer/{layer_type}/",
    DCH_GEE_LAYER_LEGEND: "api/gee/gee_layer_legend/{layer_type}/",
    DCH_GEE_FORECAST_LAYER: "api/gee/gfs_forecast_layer/",

    DCH_LAYER_FIELD_DISTINCT_VALUE: "api/dch/layer_field_distinct_values/{uuid}/{field_name}/{field_type}/",
    DCH_MAP_INFO: "api/dch/get_map_info/{uuid}/",
    DCH_MAP_UUID: "api/dch/get_map_info/{layer_title}/",
    DCH_ALL_MAP_INFO: "api/dch/all_map_info/",
    DCH_LAYER_PIXEL_VALUE: "api/dch/get_pixel_value/{uuid}/{long}/{lat}/",
    DCH_FEATURE_DETAIL: "api/dch/get_feature_detail/{uuid}/{col_name}/{col_val}/",
    DCH_RASTER_AREA: "api/dch/get_raster_area/{uuid}/{geojson_str}/",
    DCH_GET_ALL_LAYERS: "api/dch/get_all_layers/",
    DCH_GET_APPLICATION_URL: "api/dch/get_application_url/{url_type}/",

    DCH_RASTER_DETAIL: "api/dch/get_raster_info/{uuid}/",
    DCH_RASTER_PIXEL_VALUE: "api/dch/raster_pixel/{uuid}",

    DCH_PREDEFINED_LIST: "api/dch/get_predefined_style_list/",
    DCH_LEGEND_GRAPHIC: "api/dch/get_legend_graphic/{uuid}/",
    DCH_SAVE_MAP: "api/dch/save_map/",
    DCH_DELETE_MAP: "api/dch/delete_map/{uuid}/",
    DCH_UPDATE_MAP: "api/dch/update_map/{uuid}/",
    DCH_LAYER_CATEGORIES: "api/dch/layer_categories/",
    DCH_MODEL_TYPES: "api/dch/model_types/",
    DCH_ADD_RASTER_INFO: "api/dch/add_raster_layer_info/",
    DCH_DATA_MODEL_TYPES: "api/dch/raster_data_model_types/",
    DCH_GET_FEATURE_GEOMETRY: "api/dch/get_feature_geometry/{uuid}/{pk_values}/",

    DCH_DELETE_MODEL_ROW: "api/dch/delete_model_row/",
    DCH_EDIT_MODEL_ROW: "api/dch/edit_model_row/{modelName}/",
    DCH_DELETE_LAYER_INFO: "api/dch/delete_layerinfo_row/{uuid}/",
    DCH_DOWNLOAD_SLD: "api/dch/download_sld_style/{uuid}/",
    DCH_DOWNLOAD_DA_STYLE: "api/dch/download_da_style/{uuid}/",

    DCH_DOWNLOAD_ROWS_GEOMETRY: "api/dch/admin/download_geometry/{uuid}/",
    DCH_UPLOAD_ROW_GEOMETRY: "api/dch/admin/upload_geometry/{uuid}/",
    DCH_DOWNLOAD_LAYER_SHAPEFILE: "api/dch/admin/download_shapefile/{uuid}/",


    DCH_UPLOAD_SHP_FILE: "api/dch/admin/upload_shp_file/",
    DCH_CHECK_TABLE_NAME: "api/dch/admin/check_table_name/",
    DCH_PREVIEW_APPEND_SHP: "api/dch/admin/preview_append_shp/",
    DCH_COMMIT_APPEND_SHP: "api/dch/admin/commit_append_shp/",
    DCH_SAVE_DB_LAYER_INFO: "api/dch/admin/save_db_layer_info/{db_id}/{table_name}/{layer_category_id}/",
    DCH_COLUMN_VALUE: "api/dch/column_value/{uuid}/{pk_val}/{col_name}/",
    DCH_NAVIGATION_LIST: "api/dch/navigation_list/{map_uuid}/",
    DCH_NAVIGATION_GEOMETRY: "api/dch/navigation_geometry/{map_uuid}/{selected_key}/{node_id}/",
    DCH_UPDATE_LAYER_ATTRIBUTE: "api/dch/admin/update_layer_attributes/{uuid}/",
    DCH_BULK_UPDATE_LAYER_FIELD_VALUE: "api/dch/bulk/bulk_update_layer_field_value/{uuid}/",
    DCH_DELETE_LAYER_FEATURES: "api/dch/admin/delete_layer_features/{uuid}/",

    DCH_ADMIN_LAYER_INFO_EDIT: "admin/layer-info/edit/{id}/",
    DCH_ADD_URL_LAYER_INFO: "/api/dch/admin/add_layer_url_info/",
    DCH_ADD_MODEL_ROW: "api/dch/admin/add_model_row/",
    DCH_DB_CONNECTION: "api/dch/admin/get_db_connection/",
    DCH_DB_TABLE_LIST: "api/dch/admin/db_table_list/{db_id}/",
    DCH_ADD_DB_CONNECTION: "api/dch/admin/add-db-connection/",
    DCH_TEST_DB_CONNECTION: "api/dch/admin/test-db-connection/",
    DCH_SAVE_MODEL_DATA: "api/dch/admin/save_model_data/",
    DCH_SAVE_LAYER_INFO: "api/dch/admin/save_layer_info/",
    DCH_SAVE_MAP_INFO: "api/dch/admin/save_map_info/",
    DCH_RECONCILE_LAYER_INFO: "api/dch/admin/reconcile_layer_info/{uuid}/",
    DCH_CREATE_LAYER_INFO: "api/dch/admin/create_layer_info_from_model/{model_name}/",

    // Layer Query Router Endpoints
    LAYER_QUERY_CATEGORIES: "api/dch/layer-query/categories",
    LAYER_QUERY_LAYERS: "api/dch/layer-query/layers",
    LAYER_QUERY_TREE: "api/dch/layer-query/tree",
    LAYER_QUERY_META: "api/dch/layer-query/{identifier}/meta",
    LAYER_QUERY_FIELDS: "api/dch/layer-query/{identifier}/fields",
    LAYER_QUERY_FEATURE_DETAIL: "api/dch/layer-query/{identifier}/feature-detail",
    LAYER_QUERY_COLUMN_VALUE: "api/dch/layer-query/{identifier}/column-value",
    LAYER_QUERY_UPDATE_COLUMN_VALUE: "api/dch/layer-query/{identifier}/update-column-value",
    LAYER_QUERY_DISTINCT_VALUES: "api/dch/layer-query/{identifier}/distinct-values",
    LAYER_QUERY_ATTRIBUTES: "api/dch/layer-query/{identifier}/attributes",
    LAYER_QUERY_FEATURE_EXTENT: "api/dch/layer-query/{identifier}/feature-extent",
    LAYER_QUERY_FEATURE_GEOJSON: "api/dch/layer-query/{identifier}/feature-geojson",
    LAYER_QUERY_FEATURE_GEOJSON_BY_VALUE: "api/dch/layer-query/{identifier}/feature-geojson-by-value",
    DCH_APP_DEFAULT_EXTENT: "api/dch/get_default_extent/",
});

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
    isJSON?: boolean;
    isGzip?: boolean;
    signal?: AbortSignal;
    isBinary?: boolean;
    target?: "map" | "app";
    silentErrors?: boolean;
    headers?: Record<string, string>;
    requires2FA?: boolean;
};

// ============================================================================
// MapApi Class Implementation
// ============================================================================

export default class MapApi {
    public snackbarRef: RefObject<DASnackbarHandle | null>;

    protected readonly defaultTarget: "map" | "app" = "map";

    constructor(snackbarRef: RefObject<DASnackbarHandle | null>) {
        this.snackbarRef = snackbarRef;
    }

    static getBaseURL(
        api: string,
        target: "map" | "app" = "map"
    ): string {
        if (
            /^[a-z][a-z\d+.-]*:\/\//i.test(api) ||
            api.startsWith("//")
        ) {
            return api;
        }

        const config = getDamapConfig();
        const baseUrl = target === "map" ? config.mapUrl : config.appUrl;
        const path = `/${api.replace(/^\/+/, "")}`;
        if (!baseUrl?.trim()) {
            return path;
        }

        return `${baseUrl.trim().replace(/\/+$/, "")}${path}`;
    }

    static applyParamsToURL(urlBase: string, params: Record<string, unknown> = {}): string {
        let url = urlBase;

        if (!params || Object.keys(params).length === 0) {
            return url;
        }

        const queryParams: string[] = [];

        for (const key in params) {
            const value = params[key];
            if (value === undefined || value === null) continue;

            if (url.includes(`{${key}}`)) {
                url = url.replace(new RegExp(`\\{${key}\\}`, "g"), encodeURIComponent(String(value)));
                continue;
            }

            if (Array.isArray(value)) {
                for (const item of value) {
                    if (item === undefined || item === null) continue;
                    queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
                }
                continue;
            }

            queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }

        if (queryParams.length > 0) {
            url += `${url.includes("?") ? "&" : "?"}${queryParams.join("&")}`;
        }

        return url;
    }

    static getURL(
        api: string,
        params: Record<string, unknown> = {},
        target: "map" | "app" = "map"
    ): string {
        const urlBase = this.getBaseURL(api, target);
        return this.applyParamsToURL(urlBase, params);
    }

    private async getHeaders(isJson = true): Promise<Headers> {
        const token = AuthServices.getAccessToken();
        const headers = new Headers();

        if (isJson) {
            headers.append("Content-Type", "application/json");
        }

        if (token) {
            headers.append("Authorization", `Bearer ${token}`);
        }

        return headers;
    }

    private buildRequestBody(method: HttpMethod, data: unknown): BodyInit | undefined {
        if (method === "GET" || data === null || data === undefined) {
            return undefined;
        }

        if (
            data instanceof FormData ||
            typeof data === "string" ||
            data instanceof Blob ||
            data instanceof ArrayBuffer ||
            data instanceof URLSearchParams
        ) {
            return data as BodyInit;
        }

        return JSON.stringify(data);
    }

    private async doFetch(
        url: string,
        method: HttpMethod,
        headers: Headers,
        data: unknown,
        signal?: AbortSignal
    ): Promise<Response> {
        return await fetch(url, {
            method,
            headers,
            credentials: "same-origin",
            body: this.buildRequestBody(method, data),
            signal,
        });
    }

    // ============================================================================
    // Public HTTP Request Wrappers
    // ============================================================================

    async get<T = any>(
        api: string,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        return this.request<T>("GET", api, null, params, options);
    }

    /**
     * Binary array buffer fetch for vector tiles and raster pipelines.
     * Defaults silentErrors to true to prevent snackbar spamming on canvas refreshes.
     */
    async getArrayBuffer(
        api: string,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<ArrayBuffer | null> {
        return this.request<ArrayBuffer>("GET", api, null, params, {
            ...options,
            isJSON: false,
            isBinary: true,
            silentErrors: options.silentErrors ?? true,
        });
    }

    async post<T = any>(
        api: string,
        data: unknown,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        return this.request<T>("POST", api, data, params, options);
    }

    // async postFormData<T = any>(
    //     api: string,
    //     formData: FormData,
    //     params: Record<string, unknown> = {},
    //     options: RequestOptions = {}
    // ): Promise<T | null> {
    //     return this.request<T>("POST", api, formData, params, {
    //         ...options,
    //         isJSON: false,
    //     });
    // }

    async postFormData<T = any>(
        api: string,
        formData: FormData,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        return this.request<T>("POST", api, formData, params, options);
    }

    async put<T = any>(
        api: string,
        data: unknown,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        return this.request<T>("PUT", api, data, params, options);
    }

    async patch<T = any>(
        api: string,
        data: unknown,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        return this.request<T>("PATCH", api, data, params, options);
    }

    async delete<T = any>(
        api: string,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        return this.request<T>("DELETE", api, null, params, options);
    }

    async deleteWithBody<T = any>(
        api: string,
        data: unknown = null,
        params: Record<string, unknown> = {},
        options: RequestOptions = {}
    ): Promise<T | null> {
        return this.request<T>("DELETE", api, data, params, options);
    }

    // ============================================================================
    // Core Request Pipeline
    // ============================================================================

    static decompressDchPayload(res: any): any {
        // 1. Extract the base64 string (handles { payload: "..." } or raw string)
        const base64Str = typeof res === "string" ? res : (res?.payload ?? res?.data ?? res);
        if (!base64Str || typeof base64Str !== "string") {
            return base64Str; // already an object or null
        }

        try {
            // 2. Decode Base64 string to Uint8Array
            const binaryString = atob(base64Str);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // 3. Decompress via pako and parse JSON
            const jsonString = pako.ungzip(bytes, { to: "string" });
            return JSON.parse(jsonString);
        } catch (e) {
            // Fallback: If not base64/gzip, try parsing as raw JSON
            try {
                return JSON.parse(base64Str);
            } catch {
                return base64Str;
            }
        }
    }

    private async request<T = any>(
        method: HttpMethod,
        api: string,
        data: unknown,
        params: Record<string, unknown>,
        options: RequestOptions
    ): Promise<T | null> {
        const {
            isJSON = true,
            isGzip = false,
            isBinary = false,
            signal,
            target = this.defaultTarget,
            silentErrors = false,
            headers: customHeaders = {},
            requires2FA = false,
        } = options;

        try {
            const url = MapApi.getURL(api, params, target);
            // Don't send application/json Content-Type for binary requests or FormData
            const useJsonHeader = isJSON && !isBinary && !(data instanceof FormData);
            let headers = await this.getHeaders(useJsonHeader);


            for (const [key, value] of Object.entries(customHeaders)) {
                // JWT authorization remains managed by AuthServices.
                if (key.toLowerCase() === "authorization") continue;

                headers.set(key, value);
            }

            if (isBinary) {
                headers.append("Accept", "application/x-protobuf, application/vnd.mapbox-vector-tile, */*");
            }

            let response = await this.doFetch(url, method, headers, data, signal);

            // Silent token refresh retry
            // if (response.status === 401) {
            //     const newToken = await AuthServices.refreshAccessToken();
            //
            //     if (newToken) {
            //         headers = await this.getHeaders(useJsonHeader);
            //         if (isBinary) {
            //             headers.append("Accept", "application/x-protobuf, application/vnd.mapbox-vector-tile, */*");
            //         }
            //         response = await this.doFetch(url, method, headers, data, signal);
            //     }
            // }
            if (response.status === 401 && !requires2FA) {
                const refreshResult = await AuthServices.refreshAccessToken();

                if (refreshResult.success) {
                    headers = await this.getHeaders(useJsonHeader);

                    for (const [key, value] of Object.entries(customHeaders)) {
                        if (key.toLowerCase() !== "authorization") {
                            headers.set(key, value);
                        }
                    }

                    if (isBinary) {
                        headers.set(
                            "Accept",
                            "application/x-protobuf, application/vnd.mapbox-vector-tile, */*"
                        );
                    }

                    response = await this.doFetch(
                        url, method, headers, data, signal
                    );
                }
            }

            if (!response.ok) {
                if (!silentErrors) {
                    await this.handleError(response, requires2FA);
                } else {
                    console.warn(`[MapApi] HTTP ${response.status} on ${url}`);
                }
                return null;
            }

            if (response.status === 204) {
                return null;
            }

            // 1. Binary stream branch (MVT, raster, raw buffer)
            if (isBinary) {
                return (await response.arrayBuffer()) as unknown as T;
            }

            const contentType = response.headers.get("content-type") || "";
            if (!contentType) {
                return null;
            }

            // --------------------------------------------------------------------
            // 2. Binary HTTP GZIP stream branch (raw .gz file downloads)
            // Only run if the HTTP Content-Type itself is application/gzip
            // --------------------------------------------------------------------
            if (contentType.includes("application/gzip")) {
                const buffer = await response.arrayBuffer();
                try {
                    const compressedBytes = new Uint8Array(buffer);
                    const decompressedBytes = pako.ungzip(compressedBytes);
                    const decompressedText = new TextDecoder("utf-8").decode(decompressedBytes);
                    const parsed = JSON.parse(decompressedText);
                    return (isJSON ? parsed?.payload ?? parsed : parsed) as T;
                } catch (err) {
                    console.error("Failed to decompress raw GZIP body:", err);
                    if (!silentErrors) {
                        this.snackbarRef.current?.show("Failed to parse compressed server response.", "error");
                    }
                    return null;
                }
            }

            // --------------------------------------------------------------------
            // 3. JSON response branch (handles DCH standard { payload: base64_gzip })
            // --------------------------------------------------------------------
            // if (isJSON && contentType.includes("application/json")) {
            //     try {
            //         const res = await response.json();
            //         const payloadData = res?.payload ?? res;
            //
            //         // If isGzip was set, or if payloadData is a Base64 string from DCHUtils.gzip_data
            //         if (isGzip || typeof payloadData === "string") {
            //             return MapApi.decompressDchPayload(payloadData) as T;
            //         }
            //
            //         return payloadData as T;
            //     } catch (err) {
            //         console.error("Failed to parse JSON response:", err);
            //         return null;
            //     }
            // }
            // 3. JSON response branch (handles DCH standard { payload: ... } for JSON & FormData uploads)
            if (contentType.includes("application/json")) {
                try {
                    const res = await response.json();
                    const payloadData = res?.payload ?? res;

                    // Only decompress when isGzip is explicitly requested
                    if (isGzip && typeof payloadData === "string") {
                        return MapApi.decompressDchPayload(payloadData) as T;
                    }

                    return payloadData as T;
                } catch (err) {
                    console.error("Failed to parse JSON response:", err);
                    return null;
                }
            }

            // 4. Fallback plain text response
            const text = await response.text();
            return text as T;

        } catch (err: any) {
            if (err.name === "AbortError") {
                return null;
            }
            throw err;
        }
    }

    private async handleError(
        response: Response,
        requires2FA = false,
    ): Promise<void> {
        const ref = this.snackbarRef.current;
        let rawMessage: string | object;

        try {
            const contentType = response.headers.get("content-type") || "";

            if (contentType.includes("application/json")) {
                const errorData = await response.json();
                rawMessage =
                    errorData?.message ||
                    errorData?.detail ||
                    errorData?.error ||
                    errorData?.payload?.message ||
                    "";
                if (typeof rawMessage !== "string") {
                    rawMessage = JSON.stringify(rawMessage);
                }
            } else {
                rawMessage = await response.text();
            }
        } catch {
            rawMessage = "";
        }

        const message = toUserFacingApiError(rawMessage, response.status);

        if (response.status === 401 && requires2FA) {
            ref?.show(message || "2FA authorization expired.", "warning");
            return;
        }

        ref?.show(message, "error");

        if (response.status === 401) {
            window.location.href = "/login";
        }
    }
}