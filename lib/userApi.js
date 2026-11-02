import { API_BASE_URL, ENDPOINTS } from "@/lib/config";
import { getUserId, authHeaders } from "@/lib/session";

async function request(path) {
  // Combine base URL and path without hardcoding or duplicating slashes
  const baseUrl = (API_BASE_URL || "").replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = `${baseUrl}${cleanPath}`;

  const res = await fetch(targetUrl, {
    headers: await authHeaders(),
  });

  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export async function fetchLearner() {
  const userId = await getUserId();
  if (!userId) return null;
  return request(ENDPOINTS.user(userId));
}

export async function fetchAllProgress() {
  return request(ENDPOINTS.progress);
}

export async function fetchStudentProgressSummary(studentId) {
  const id = studentId || (await getUserId());
  if (!id) return null;
  return request(`${ENDPOINTS.studentProgress(id)}/summary`);
}

export async function fetchLessonReview(topicId, studentId) {
  return request(ENDPOINTS.lessonReview(topicId, studentId));
}

export async function fetchDashboard() {
  const userId = await getUserId();
  if (!userId) return null;
  return request(ENDPOINTS.studentSummary(userId));
}
