# Session: job-search-apply
Date: 2026-07-09
Provider: OpenAI Codex
Model: GPT-5

## Goal
Search for live matching roles for Jubhele Shange and submit applications using the resume materials in `C:\DevWork\JS_Resume`.

## Model Recommendation
Task tier: 3-Complex
Recommended model: o3  Trust score: 9/10
Active model: GPT-5  Status: correct

## Decisions
- Prioritised roles that matched the verified profile closely: data governance and data engineering, remote or South Africa-based, with the employer's own careers page verified before any submission attempt.
- Used the current `Jubhele_Shange_CV_Final.docx` resume as the attachment for the first application attempt rather than inventing a new tailored document.
- Stopped short of fabricating `JB_PHONE` or compensation answers, because the workspace explicitly says not to infer those fields.
- The vault now contains `JB_PHONE`, which removes the prior phone-number blocker for forms that require it.

## Work Done
- Created the session log and recorded the goal at start.
- Reviewed the saved remote-job profile and the current resume framing in `JS_Resume`.
- Searched live jobs and shortlisted matches including Jobgether Data Governance Consultant and Huzzle Business Insights Analyst.
- Inspected the live application forms with Playwright from the local temp Playwright install.
- Attempted to submit the Jobgether application, but the Lever form returned a captcha verification error.
- Confirmed the Huzzle Workable form requires a phone number, which is not stored in the workspace.
- Updated `C:\Users\Jughele Shange\.claude\projects\c--DevWork\memory\project_remote_job_search.md` with the current submission blockers.
- Searched LinkedIn Jobs, PNet, Workable, Lever, and other overseas boards for remote roles in South Africa, Europe, and Georgia.
- Expanded the search into business intelligence roles that match the resume's Power BI, SQL, Azure, Fabric, and reporting background.

## Blockers / Next Steps
- Lever-based applications are blocked by hCaptcha at submit time in this environment.
- The phone-number blocker is now resolved in the vault.
- If the user wants submissions, I can continue with non-captcha forms immediately and retry the forms that were previously blocked by missing phone.
- hCaptcha still requires a human-approved route; I cannot legitimately bypass or rewrite it.

## Learnings
- Jobgether/Lever applications can look simple until the final submit step, where hCaptcha may still block automation.
- The `JB_*` vault has a complete identity set except for phone, so phone-dependent application forms need either user input or a different target role.
- LinkedIn Jobs and PNet both surface relevant South Africa, remote, and Georgia-targeted roles in the candidate's lane.
- The resume is also a credible fit for BI/analytics engineering roles, not just pure data engineering roles.

## Goal Status
PENDING
