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

## Step 4 — Deploy Verification
When changes are pushed to `main`, the GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically builds and deploys to Firebase Hosting.
- After pushing, verify the deploy succeeded by running: `gh run list --limit 1`
- If the run is `in_progress`, watch it with: `gh run watch <run-id> --exit-status`
- If the run **failed**, check logs with: `gh run view <run-id> --log-failed`, fix the issue, and push again.
- Only proceed when the deploy status is **success**.
- Site URL: https://databaserpg-5595b.web.app

## Step 5 — Deliver
Only after review, tests, and deploy pass, present the final result to the user.
