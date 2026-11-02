export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/i, "");

const USERS_PATH = process.env.NEXT_PUBLIC_USERS_PATH || "/api/v1/users";
const PROGRESS_STUDENT_PATH =
  process.env.NEXT_PUBLIC_PROGRESS_STUDENT_PATH || "/api/v1/progress/student";
const STUDENT_SUMMARY_PATH =
  process.env.NEXT_PUBLIC_STUDENT_SUMMARY_PATH || "/api/v1/content/student";
const AI_TUTOR_PATH =
  process.env.NEXT_PUBLIC_AI_TUTOR_PATH || "/api/v1/ai-tutor/students";
const LESSONS_PATH =
  process.env.NEXT_PUBLIC_LESSONS_PATH || "/api/v1/content/lessons";

export const ENDPOINTS = {
  login: process.env.NEXT_PUBLIC_LOGIN_PATH || "/api/v1/auth/login",
  currentUser: process.env.NEXT_PUBLIC_CURRENT_USER_PATH || "/api/v1/users/me",
  register: process.env.NEXT_PUBLIC_REGISTER_PATH || "/api/v1/auth/register",
  recoveryRequest:
    process.env.NEXT_PUBLIC_RECOVERY_REQUEST_PATH ||
    "/api/v1/auth/recover/request",
  recoveryComplete:
    process.env.NEXT_PUBLIC_RECOVERY_COMPLETE_PATH ||
    "/api/v1/auth/recover/complete",
  logoutCandidates: [
    process.env.NEXT_PUBLIC_LOGOUT_PATH || "/api/v1/auth/logout",
  ],
  appConfig: process.env.NEXT_PUBLIC_APP_CONFIG_PATH || "/api/v1/config",
  topics: process.env.NEXT_PUBLIC_TOPICS_PATH || "/api/v1/topics",
  assessmentStart:
    process.env.NEXT_PUBLIC_ASSESSMENT_START_PATH ||
    "/api/v1/assessments/start",
  packages: process.env.NEXT_PUBLIC_PACKAGES_PATH || "/api/v1/offline-packages",
  syncEvent: process.env.NEXT_PUBLIC_SYNC_EVENT_PATH || "/api/v1/sync-events",
  dictionarySearch:
    process.env.NEXT_PUBLIC_DICTIONARY_SEARCH_PATH ||
    "/api/v1/content/dictionary/search",
  progress: process.env.NEXT_PUBLIC_PROGRESS_PATH || "/api/v1/progress/",
  user: (id) => `${USERS_PATH}/${id}`,
  studentProgress: (id) => `${PROGRESS_STUDENT_PATH}/${id}`,
  studentSummary: (id) => `${STUDENT_SUMMARY_PATH}/${id}/summary`,
  tutorAsk:
    process.env.NEXT_PUBLIC_TUTOR_ASK_PATH || "/api/v1/content/ask-question",
  tutorConversations: (id) =>
    `${AI_TUTOR_PATH}/${encodeURIComponent(id)}/conversations`,
  lesson: (classLevel, subject, topic) =>
    `${LESSONS_PATH}/${classLevel}/${subject}/${topic}`,
  lessonReview: (topicId, studentId) =>
    `/api/v1/content/topics/${topicId}/review/${studentId}`,
};

export const MESSAGES = {
  wordNotFound:
    process.env.NEXT_PUBLIC_MESSAGE_WORD_NOT_FOUND ||
    "We could not find that word.",
  requestFailed:
    process.env.NEXT_PUBLIC_MESSAGE_REQUEST_FAILED ||
    "Something went wrong. Please try again.",
  noExample:
    process.env.NEXT_PUBLIC_MESSAGE_NO_EXAMPLE ||
    "No example is available yet.",
};
