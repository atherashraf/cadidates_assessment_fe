// src/libs/damap/api/authServices.ts

import MapApi from "./MapApi";

import type {
    AuthSnackbarHandler,
    ConfigureAuthOptions,
    DAMapRole,
    DAMapUserBase,
    NormalizeAuthUser,
} from "../types/authTypes";


const STORAGE_KEYS = {
    accessToken: "accessToken",
    refreshToken: "refreshToken",
    user: "user",
} as const;


export const AUTH_EVENTS = {
    login: "auth-login",
    logout: "auth-logout",
    userUpdated: "auth-user-updated",
} as const;


type JwtPayload = {
    exp?: number;
    sub?: string;
    [key: string]: unknown;
};


type LoginResponse = {
    token?: {
        accessToken?: string;
        refreshToken?: string;
    };
    userInfo?: unknown;
};


type RefreshResponse = {
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
};


type ApiMessageResponse = {
    message?: string;
    detail?: string;
};


export interface RefreshResult {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
}


export interface AuthOperationResult {
    success: boolean;
    message: string;
}


export class AuthServices {
    private static refreshPromise:
        Promise<RefreshResult> | null = null;

    private static profileSyncPromise:
        Promise<DAMapUserBase | null> | null = null;

    private static lastErrorMessage:
        string | null = null;

    private static snackbarHandler:
        AuthSnackbarHandler | null = null;


    /**
     * Default normalization for applications that do not provide their
     * own application-specific normalizer.
     */
    private static normalizeUser:
        NormalizeAuthUser<DAMapUserBase> = (
        raw,
    ) => {
        if (
            raw === null ||
            typeof raw !== "object" ||
            Array.isArray(raw)
        ) {
            return null;
        }

        const value =
            raw as Record<string, unknown>;

        const id = value.id;
        const username = value.username;

        if (
            (
                typeof id !== "number" &&
                typeof id !== "string"
            ) ||
            typeof username !== "string" ||
            username.trim().length === 0
        ) {
            return null;
        }

        const name =
            typeof value.name === "string"
                ? value.name
                : null;

        const email =
            typeof value.email === "string"
                ? value.email
                : null;

        const roles = Array.isArray(value.roles)
            ? value.roles.filter(
                (role): role is DAMapRole =>
                    typeof role === "string",
            )
            : [];

        return {
            id,
            username,
            name,
            email,
            roles,

            isSuperuser: Boolean(
                value.isSuperuser ??
                value.is_superuser,
            ),

            isStaff: Boolean(
                value.isStaff ??
                value.is_staff,
            ),

            isActive:
                value.isActive !== false &&
                value.is_active !== false,

            isVerified:
                value.isVerified !== false &&
                value.is_verified !== false,
        };
    };


    static configureAuth<
        TUser extends DAMapUserBase = DAMapUserBase,
    >(
        options: ConfigureAuthOptions<TUser>,
    ): void {
        if (options.normalizeUser) {
            this.normalizeUser =
                options.normalizeUser as
                    NormalizeAuthUser<DAMapUserBase>;
        }

        if (options.snackbar) {
            this.snackbarHandler =
                options.snackbar;
        }
    }


    private static showMessage(
        message: string,
        severity:
            | "success"
            | "error"
            | "warning"
            | "info" = "info",
    ): void {
        this.snackbarHandler?.(
            message,
            severity,
        );
    }


    private static dispatchAuthEvent(
        eventName: string,
    ): void {
        window.dispatchEvent(
            new Event(eventName),
        );
    }


    static getLastErrorMessage():
        string | null {
        return this.lastErrorMessage;
    }


    static saveToStorage<
        TUser extends DAMapUserBase,
    >(
        accessToken: string,
        refreshToken: string,
        user: TUser,
    ): void {
        this.updateAccessToken(accessToken);
        this.updateRefreshToken(refreshToken);
        this.updateUser(user);
    }


    static updateAccessToken(
        accessToken: string,
    ): void {
        sessionStorage.setItem(
            STORAGE_KEYS.accessToken,
            accessToken,
        );
    }


    static updateRefreshToken(
        refreshToken: string,
    ): void {
        localStorage.setItem(
            STORAGE_KEYS.refreshToken,
            refreshToken,
        );
    }


    static updateUser<
        TUser extends DAMapUserBase,
    >(
        user: TUser,
    ): void {
        localStorage.setItem(
            STORAGE_KEYS.user,
            JSON.stringify(user),
        );
    }


    static clearStorage(): void {
        sessionStorage.removeItem(
            STORAGE_KEYS.accessToken,
        );

        localStorage.removeItem(
            STORAGE_KEYS.refreshToken,
        );

        localStorage.removeItem(
            STORAGE_KEYS.user,
        );
    }


    private static clearAccessToken(): void {
        sessionStorage.removeItem(
            STORAGE_KEYS.accessToken,
        );
    }


    static getAccessToken():
        string | null {
        return sessionStorage.getItem(
            STORAGE_KEYS.accessToken,
        );
    }


    static getRefreshToken():
        string | null {
        return localStorage.getItem(
            STORAGE_KEYS.refreshToken,
        );
    }


    static getUser<
        TUser extends DAMapUserBase = DAMapUserBase,
    >(): TUser | null {
        const storedUser =
            localStorage.getItem(
                STORAGE_KEYS.user,
            );

        if (!storedUser) {
            return null;
        }

        try {
            const parsed: unknown =
                JSON.parse(storedUser);

            const normalized =
                this.normalizeUser(parsed);

            if (!normalized) {
                localStorage.removeItem(
                    STORAGE_KEYS.user,
                );

                return null;
            }

            return normalized as TUser;
        } catch (error) {
            console.error(
                "Failed to parse stored user:",
                error,
            );

            localStorage.removeItem(
                STORAGE_KEYS.user,
            );

            return null;
        }
    }


    static getDisplayName():
        string | null {
        const user = this.getUser();

        return (
            user?.name ||
            user?.username ||
            null
        );
    }


    static getUserRoles<
        TUser extends DAMapUserBase = DAMapUserBase,
    >(
        user: TUser | null = null,
    ): DAMapRole[] {
        const resolvedUser =
            user ?? this.getUser<TUser>();

        if (
            !resolvedUser ||
            !this.isValidUser(resolvedUser)
        ) {
            return [];
        }

        const roles = resolvedUser.roles;

        if (
            resolvedUser.isSuperuser &&
            !roles.includes("superuser")
        ) {
            return [
                "superuser",
                ...roles,
            ];
        }

        return roles;
    }


    static hasRole<
        TUser extends DAMapUserBase = DAMapUserBase,
    >(
        role: DAMapRole,
        user: TUser | null = null,
    ): boolean {
        return this
            .getUserRoles(user)
            .includes(role);
    }


    static isSuperuser<
        TUser extends DAMapUserBase = DAMapUserBase,
    >(
        user: TUser | null = null,
    ): boolean {
        const resolvedUser =
            user ?? this.getUser<TUser>();

        return Boolean(
            resolvedUser &&
            this.isValidUser(resolvedUser) &&
            resolvedUser.isSuperuser,
        );
    }


    private static decodeJwtPayload(
        token: string,
    ): JwtPayload | null {
        if (
            !token ||
            token === "undefined" ||
            token === "null"
        ) {
            return null;
        }

        try {
            const parts = token.split(".");

            if (parts.length !== 3) {
                return null;
            }

            const base64 = parts[1]
                .replace(/-/g, "+")
                .replace(/_/g, "/");

            const padded = base64.padEnd(
                base64.length +
                (
                    (
                        4 -
                        base64.length % 4
                    ) % 4
                ),
                "=",
            );

            const decoded: unknown =
                JSON.parse(atob(padded));

            if (
                decoded === null ||
                typeof decoded !== "object" ||
                Array.isArray(decoded)
            ) {
                return null;
            }

            return decoded as JwtPayload;
        } catch {
            return null;
        }
    }


    private static isTokenExpired(
        token: string | null | undefined,
    ): boolean {
        if (!token) {
            return true;
        }

        const payload =
            this.decodeJwtPayload(token);

        if (
            typeof payload?.exp !== "number"
        ) {
            return true;
        }

        const bufferSeconds = 30;

        const currentTime =
            Math.floor(
                Date.now() / 1000,
            );

        return (
            payload.exp -
            bufferSeconds <=
            currentTime
        );
    }


    static getTokenExpiry(
        token: string,
    ): number | null {
        const payload =
            this.decodeJwtPayload(token);

        return typeof payload?.exp === "number"
            ? payload.exp
            : null;
    }


    private static isValidUser(
        user: DAMapUserBase | null,
    ): user is DAMapUserBase {
        return Boolean(
            user &&
            user.isActive !== false &&
            user.isVerified !== false,
        );
    }


    /**
     * Checks local state and refreshes the access token when necessary.
     *
     * Unlike the earlier implementation, a valid access token does not
     * require a refresh token to be present.
     */
    static async isLoggedIn():
        Promise<boolean> {
        const user = this.getUser();

        if (!this.isValidUser(user)) {
            return false;
        }

        const accessToken =
            this.getAccessToken();

        if (
            accessToken &&
            !this.isTokenExpired(accessToken)
        ) {
            return true;
        }

        const refreshToken =
            this.getRefreshToken();

        if (
            refreshToken &&
            !this.isTokenExpired(refreshToken)
        ) {
            const result =
                await this.refreshAccessToken();

            return (
                result.success &&
                this.isValidUser(
                    this.getUser(),
                )
            );
        }

        this.clearStorage();

        return false;
    }


    static hasUsableSessionSync():
        boolean {
        const user = this.getUser();

        if (!this.isValidUser(user)) {
            return false;
        }

        const accessToken =
            this.getAccessToken();

        if (
            accessToken &&
            !this.isTokenExpired(accessToken)
        ) {
            return true;
        }

        const refreshToken =
            this.getRefreshToken();

        return Boolean(
            refreshToken &&
            !this.isTokenExpired(refreshToken),
        );
    }


    /**
     * Validates the stored session and synchronizes the latest user
     * profile, including application AOI fields.
     */
    static async checkAndRefreshLogin():
        Promise<boolean> {
        let accessToken =
            this.getAccessToken();

        if (
            !accessToken ||
            this.isTokenExpired(accessToken)
        ) {
            const refreshResult =
                await this.refreshAccessToken();

            if (!refreshResult.success) {
                return false;
            }

            accessToken =
                refreshResult.accessToken ??
                this.getAccessToken();
        }

        if (!accessToken) {
            return false;
        }

        const user =
            await this.syncUserProfileFromServer();

        if (!this.isValidUser(user)) {
            this.clearStorage();
            return false;
        }

        return true;
    }


    static async syncUserProfileFromServer<
        TUser extends DAMapUserBase = DAMapUserBase,
    >(): Promise<TUser | null> {
        const token =
            await this.getValidAccessToken();

        if (!token) {
            return this.getUser<TUser>();
        }

        if (!this.profileSyncPromise) {
            this.profileSyncPromise =
                this.fetchAndStoreUserProfile()
                    .finally(() => {
                        this.profileSyncPromise =
                            null;
                    });
        }

        return this.profileSyncPromise as
            Promise<TUser | null>;
    }


    private static async fetchAndStoreUserProfile<
        TUser extends DAMapUserBase = DAMapUserBase,
    >(): Promise<TUser | null> {
        try {
            /*
             * authenticatedFetch refreshes and retries once if the current
             * access token receives a 401 response.
             */
            const response =
                await this.authenticatedFetch(
                    MapApi.getURL(
                        AuthAPIs.AUTH_USER_INFO,
                    ),
                );

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                this.clearStorage();
                return null;
            }

            if (!response.ok) {
                return this.getUser<TUser>();
            }

            const data: unknown =
                await response.json();

            let rawUser = data;

            if (
                data !== null &&
                typeof data === "object" &&
                !Array.isArray(data)
            ) {
                const value =
                    data as Record<string, unknown>;

                rawUser =
                    value.user ??
                    value.userInfo ??
                    data;
            }

            const user =
                this.normalizeUser(
                    rawUser,
                ) as TUser | null;

            if (!user) {
                /*
                 * Do not overwrite a valid stored user if the server
                 * temporarily returns an unexpected response shape.
                 */
                return this.getUser<TUser>();
            }

            if (!this.isValidUser(user)) {
                this.clearStorage();
                return null;
            }

            this.updateUser(user);

            this.dispatchAuthEvent(
                AUTH_EVENTS.userUpdated,
            );

            return user;
        } catch (error) {
            console.error(
                "Failed to synchronize user profile:",
                error,
            );

            return this.getUser<TUser>();
        }
    }


    static async performLogin<
        TUser extends DAMapUserBase = DAMapUserBase,
    >(
        username: string,
        password: string,
    ): Promise<TUser | null> {
        this.lastErrorMessage = null;

        try {
            const url = MapApi.getURL(
                AuthAPIs.AUTH_LOGIN_JSON,
            )
            console.log("login url: ", url)
            const response =
                await fetch(url,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            username,
                            password,
                        }),
                    },
                );

            if (!response.ok) {
                const errorMessage =
                    await this.getApiErrorMessage(
                        response,
                        "Incorrect username or password",
                    );

                this.lastErrorMessage =
                    errorMessage;

                this.showMessage(
                    errorMessage,
                    "error",
                );

                return null;
            }

            const data =
                await response.json() as
                    LoginResponse;

            const accessToken =
                data.token?.accessToken;

            const refreshToken =
                data.token?.refreshToken;

            const user =
                this.normalizeUser(
                    data.userInfo,
                ) as TUser | null;

            if (
                !accessToken ||
                !refreshToken ||
                !user
            ) {
                this.lastErrorMessage =
                    "Invalid login response from server";

                this.showMessage(
                    this.lastErrorMessage,
                    "error",
                );

                return null;
            }

            if (!this.isValidUser(user)) {
                this.clearStorage();

                this.lastErrorMessage =
                    "Sorry, your account is not active.";

                this.showMessage(
                    this.lastErrorMessage,
                    "error",
                );

                return null;
            }

            this.saveToStorage(
                accessToken,
                refreshToken,
                user,
            );

            this.showMessage(
                `Welcome ${
                    user.name ||
                    user.username
                }!`,
                "success",
            );

            this.dispatchAuthEvent(
                AUTH_EVENTS.login,
            );

            return user;
        } catch (error) {
            console.error(
                "Login error:",
                error,
            );

            this.lastErrorMessage =
                "Login failed due to a network/server error";

            this.showMessage(
                this.lastErrorMessage,
                "error",
            );

            return null;
        }
    }


    static async verifyAccessToken():
        Promise<boolean> {
        const token =
            this.getAccessToken();

        if (
            !token ||
            this.isTokenExpired(token)
        ) {
            const refreshResult =
                await this.refreshAccessToken();

            return refreshResult.success;
        }

        try {
            const response =
                await fetch(
                    MapApi.getURL(
                        AuthAPIs.AUTH_VERIFY_TOKEN,
                    ),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            token,
                        }),
                    },
                );

            if (response.ok) {
                return true;
            }

            const refreshResult =
                await this.refreshAccessToken();

            return refreshResult.success;
        } catch (error) {
            console.error(
                "Token verification failed:",
                error,
            );

            return false;
        }
    }


    static async refreshAccessToken():
        Promise<RefreshResult> {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise =
            this.executeTokenRefresh()
                .finally(() => {
                    this.refreshPromise = null;
                });

        return this.refreshPromise;
    }


    private static async executeTokenRefresh():
        Promise<RefreshResult> {
        const refreshToken =
            this.getRefreshToken();

        if (
            !refreshToken ||
            this.isTokenExpired(refreshToken)
        ) {
            this.clearStorage();

            return {
                success: false,
            };
        }

        try {
            const response =
                await fetch(
                    MapApi.getURL(
                        AuthAPIs
                            .AUTH_REFRESH_ACCESS_TOKEN,
                    ),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            refresh: refreshToken,
                        }),
                    },
                );

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                this.clearStorage();

                return {
                    success: false,
                };
            }

            if (!response.ok) {
                this.clearAccessToken();

                return {
                    success: false,
                };
            }

            const data =
                await response.json() as
                    RefreshResponse;

            const accessToken =
                data.accessToken;

            const newRefreshToken =
                data.refreshToken ??
                refreshToken;

            if (!accessToken) {
                this.clearAccessToken();

                return {
                    success: false,
                };
            }

            const user = this.getUser();

            if (!user) {
                this.clearStorage();

                return {
                    success: false,
                };
            }

            this.saveToStorage(
                accessToken,
                newRefreshToken,
                user,
            );

            return {
                success: true,
                accessToken,
                refreshToken:
                newRefreshToken,
            };
        } catch (error) {
            console.error(
                "Token refresh failed:",
                error,
            );

            /*
             * Keep the refresh token and user on network errors.
             */
            this.clearAccessToken();

            return {
                success: false,
            };
        }
    }


    static async forgotPassword(
        username: string,
    ): Promise<AuthOperationResult> {
        try {
            const response =
                await fetch(
                    MapApi.getURL(
                        AuthAPIs.FORGOT_PASSWORD,
                    ),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            username,
                        }),
                    },
                );

            return {
                success: response.ok,
                message:
                    await this.getApiErrorMessage(
                        response,
                        response.ok
                            ? "Password reset link sent."
                            : "Failed to send reset link.",
                    ),
            };
        } catch (error) {
            console.error(
                "Forgot password error:",
                error,
            );

            return {
                success: false,
                message:
                    "Network/server error. Please try again later.",
            };
        }
    }


    static async resetPassword(
        token: string,
        newPassword: string,
    ): Promise<AuthOperationResult> {
        try {
            const response =
                await fetch(
                    MapApi.getURL(
                        AuthAPIs.RESET_PASSWORD,
                    ),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            token,
                            new_password:
                            newPassword,
                        }),
                    },
                );

            return {
                success: response.ok,
                message:
                    await this.getApiErrorMessage(
                        response,
                        response.ok
                            ? "Password has been reset."
                            : "Failed to reset password.",
                    ),
            };
        } catch (error) {
            console.error(
                "Reset password error:",
                error,
            );

            return {
                success: false,
                message:
                    "Network/server error. Please try again later.",
            };
        }
    }


    private static async getApiErrorMessage(
        response: Response,
        fallback: string,
    ): Promise<string> {
        try {
            const data =
                await response.json() as
                    ApiMessageResponse;

            return (
                data.detail ||
                data.message ||
                fallback
            );
        } catch {
            return fallback;
        }
    }


    static performLogout(
        options?: {
            silent?: boolean;
        },
    ): void {
        this.clearStorage();

        this.dispatchAuthEvent(
            AUTH_EVENTS.logout,
        );

        if (!options?.silent) {
            this.showMessage(
                "Logged out",
                "info",
            );
        }
    }


    static async getValidAccessToken():
        Promise<string | null> {
        const accessToken =
            this.getAccessToken();

        if (
            accessToken &&
            !this.isTokenExpired(accessToken)
        ) {
            return accessToken;
        }

        const refreshResult =
            await this.refreshAccessToken();

        return refreshResult.success
            ? (
                refreshResult.accessToken ??
                this.getAccessToken()
            )
            : null;
    }


    static async getAuthHeader():
        Promise<Record<string, string>> {
        const token =
            await this.getValidAccessToken();

        return token
            ? {
                Authorization:
                    `Bearer ${token}`,
            }
            : {};
    }


    /**
     * Bearer tokens are attached only to the configured API origin.
     */
    private static isTrustedApiUrl(
        targetUrl: string,
    ): boolean {
        try {
            const target =
                new URL(
                    targetUrl,
                    window.location.origin,
                );

            const configuredApi =
                new URL(
                    MapApi.getURL(
                        AuthAPIs.AUTH_USER_INFO,
                    ),
                    window.location.origin,
                );

            return (
                target.origin ===
                configuredApi.origin
            );
        } catch {
            return false;
        }
    }


    static async authenticatedFetch(
        input: RequestInfo | URL,
        init: RequestInit = {},
    ): Promise<Response> {
        const originalRequest =
            new Request(input, init);

        const retryRequest =
            originalRequest.clone();

        const trusted =
            this.isTrustedApiUrl(
                originalRequest.url,
            );

        const headers =
            new Headers(
                originalRequest.headers,
            );

        if (!trusted) {
            /*
             * Prevent a DAMap bearer token supplied through defaults from
             * being forwarded to an external origin.
             */
            headers.delete("Authorization");

            return fetch(
                new Request(
                    originalRequest,
                    {
                        headers,
                    },
                ),
            );
        }

        const accessToken =
            await this.getValidAccessToken();

        if (accessToken) {
            headers.set(
                "Authorization",
                `Bearer ${accessToken}`,
            );
        }

        const response =
            await fetch(
                new Request(
                    originalRequest,
                    {
                        headers,
                    },
                ),
            );

        if (response.status !== 401) {
            return response;
        }

        const refreshResult =
            await this.refreshAccessToken();

        if (!refreshResult.success) {
            return response;
        }

        const retryToken =
            refreshResult.accessToken ??
            this.getAccessToken();

        if (!retryToken) {
            return response;
        }

        const retryHeaders =
            new Headers(
                retryRequest.headers,
            );

        retryHeaders.set(
            "Authorization",
            `Bearer ${retryToken}`,
        );

        return fetch(
            new Request(
                retryRequest,
                {
                    headers: retryHeaders,
                },
            ),
        );
    }
}


export const AuthAPIs =
    Object.freeze({
        AUTH_LOGIN_JSON:
            "api/auth/jwt/login/json/",

        AUTH_VERIFY_TOKEN:
            "api/auth/jwt/token/verify/",

        AUTH_REFRESH_ACCESS_TOKEN:
            "api/auth/jwt/refresh_access_token/",

        AUTH_USER_INFO:
            "api/auth/jwt/user_info/",

        FORGOT_PASSWORD:
            "api/auth/forgot-password/",

        RESET_PASSWORD:
            "api/auth/reset-password/",
    });


export default AuthServices;