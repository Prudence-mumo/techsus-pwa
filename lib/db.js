import Dexie from "dexie";

export const db = new Dexie("TechsusLocalDB");

db.version(1).stores({
  offlinePackages:
    "id, title, subject, stage, files, fileUrl, isDownloaded, isSynced",
  progress: "id, lessonId, status, isSynced",
});

db.version(2).stores({
  offlinePackages: "id, subject, stage, isDownloaded",
  progress: "id, lessonId, status, isSynced",

  topics: "topic_id, [subject_name+class_level], parent_topic_id",
  content: "content_id, topic_id, content_type, content_series_id",

  assessments:
    "client_attempt_id, student_id, topic_id, status, assessment_type",
  lessonProgress:
    "lesson_progress_id, &[student_id+content_id], student_id, topic_id, updated_at",
  topicProgress: "[student_id+topic_id], student_id, subject_name",
  tutorInteractions: "interaction_id, student_id, conversation_id, topic_id",

  tutorConversations:
    "conversationId, studentId, subjectName, title, createdAt, savedAt",

  outbox: "client_event_id, qStatus, qCreatedAt",

  meta: "key",
});

db.version(3)
  .stores({
    offlinePackages: "id, subject, stage, isDownloaded",
    progress: "id, lessonId, status, isSynced",

    topics: "topic_id, [subject_name+class_level], parent_topic_id",
    content: "content_id, topic_id, content_type, content_series_id",

    assessments:
      "client_attempt_id, student_id, topic_id, status, assessment_type",
    lessonProgress:
      "lesson_progress_id, &[student_id+content_id], student_id, topic_id, updated_at",
    topicProgress: "[student_id+topic_id], student_id, subject_name",
    tutorInteractions: "interaction_id, student_id, conversation_id, topic_id",

    tutorConversations:
      "conversationId, studentId, subjectName, title, createdAt, savedAt",

    outbox: "client_event_id, qStatus, qCreatedAt",

    meta: "key",
  })
  .upgrade(() => {
    // Migration: ensure tutorConversations table exists
    console.log("Upgrading database to version 3...");
  });

db.version(4)
  .stores({
    offlinePackages: "id, subject, stage, isDownloaded, studentId",
    progress: "id, lessonId, status, isSynced",

    topics: "topic_id, [subject_name+class_level], parent_topic_id",
    content: "content_id, topic_id, content_type, content_series_id",

    assessments:
      "client_attempt_id, student_id, topic_id, status, assessment_type",
    lessonProgress:
      "lesson_progress_id, &[student_id+content_id], student_id, topic_id, updated_at",
    topicProgress: "[student_id+topic_id], student_id, subject_name",
    tutorInteractions: "interaction_id, student_id, conversation_id, topic_id",

    tutorConversations:
      "conversationId, studentId, subjectName, title, createdAt, savedAt",

    outbox: "client_event_id, qStatus, qCreatedAt",

    meta: "key",
  })
  .upgrade(() => {
    console.log("Upgrading database to version 4...");
  });

export async function getDeviceId() {
  const row = await db.meta.get("device_id");
  if (row) return row.value;
  const value = crypto.randomUUID();
  await db.meta.put({ key: "device_id", value });
  return value;
}
