import { API_BASE_URL, ENDPOINTS } from "@/lib/config";
import { authHeaders, getClassLevel, getUserId } from "@/lib/session";

export async function askTutor({
  question,
  subject,
  conversationId,
  topicTitle,
}) {
  // 1. Retrieve the student ID dynamically from the session store
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Unauthorized: Learner authentication required.");
  }
  if (!API_BASE_URL) {
    throw new Error("The API base URL is not configured.");
  }

  const classLevel = await getClassLevel();
  if (!classLevel) {
    throw new Error("Your learner class level is missing or unsupported.");
  }

  // 2. Construct the request payload
  const payload = {
    student_id: String(userId),
    student_question: question,
    body: question,
    subject_name: subject ? subject.toLowerCase() : "",
    class_level: classLevel,
  };

  if (conversationId) {
    payload.conversation_id = conversationId;
  }

  if (topicTitle) {
    payload.topic_title = topicTitle;
  }

  // 3. Execute the API request with proper auth headers
  const endpoint = new URL(ENDPOINTS.tutorAsk, API_BASE_URL).toString();
  const headers = await authHeaders();

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Tutor request failed (${res.status}): ${detail}`);
  }

  const data = await res.json();
  return {
    answer: data.ai_response ?? data.content_text ?? data.response ?? "",
    media_url: data.media_url ?? null,
    content_id: data.content_id ?? null,
  };
}
