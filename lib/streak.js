export function calculateStreak(activityEvents) {
  if (!Array.isArray(activityEvents) || activityEvents.length === 0) {
    return 0;
  }

  const dateStrings = activityEvents
    .map((event) => {
      const raw =
        event?.created_at ?? event?.timestamp ?? event?.last_viewed_at;
      if (!raw) return null;
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return null;
      return date.toISOString().split("T")[0];
    })
    .filter(Boolean);

  if (dateStrings.length === 0) return 0;

  const activeDays = [...new Set(dateStrings)].sort((a, b) =>
    a < b ? 1 : a > b ? -1 : 0,
  );

  const dayMs = 86400000;

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - dayMs).toISOString().split("T")[0];

  if (activeDays[0] !== todayStr && activeDays[0] !== yesterdayStr) {
    return 0;
  }

  let cursor = activeDays[0] === todayStr ? todayStr : yesterdayStr;
  let streak = 0;

  for (let i = 0; i < activeDays.length; i++) {
    if (activeDays[i] === cursor) {
      streak += 1;

      const d = new Date(cursor + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - 1);
      cursor = d.toISOString().split("T")[0];
    } else {
      break;
    }
  }

  return streak;
}

export default calculateStreak;
