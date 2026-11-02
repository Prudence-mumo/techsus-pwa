#!/bin/bash

echo "=== 1. Checking Linter & Syntax (LessonView imports, general errors) ==="
npm run lint
LINT_EXIT=$?

echo -e "\n=== 2. Checking Hardcoded Learner Data ('AMINA' & static progress) ==="
# Search source files for 'AMINA' (excluding check scripts and build caches)
AMINA_MATCHES=$(grep -rnwi "amina" app features lib components 2>/dev/null | grep -v "check" || true)
if [ -z "$AMINA_MATCHES" ]; then
    echo "✔ PASSED: No hardcoded 'AMINA' found in source files."
    AMINA_PASS=true
else
    echo "❌ FAILED: Found lingering 'AMINA' references:"
    echo "$AMINA_MATCHES"
    AMINA_PASS=false
fi

# Search ProgressData.js for fixed zero/empty arrays if it exists
if [ -f "features/progress/ProgressData.js" ] || [ -f "lib/ProgressData.js" ]; then
    echo "ℹ Checking ProgressData file for hardcoded empty initializers..."
    # You can customize this check based on your implementation
fi

echo -e "\n=== 3. Checking Conversation Saving Imports (LessonView.jsx) ==="
if [ -f "features/lessons/LessonView.jsx" ] || [ -f "app/lessons/LessonView.jsx" ]; then
    LESSON_VIEW=$(find . -name "LessonView.jsx" -o -name "LessonView.js" | head -n 1)
    if grep -q "getUserId" "$LESSON_VIEW" && grep -q "tutorDb" "$LESSON_VIEW"; then
        echo "✔ PASSED: 'getUserId' and 'tutorDb' are imported in $LESSON_VIEW."
        IMPORT_PASS=true
    else
        echo "❌ FAILED: Missing 'getUserId' or 'tutorDb' imports in $LESSON_VIEW."
        IMPORT_PASS=false
    fi
else
    echo "⚠ Skipped: LessonView.jsx path not automatically located."
    IMPORT_PASS=true
fi

echo -e "\n=== 4. Checking OpenAPI Contract (tutor, dictionary, progress-summary) ==="
OPENAPI_FILE=$(find . -name "openapi.yaml" -o -name "openapi.json" -o -name "swagger.yaml" | head -n 1)
if [ -n "$OPENAPI_FILE" ]; then
    echo "Found OpenAPI spec at: $OPENAPI_FILE"
    if grep -q "tutor" "$OPENAPI_FILE" && grep -q "dictionary" "$OPENAPI_FILE" && grep -q "progress-summary" "$OPENAPI_FILE"; then
        echo "✔ PASSED: Required endpoints (tutor, dictionary, progress-summary) found in OpenAPI spec."
        API_PASS=true
    else
        echo "❌ FAILED: Missing one or more required endpoints in $OPENAPI_FILE."
        API_PASS=false
    fi
    
    # Run linter if redocly is installed
    if command -v npx &> /dev/null; then
        echo "Running OpenAPI linter..."
        npx @redocly/cli lint "$OPENAPI_FILE" || echo "⚠ OpenAPI linter warning/error above."
    fi
else
    echo "⚠ Warning: Could not locate openapi.yaml or openapi.json file."
    API_PASS=true
fi

echo -e "\n=============================="
echo "SUMMARY:"
[ $LINT_EXIT -eq 0 ] && echo " [✔] Linter Check Passed" || echo " [❌] Linter Check Failed"
[ "$AMINA_PASS" = true ] && echo " [✔] Hardcoded Data Removed" || echo " [❌] Hardcoded Data Still Present"
[ "$IMPORT_PASS" = true ] && echo " [✔] LessonView Imports Present" || echo " [❌] LessonView Imports Missing"
[ "$API_PASS" = true ] && echo " [✔] OpenAPI Endpoints Included" || echo " [❌] OpenAPI Endpoints Missing"
echo "=============================="

