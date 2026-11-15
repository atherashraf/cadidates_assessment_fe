// src/libs/damap/types/authTypes.ts

/**
 * User identifier supported by DAMap.
 *
 * Some backends return numeric IDs, while others may return UUIDs
 * or other string identifiers.
 */
export type DAMapUserId = number | string;


/**
 * DAMap currently represents roles by their unique string names.
 *
 * Examples:
 * - "admin"
 * - "survey_manager"
 * - "app_manager"
 */
export type DAMapRole = string;


/**
 * Authentication user fields shared by every DAMap application.
 *
 * Application-specific fields should be added by extending this
 * interface. Do not use `[key: string]: unknown` here because that
 * would weaken TypeScript property checking.
 */
export interface DAMapUserBase {
    /**
     * These fields are required because a valid authenticated user
     * must have an identity and username.
     */
    id: DAMapUserId;
    username: string;

    name?: string | null;
    email?: string | null;

    /**
     * The normalizer should always return an array, even when the
     * backend does not include roles.
     */
    roles: DAMapRole[];

    isSuperuser?: boolean;
    isStaff?: boolean;
    isActive?: boolean;
    isVerified?: boolean;
}


/**
 * Converts an untrusted API value into a validated application user.
 *
 * `unknown` is intentionally used only at the API boundary. After
 * normalization, the application receives a strongly typed TUser.
 */
export type NormalizeAuthUser<
    TUser extends DAMapUserBase = DAMapUserBase,
> = (
    raw: unknown,
) => TUser | null;


/**
 * Supported authentication notification levels.
 */
export type AuthSnackbarSeverity =
    | "success"
    | "error"
    | "warning"
    | "info";


/**
 * Optional host-application snackbar integration.
 */
export type AuthSnackbarHandler = (
    message: string,
    severity?: AuthSnackbarSeverity,
) => void;


/**
 * Configuration supplied by the host application to AuthServices.
 */
export interface ConfigureAuthOptions<
    TUser extends DAMapUserBase = DAMapUserBase,
> {
    normalizeUser?: NormalizeAuthUser<TUser>;
    snackbar?: AuthSnackbarHandler;
}


/**
 * Example host-application integration
 * ------------------------------------
 *
 * DAMap remains independent of application-specific AOI fields.
 * The host application extends DAMapUserBase with the fields added
 * by its backend UserAOI implementation.
 *
 * Example:
 *
 * import {
 *     AuthServices,
 *     type DAMapUserBase,
 *     type NormalizeAuthUser,
 * } from "damap";
 *
 * import { appSnackbarRef } from "@/core/AppSnackbar";
 *
 * export interface WasaUser extends DAMapUserBase {
 *     distId?: number | null;
 *     distName?: string | null;
 *
 *     wasaDivId?: number | null;
 *     wasaDivName?: string | null;
 *
 *     wasaSubdivId?: number | null;
 *     wasaSubdivName?: string | null;
 *
 *     description?: string | null;
 * }
 *
 * export const normalizeAuthUser:
 *     NormalizeAuthUser<WasaUser> = (
 *         raw,
 *     ) => {
 *         if (
 *             raw === null ||
 *             typeof raw !== "object" ||
 *             Array.isArray(raw)
 *         ) {
 *             return null;
 *         }
 *
 *         const value =
 *             raw as Record<string, unknown>;
 *
 *         const id = value.id;
 *         const username = value.username;
 *
 *         if (
 *             (
 *                 typeof id !== "number" &&
 *                 typeof id !== "string"
 *             ) ||
 *             typeof username !== "string" ||
 *             username.trim().length === 0
 *         ) {
 *             return null;
 *         }
 *
 *         return {
 *             id,
 *             username,
 *
 *             name:
 *                 typeof value.name === "string"
 *                     ? value.name
 *                     : null,
 *
 *             email:
 *                 typeof value.email === "string"
 *                     ? value.email
 *                     : null,
 *
 *             roles: Array.isArray(value.roles)
 *                 ? value.roles.filter(
 *                       (role): role is string =>
 *                           typeof role === "string",
 *                   )
 *                 : [],
 *
 *             isSuperuser: Boolean(
 *                 value.is_superuser ??
 *                 value.isSuperuser,
 *             ),
 *
 *             isStaff: Boolean(
 *                 value.is_staff ??
 *                 value.isStaff,
 *             ),
 *
 *             isActive:
 *                 value.is_active !== false &&
 *                 value.isActive !== false,
 *
 *             isVerified:
 *                 value.is_verified !== false &&
 *                 value.isVerified !== false,
 *
 *             distId:
 *                 (
 *                     value.dist_id ??
 *                     value.distId ??
 *                     null
 *                 ) as number | null,
 *
 *             distName:
 *                 (
 *                     value.dist_name ??
 *                     value.distName ??
 *                     null
 *                 ) as string | null,
 *
 *             wasaDivId:
 *                 (
 *                     value.wasa_div_id ??
 *                     value.wasaDivId ??
 *                     null
 *                 ) as number | null,
 *
 *             wasaDivName:
 *                 (
 *                     value.wasa_div_name ??
 *                     value.wasaDivName ??
 *                     null
 *                 ) as string | null,
 *
 *             wasaSubdivId:
 *                 (
 *                     value.wasa_subdiv_id ??
 *                     value.wasaSubdivId ??
 *                     null
 *                 ) as number | null,
 *
 *             wasaSubdivName:
 *                 (
 *                     value.wasa_subdiv_name ??
 *                     value.wasaSubdivName ??
 *                     null
 *                 ) as string | null,
 *
 *             description:
 *                 typeof value.description === "string"
 *                     ? value.description
 *                     : null,
 *         };
 *     };
 *
 * AuthServices.configureAuth<WasaUser>({
 *     normalizeUser: normalizeAuthUser,
 *     snackbar: (message, severity) => {
 *         appSnackbarRef.current?.show(
 *             message,
 *             severity,
 *         );
 *     },
 * });
 *
 * const user =
 *     AuthServices.getUser<WasaUser>();
 *
 * console.log(user?.wasaDivName);
 */