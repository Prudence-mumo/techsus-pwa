import { db } from "./db";
import { tutorDb } from "./tutorDb";
import { fetchAppConfig } from "./appConfig";

const DEV_ID = process.env.NEXT_PUBLIC_DEV_STUDENT_ID ?? "";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export function resolveUserName(user = {}) {
  const candidates = [
    user.userName,
    user.display_name,
    user.displayName,
    user.name,
    user.full_name,
    user.fullName,
    user.username,
    user.email,
    user.first_name,
    user.last_name,
    user.firstName,
    user.lastName,
  ];

  const direct = candidates.find(
    (value) => typeof value === "string" && value.trim(),
  );

  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const first = [user.first_name, user.firstName].find(
    (value) => typeof value === "string" && value.trim(),
  );
  const last = [user.last_name, user.lastName].find(
    (value) => typeof value === "string" && value.trim(),
  );

  const combined = [first, last].filter(Boolean).join(" ").trim();
  return combined || "Student";
}

export function resolveUserClass(user = {}) {
  const candidates = [
    user.class_name,
    user.className,
    user.class_level,
    user.classLevel,
    user.grade_name,
    user.gradeName,
    user.grade_level,
    user.gradeLevel,
    user.current_class,
    user.currentClass,
    user.level_name,
    user.levelName,
    user.level,
  ];

  const direct = candidates.find(
    (value) => typeof value === "string" && value.trim(),
  );

  if (typeof direct === "string" && direct.trim()) {
    return direct.trim();
  }

  const numericLevel = [user.class_level, user.grade_level, user.level].find(
    (value) => Number.isFinite(Number(value)),
  );

  if (typeof numericLevel !== "undefined") {
    return `Level ${numericLevel}`;
  }

  return "Student";
}

export async function setSession({ userId, token, userName, userClass }) {
  await db.meta.put({
    key: "session",
    value: { userId, token, userName, userClass },
  });
}

export async function clearSession() {
  await db.meta.delete("session");
  try {
    await db.tutorConversations.clear();
    await db.offlinePackages.clear();
  } catch {}
  try {
    await tutorDb.tutorConversations.clear();
  } catch {}
}

export async function getSession() {
  const row = await db.meta.get("session");
  if (row?.value?.userId) return row.value;

  const isDevOrMock = process.env.NODE_ENV === "development" || USE_MOCK;

  if (isDevOrMock && DEV_ID) {
    return { userId: DEV_ID, token: null };
  }

  return { userId: null, token: null };
}

export async function getStudentId() {
  const { userId } = await getSession();
  return userId;
}

export async function getUserId() {
  const { userId } = await getSession();
  return userId;
}

export async function getUserName() {
  const session = await getSession();
  return resolveUserName(session);
}

export async function getUserClass() {
  const session = await getSession();
  return resolveUserClass(session);
}

export async function getClassLevel() {
  const session = await getSession();
  const classLevels = [session.classLevel, session.userClass]
    .filter((candidate) => typeof candidate === "string")
    .map((candidate) => candidate.trim().toUpperCase());
  const classLevel = classLevels.find(Boolean);
  if (!classLevel) return null;

  try {
    const config = await fetchAppConfig();
    return config.classLevels.includes(classLevel) ? classLevel : null;
  } catch {
    return null;
  }
}

export async function authHeaders() {
  const { token } = await getSession();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
