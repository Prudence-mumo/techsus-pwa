import { API_BASE_URL, ENDPOINTS } from "./config";

const CONFIG_CACHE_KEY = "redu_app_config";
let configRequest;

function normalizeConfig(payload) {
  const classLevels = Array.isArray(payload?.class_levels)
    ? payload.class_levels.filter((level) => typeof level === "string")
    : Array.isArray(payload?.classLevels)
      ? payload.classLevels.filter((level) => typeof level === "string")
      : [];
  const questionCount = Number(
    payload?.assessment?.question_count ?? payload?.assessment?.questionCount,
  );
  const durationSeconds = Number(
    payload?.assessment?.duration_seconds ??
      payload?.assessment?.durationSeconds,
  );

  if (
    classLevels.length === 0 ||
    !Number.isInteger(questionCount) ||
    questionCount < 1 ||
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 1
  ) {
    throw new Error("The backend returned invalid application settings.");
  }

  return {
    classLevels,
    assessment: { questionCount, durationSeconds },
  };
}

function readCachedConfig() {
  try {
    const stored = localStorage.getItem(CONFIG_CACHE_KEY);
    return stored ? normalizeConfig(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

async function loadConfig() {
  const cachedConfig =
    typeof window !== "undefined" ? readCachedConfig() : null;

  if (typeof navigator !== "undefined" && !navigator.onLine && cachedConfig) {
    return cachedConfig;
  }

  if (!API_BASE_URL) {
    if (cachedConfig) return cachedConfig;
    throw new Error("The API base URL is not configured.");
  }

  try {
    const response = await fetch(
      new URL(ENDPOINTS.appConfig, API_BASE_URL).toString(),
      { headers: { Accept: "application/json" }, cache: "no-store" },
    );
    if (!response.ok) {
      throw new Error(
        `Could not load application settings (${response.status}).`,
      );
    }

    const config = normalizeConfig(await response.json());
    try {
      localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
    } catch {}
    return config;
  } catch (error) {
    if (cachedConfig) return cachedConfig;
    throw error;
  }
}

export function fetchAppConfig() {
  if (!configRequest) {
    configRequest = loadConfig().catch((error) => {
      configRequest = null;
      throw error;
    });
  }
  return configRequest;
}
