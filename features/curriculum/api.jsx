const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const SUMMARY_PATH = process.env.NEXT_PUBLIC_STUDENT_SUMMARY_PATH;
const LESSONS_PATH = process.env.NEXT_PUBLIC_LESSONS_PATH;

export async function fetchProgressSummary(studentId) {
  try {
    const res = await fetch(`${BASE_URL}${SUMMARY_PATH}/${studentId}/summary`);
    if (!res.ok) throw new Error("Failed to fetch progress summary");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function fetchLessonContent(classLevel, subjectName, topicSlug) {
  try {
    const res = await fetch(
      `${BASE_URL}${LESSONS_PATH}/${classLevel}/${subjectName}/${topicSlug}`,
    );
    if (!res.ok) throw new Error("Failed to fetch lesson content");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}
