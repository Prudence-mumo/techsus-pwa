import { getAssessmentsConfig } from "./config";
import { authHeaders } from "@/lib/session";

async function request(path, init) {
  const { apiBaseUrl } = getAssessmentsConfig();
  const sessionHeaders = await authHeaders();
  const response = await fetch(new URL(path, apiBaseUrl), {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...sessionHeaders,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export function fetchAssessmentsOverview(signal) {
  const { overviewPath } = getAssessmentsConfig();
  return request(overviewPath, { signal });
}

export function askTutor(question) {
  const { tutorPath } = getAssessmentsConfig();
  return request(tutorPath, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}
