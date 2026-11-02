check() { if eval "$2" >/dev/null 2>&1; then echo "PASS  $1"; else echo "FAIL  $1"; fi; }

check "1 ProgressData has no fixed data" "! grep -nE '^export const (SUBJECT_PROGRESS|MASTERED_TOPICS|IN_PROGRESS_TOPICS|GAPS|TOPICS_MASTERED_COUNT|FEATURED_SUBJECT)' features/progress/ProgressData.js"
check "1 all five progress views use useProgress" "[ \$(grep -l 'useProgress' features/progress/*View.jsx features/progress/ProgressOverview.jsx | wc -l) -eq 5 ]"
check "2 LessonView imports getUserId" "grep -qE 'import[^;]*getUserId' features/curriculum/LessonView.jsx"
check "2 LessonView imports tutorDb" "grep -qE 'import[^;]*tutorDb' features/curriculum/LessonView.jsx"
check "2 LessonView guards missing studentId" "grep -q 'if (!studentId)' features/curriculum/LessonView.jsx"
check "3 no hardcoded learner name" "! grep -rniE 'amina|^\s*Learner\s*$|>Learner<' app features lib"
check "3 no hardcoded RECOMMENDATIONS" "! grep -rn 'RECOMMENDATIONS' app features lib"
check "4 message env vars only read in config" "! grep -rn 'NEXT_PUBLIC_MESSAGE_' app features lib | grep -v lib/config.js"
for v in TUTOR_ASK_PATH DICTIONARY_SEARCH_PATH STUDENT_SUMMARY_PATH PROGRESS_STUDENT_PATH AI_TUTOR_PATH; do
  p=$(grep "^NEXT_PUBLIC_$v=" .env.local | cut -d= -f2-)
  check "5 spec documents $v" "[ -n \"$p\" ] && grep -qF \"$p\" openapi.yaml"
done
check "6 base URL read only in config" "[ \$(grep -rl 'process.env.NEXT_PUBLIC_API_BASE_URL' app features lib | grep -v lib/config.js | wc -l) -eq 0 ]"
check "no old env vars or hardcoded paths" "! grep -rnE 'NEXT_PUBLIC_API_URL|NEXT_PUBLIC_STUDENT_ID|/api/v1' app features lib"
check "work is committed" "git diff --quiet HEAD && git diff --cached --quiet"
check "lint" "npm run lint --silent"
check "build" "npm run build --silent"

echo "--- 6 files that call fetch without authHeaders ---"
for f in $(grep -rl "fetch(" app features lib); do grep -q "authHeaders" "$f" || echo "REVIEW $f"; done
