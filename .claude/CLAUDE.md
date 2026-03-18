# Development Workflow

Every time code is created or modified, follow this mandatory workflow before delivering results. Do NOT skip steps.

## Step 1 — Code
Write or edit the code as requested.

## Step 2 — Code Review
Spawn the `code-review` agent to review all changes.
- If verdict is **NEEDS CHANGES**: fix every critical issue and warning, then re-run the code-review agent until you get **PASS** or **PASS WITH NOTES**.
- Only proceed when the review passes.

## Step 3 — QA
Spawn the `qa` agent to generate and run tests for the changed code.
- If any test **fails**: analyze the failure, fix the source code (not the tests, unless the test itself is wrong), then re-run the qa agent.
- Only proceed when all tests pass.

## Step 4 — Deliver
Only after both review and tests pass, present the final result to the user.
