export const PROGRESS_COLORS = {
  navy: "#1B2269",
  orange: "#F5A623",
  red: "#C62828",
  green: "#43A047",
  track: "#E8EAF3",
};

export function averageOf(values) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function assessmentStatus(score) {
  if (score >= 70) {
    return {
      label: "Performing well",
      icon: "🏆",
      color: PROGRESS_COLORS.green,
    };
  }
  if (score >= 40) {
    return {
      label: "Needs improvement",
      icon: "📈",
      color: PROGRESS_COLORS.orange,
    };
  }
  return { label: "At risk", icon: "⚠️", color: PROGRESS_COLORS.red };
}
