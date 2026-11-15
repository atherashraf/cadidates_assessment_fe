/**
 * Turn raw API / exception payloads into short messages safe for UI.
 * Full server tracebacks stay in the console / server logs only.
 */

const TRACEBACK_MARKERS = [
  "Traceback (most recent call last)",
  "File \"/usr/",
  "File \"/app/",
  "site-packages/",
  "sqlalchemy.exc.",
  "psycopg2.errors.",
  "starlette.",
  "fastapi.",
] as const;

function looksLikeInternalTraceback(text: string): boolean {
  if (text.length > 400) return true;
  return TRACEBACK_MARKERS.some((marker) => text.includes(marker));
}

function extractJsonField(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    const parsed = JSON.parse(trimmed) as {
      detail?: unknown;
      message?: unknown;
      error?: unknown;
    };
    for (const value of [parsed.detail, parsed.message, parsed.error]) {
      if (typeof value === "string" && value.trim()) return value.trim();
      if (Array.isArray(value) && value.length) {
        const first = value[0];
        if (typeof first === "string") return first;
        if (first && typeof first === "object" && "msg" in first) {
          const msg = (first as { msg?: unknown }).msg;
          if (typeof msg === "string" && msg.trim()) return msg.trim();
        }
      }
    }
  } catch {
    /* not JSON */
  }
  return null;
}

function classifyKnownFailure(text: string): string | null {
  const lower = text.toLowerCase();

  if (
    lower.includes("diskfull") ||
    lower.includes("no space left on device") ||
    lower.includes("could not write to file")
  ) {
    return "Database storage is full. Please free disk space on the server and try again.";
  }

  if (lower.includes("connection refused") || lower.includes("could not connect")) {
    return "Unable to reach the database. Please try again shortly.";
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "The request timed out. Please try again.";
  }

  if (lower.includes("nameerror") && lower.includes("is not defined")) {
    return "A server configuration error occurred. Please contact the administrator.";
  }

  if (lower.includes("<!doctype") || lower.includes("<html")) {
    return "Unexpected response from the server. Please refresh and try again.";
  }

  return null;
}

function defaultMessageForStatus(status?: number): string {
  switch (status) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 408:
    case 504:
      return "The request timed out. Please try again.";
    case 502:
    case 503:
      return "The service is temporarily unavailable. Please try again shortly.";
    case 500:
    default:
      return status && status >= 500
        ? "A server error occurred. Please try again or contact the administrator."
        : "Something went wrong. Please try again.";
  }
}

export function toUserFacingApiError(raw: unknown, status?: number): string {
  let text = "";
  if (typeof raw === "string") {
    text = raw.trim();
  } else if (raw instanceof Error) {
    text = raw.message.trim();
  } else if (raw != null) {
    text = String(raw).trim();
  }

  if (!text) return defaultMessageForStatus(status);

  const fromJson = extractJsonField(text);
  const candidate = fromJson ?? text;

  const known = classifyKnownFailure(candidate) ?? classifyKnownFailure(text);
  if (known) return known;

  if (looksLikeInternalTraceback(candidate)) {
    return defaultMessageForStatus(status ?? 500);
  }

  if (candidate.length <= 220 && !candidate.includes("\n")) {
    return candidate;
  }

  return defaultMessageForStatus(status);
}
