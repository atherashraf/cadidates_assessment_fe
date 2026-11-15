
import MapApi, { MapAPIs } from "./MapApi";
import { AuthServices, AUTH_EVENTS } from "./authServices";

// ============================================================
// Types
// ============================================================

export interface VerifyOTPRequest {
    application_code: string;
    team_code: string;
    otp: string;
    permission: string;
}

export interface VerifyOTPResponse {
    verified: boolean;
    permission: string;
}

export interface Create2FASessionRequest {
    application_code: string;
    team_code: string;
    form_code: string;
    otp: string;
}

export interface TwoFactorSession {
    active: boolean;
    form_code: string;
    permissions: string[];
    expires_at: string;
}

export interface Create2FASessionResponse
    extends TwoFactorSession {
    session_token: string;
}

export interface Close2FASessionResponse {
    closed: boolean;
}

interface Stored2FASession extends TwoFactorSession {
    session_token: string;
}

// ============================================================
// Events
// ============================================================

export const TWO_FACTOR_EVENTS = {
    sessionCreated: "2fa-session-created",
    sessionUpdated: "2fa-session-updated",
    sessionClosed: "2fa-session-closed",
    sessionExpired: "2fa-session-expired",
    sessionsCleared: "2fa-sessions-cleared",
} as const;

export interface TwoFactorEventDetail {
    formCode?: string;
}

type TwoFactorEventName =
    (typeof TWO_FACTOR_EVENTS)[keyof typeof TWO_FACTOR_EVENTS];

// ============================================================
// Service
// ============================================================

export class TwoFactorAuthService {

    private static readonly sessions =
        new Map<string, Stored2FASession>();

    // Incremented when local authorization is invalidated.
    // Prevents stale API responses from restoring old sessions.
    private static readonly revisions =
        new Map<string, number>();

    private static globalRevision = 0;

    private static readonly apiTarget = "app" as const;

    private static initialized = false;

    // --------------------------------------------------------
    // Initialization
    // --------------------------------------------------------

    static initialize(): void {
        if (this.initialized) return;

        this.initialized = true;

        window.addEventListener(
            AUTH_EVENTS.logout,
            () => this.clearAllSessions(),
        );

        window.addEventListener(
            AUTH_EVENTS.login,
            () => this.clearAllSessions(),
        );
    }

    // --------------------------------------------------------
    // Internal Helpers
    // --------------------------------------------------------

    private static emit(
        eventName: TwoFactorEventName,
        formCode?: string,
    ): void {
        window.dispatchEvent(
            new CustomEvent<TwoFactorEventDetail>(
                eventName,
                {
                    detail: { formCode },
                },
            ),
        );
    }

    private static normalizeFormCode(
        formCode: string,
    ): string {
        const value = formCode.trim();

        if (!value) {
            throw new Error("form_code is required.");
        }

        return value;
    }

    private static normalizeOTP(otp: string): string {
        const value = otp.trim();

        if (!/^\d{6}$/.test(value)) {
            throw new Error(
                "OTP must contain exactly six digits.",
            );
        }

        return value;
    }

    private static requireJWT(): void {
        if (!AuthServices.getAccessToken()) {
            throw new Error(
                "Authentication is required before using 2FA.",
            );
        }
    }

    private static isExpired(
        session: Stored2FASession,
    ): boolean {
        const expiry = Date.parse(session.expires_at);

        return (
            !session.active ||
            !Number.isFinite(expiry) ||
            expiry <= Date.now()
        );
    }

    private static getRevision(formCode: string): number {
        return this.revisions.get(formCode) ?? 0;
    }

    private static invalidate(formCode: string): void {
        this.revisions.set(
            formCode,
            this.getRevision(formCode) + 1,
        );
    }

    private static isCurrentRequest(
        formCode: string,
        revision: number,
        globalRevision: number,
    ): boolean {
        return (
            this.getRevision(formCode) === revision &&
            this.globalRevision === globalRevision
        );
    }

    private static getStoredSession(
        formCode: string,
    ): Stored2FASession | null {
        const key = this.normalizeFormCode(formCode);
        const session = this.sessions.get(key);

        if (!session) return null;

        if (this.isExpired(session)) {
            this.sessions.delete(key);
            this.invalidate(key);

            this.emit(
                TWO_FACTOR_EVENTS.sessionExpired,
                key,
            );

            return null;
        }

        return session;
    }

    // --------------------------------------------------------
    // 1. Verify OTP
    // --------------------------------------------------------

    static async verifyOTP(
        api: MapApi,
        payload: VerifyOTPRequest,
    ): Promise<VerifyOTPResponse | null> {
        this.initialize();
        this.requireJWT();

        const request: VerifyOTPRequest = {
            application_code: payload.application_code.trim(),
            team_code: payload.team_code.trim(),
            permission: payload.permission.trim(),
            otp: this.normalizeOTP(payload.otp),
        };

        if (
            !request.application_code ||
            !request.team_code ||
            !request.permission
        ) {
            throw new Error(
                "Application, team and permission are required.",
            );
        }

        return api.post<VerifyOTPResponse>(
            MapAPIs.API_2FA_VERIFY_OTP,
            request,
            {},
            {
                target: this.apiTarget,
            },
        );
    }

    // --------------------------------------------------------
    // 2. Create Session
    // --------------------------------------------------------

    static async createSession(
        api: MapApi,
        payload: Create2FASessionRequest,
    ): Promise<Create2FASessionResponse | null> {
        this.initialize();
        this.requireJWT();

        const formCode = this.normalizeFormCode(
            payload.form_code,
        );

        const request: Create2FASessionRequest = {
            application_code: payload.application_code.trim(),
            team_code: payload.team_code.trim(),
            form_code: formCode,
            otp: this.normalizeOTP(payload.otp),
        };

        if (!request.application_code || !request.team_code) {
            throw new Error(
                "Application and team are required.",
            );
        }

        // Invalidate any existing local session and any
        // outstanding validation requests for this form.
        this.clearSession(formCode);

        const revision = this.getRevision(formCode);
        const globalRevision = this.globalRevision;

        const response =
            await api.post<Create2FASessionResponse>(
                MapAPIs.API_2FA_CREATE_SESSION,
                request,
                {},
                {
                    target: this.apiTarget,
                },
            );

        // Ignore responses arriving after logout or closure.
        if (
            !this.isCurrentRequest(
                formCode,
                revision,
                globalRevision,
            )
        ) {
            return null;
        }

        if (
            !response?.active ||
            !response.session_token ||
            response.form_code !== formCode ||
            !Array.isArray(response.permissions) ||
            !Number.isFinite(
                Date.parse(response.expires_at),
            ) ||
            Date.parse(response.expires_at) <= Date.now()
        ) {
            return null;
        }

        this.sessions.set(formCode, {
            active: true,
            form_code: formCode,
            permissions: [...response.permissions],
            expires_at: response.expires_at,
            session_token: response.session_token,
        });

        this.emit(
            TWO_FACTOR_EVENTS.sessionCreated,
            formCode,
        );

        return response;
    }

    // --------------------------------------------------------
    // 3. Validate Session With Backend
    // --------------------------------------------------------

    static async getSession(
        api: MapApi,
        formCode: string,
    ): Promise<TwoFactorSession | null> {
        this.initialize();
        this.requireJWT();

        const key = this.normalizeFormCode(formCode);
        const stored = this.getStoredSession(key);

        if (!stored) return null;

        const revision = this.getRevision(key);
        const globalRevision = this.globalRevision;

        const response =
            await api.get<TwoFactorSession>(
                MapAPIs.API_2FA_SESSION,
                {
                    form_code: key,
                },
                {
                    target: this.apiTarget,
                    requires2FA: true,
                    silentErrors: true,
                    headers: {
                        "X-OTP-Session": stored.session_token,
                    },
                },
            );

        if (
            !this.isCurrentRequest(
                key,
                revision,
                globalRevision,
            )
        ) {
            return null;
        }

        if (
            !response?.active ||
            response.form_code !== key ||
            !Array.isArray(response.permissions) ||
            !Number.isFinite(
                Date.parse(response.expires_at),
            ) ||
            Date.parse(response.expires_at) <= Date.now()
        ) {
            this.clearSession(key);
            return null;
        }

        // Keep the original token; update metadata only.
        this.sessions.set(key, {
            active: true,
            form_code: key,
            permissions: [...response.permissions],
            expires_at: response.expires_at,
            session_token: stored.session_token,
        });

        this.emit(
            TWO_FACTOR_EVENTS.sessionUpdated,
            key,
        );

        return response;
    }

    // --------------------------------------------------------
    // 4. Close Session
    // --------------------------------------------------------

    static async closeSession(
        api: MapApi,
        formCode: string,
    ): Promise<boolean> {
        this.initialize();

        const key = this.normalizeFormCode(formCode);
        const stored = this.getStoredSession(key);

        // Immediately remove local authorization.
        this.clearSession(key);

        if (!stored) return true;

        const response =
            await api.post<Close2FASessionResponse>(
                MapAPIs.API_2FA_CLOSE_SESSION,
                null,
                {
                    form_code: key,
                },
                {
                    target: this.apiTarget,
                    requires2FA: true,
                    silentErrors: true,
                    headers: {
                        "X-OTP-Session": stored.session_token,
                    },
                },
            );

        return response?.closed === true;
    }

    // --------------------------------------------------------
    // 5. Get Session Token
    // --------------------------------------------------------

    static getSessionToken(
        formCode: string,
    ): string | null {
        this.initialize();

        return (
            this.getStoredSession(formCode)
                ?.session_token ?? null
        );
    }

    // --------------------------------------------------------
    // 6. Get Headers For Protected Requests
    // --------------------------------------------------------

    static getSessionHeaders(
        formCode: string,
    ): Record<string, string> {
        const token = this.getSessionToken(formCode);

        if (!token) return {};

        return {
            "X-OTP-Session": token,
        };
    }

    // --------------------------------------------------------
    // 7. Clear One Session
    // --------------------------------------------------------

    static clearSession(
        formCode: string,
    ): void {
        const key = this.normalizeFormCode(formCode);

        const existed = this.sessions.delete(key);

        // Invalidate pending requests even if no session exists.
        this.invalidate(key);

        if (existed) {
            this.emit(
                TWO_FACTOR_EVENTS.sessionClosed,
                key,
            );
        }
    }

    // --------------------------------------------------------
    // 8. Clear All Sessions
    // --------------------------------------------------------

    static clearAllSessions(): void {
        this.globalRevision++;
        this.sessions.clear();
        this.revisions.clear();

        this.emit(
            TWO_FACTOR_EVENTS.sessionsCleared,
        );
    }

    // --------------------------------------------------------
    // 9. Local Session Checks
    // --------------------------------------------------------

    static hasSession(formCode: string): boolean {
        return this.getStoredSession(formCode) !== null;
    }

    static hasPermission(
        formCode: string,
        permission: string,
    ): boolean {
        const session = this.getStoredSession(formCode);

        return Boolean(
            session &&
            session.permissions.includes(permission),
        );
    }

    static getLocalSession(
        formCode: string,
    ): TwoFactorSession | null {
        const session = this.getStoredSession(formCode);

        if (!session) return null;

        return {
            active: session.active,
            form_code: session.form_code,
            permissions: [...session.permissions],
            expires_at: session.expires_at,
        };
    }

    static getActiveForms(): string[] {
        return [...this.sessions.keys()].filter(
            (formCode) => this.hasSession(formCode),
        );
    }
}

export default TwoFactorAuthService;
