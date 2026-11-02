function required(name, value) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getAssessmentsConfig() {
  return {
    apiBaseUrl: required(
      "NEXT_PUBLIC_API_BASE_URL",
      process.env.NEXT_PUBLIC_API_BASE_URL,
    ),
    overviewPath: required(
      "NEXT_PUBLIC_ASSESSMENTS_OVERVIEW_PATH",
      process.env.NEXT_PUBLIC_ASSESSMENTS_OVERVIEW_PATH,
    ),
    tutorPath: required(
      "NEXT_PUBLIC_TUTOR_ASK_PATH",
      process.env.NEXT_PUBLIC_TUTOR_ASK_PATH,
    ),
  };
}
