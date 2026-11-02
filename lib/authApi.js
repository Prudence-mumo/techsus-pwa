import { ENDPOINTS } from "@/lib/config";

function getApiBase() {
  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("config_error");
  }

  return base
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/i, "");
}

function buildApiUrl(path) {
  const base = getApiBase();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath.startsWith("/api/v1")) {
    return `${base}${normalizedPath}`;
  }

  return `${base}${normalizedPath}`;
}

export function formatBackendError(errorData) {
  const detail = errorData?.detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.msg) return item.msg;
        if (item?.message) return item.message;
        return null;
      })
      .filter(Boolean)
      .join(" ");
  }
  if (typeof detail === "string" && detail) return detail;
  return null;
}

export async function apiRequest(
  path,
  { method = "GET", body, headers = {} } = {},
) {
  const res = await fetch(buildApiUrl(path), {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

export async function loginRequest(payload) {
  const res = await apiRequest(ENDPOINTS.login, {
    method: "POST",
    body: payload,
  });
  return res;
}

export async function getCurrentUser(token) {
  const res = await apiRequest(ENDPOINTS.currentUser, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res;
}

export async function registerRequest(payload) {
  const res = await apiRequest(ENDPOINTS.register, {
    method: "POST",
    body: payload,
  });
  return res;
}

export async function requestRecovery(payload) {
  const res = await apiRequest(ENDPOINTS.recoveryRequest, {
    method: "POST",
    body: payload,
  });
  return res;
}

export async function completeRecovery(payload) {
  const res = await apiRequest(ENDPOINTS.recoveryComplete, {
    method: "POST",
    body: payload,
  });
  return res;
}

export async function logoutRequest(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  for (const path of ENDPOINTS.logoutCandidates) {
    try {
      const res = await apiRequest(path, {
        method: "POST",
        headers,
      });

      if (
        res &&
        (res.ok ||
          res.status === 204 ||
          res.status === 401 ||
          res.status === 403 ||
          res.status === 404)
      ) {
        return res;
      }
    } catch {
      // Ignore endpoint-specific failures and try the next known logout route.
    }
  }

  return null;
}
