import { getUserId } from "@/lib/session";

const STUDENT_ID_KEY = "redu_student_id";

function getApiRoot() {
  const root = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");

  if (!root) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is missing from .env.local.");
  }

  return root;
}

export function getStudentId() {
  try {
    return localStorage.getItem(STUDENT_ID_KEY) || "";
  } catch {
    return "";
  }
}

export function saveStudentId(id) {
  localStorage.setItem(STUDENT_ID_KEY, id);
}

async function resolveStudentId() {
  const sessionId = await getUserId();
  return sessionId || getStudentId() || "";
}

async function readJson(response) {
  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message =
      typeof body?.detail === "string"
        ? body.detail
        : `Backend request failed (${response.status})`;

    throw new Error(message);
  }

  return body;
}

function conversationUrl(studentId) {
  return `${getApiRoot()}/ai-tutor/students/${encodeURIComponent(studentId)}/conversations`;
}

function toConversation(summary) {
  return {
    conversationId: summary.conversation_id,
    topicId: summary.topic_id,
    subjectName: summary.subject_name || "",
    title: summary.conversation_title || "",
    interactionCount: summary.interaction_count ?? 0,
    createdAt: summary.created_at,
    isSavedOffline: summary.is_saved_offline === true,
  };
}

export async function fetchConversations({ search = "", signal } = {}) {
  const studentId = await resolveStudentId();

  if (!studentId) {
    throw new Error(
      "No learner is signed in, so conversations cannot be loaded.",
    );
  }

  const baseUrl = conversationUrl(studentId);
  const query = search.trim().slice(0, 200);

  if (!query) {
    const response = await fetch(baseUrl, { signal });
    const summaries = await readJson(response);
    return summaries.map(toConversation);
  }

  const searchParams = new URLSearchParams({ q: query });

  const [titleResponse, messageResponse] = await Promise.all([
    fetch(baseUrl, { signal }),
    fetch(`${baseUrl}?${searchParams}`, { signal }),
  ]);

  const titleSummaries = await readJson(titleResponse);
  const messageSummaries = await readJson(messageResponse);
  const matches = new Map(
    messageSummaries.map((summary) => [summary.conversation_id, summary]),
  );
  const lowerQuery = query.toLocaleLowerCase();

  for (const summary of titleSummaries) {
    if (
      (summary.conversation_title || "")
        .toLocaleLowerCase()
        .includes(lowerQuery)
    ) {
      matches.set(summary.conversation_id, summary);
    }
  }

  return Array.from(matches.values()).map(toConversation);
}

export async function fetchConversationInteractions(conversationId) {
  const studentId = await resolveStudentId();

  if (!studentId) {
    throw new Error(
      "No learner is signed in, so conversations cannot be loaded.",
    );
  }

  const url = `${conversationUrl(studentId)}/${encodeURIComponent(conversationId)}`;

  return readJson(await fetch(url));
}

export async function saveConversationOffline(conversationId) {
  const studentId = await resolveStudentId();

  if (!studentId) {
    throw new Error(
      "No learner is signed in, so this conversation cannot be saved.",
    );
  }

  const baseUrl = `${conversationUrl(studentId)}/${encodeURIComponent(conversationId)}`;

  const patchResponse = await fetch(`${baseUrl}/save-for-offline-use`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_saved_offline: true }),
  });

  if (patchResponse.ok) {
    const result = await patchResponse.json();
    return result.interactions;
  }

  if (patchResponse.status !== 404) {
    await readJson(patchResponse);
  }

  const getResponse = await fetch(baseUrl);
  const conversation = await readJson(getResponse);

  return Array.isArray(conversation)
    ? conversation
    : Array.isArray(conversation?.interactions)
      ? conversation.interactions
      : [];
}
