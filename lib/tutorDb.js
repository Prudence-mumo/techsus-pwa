import Dexie from "dexie";

export const tutorDb = new Dexie("TechsusTutorDB");
tutorDb.version(2).stores({
  tutorConversations: "conversationId, studentId, subjectName, createdAt",
});
