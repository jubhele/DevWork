# /proposal-review — BlackFire Proposal Quality Review

Review a BlackFire security proposal for quality before it is sent to a client.
Target document: $ARGUMENTS (file path, or describe the proposal if no file is given).

## Context
BlackFire Solutions is a South African security company. Proposals go to corporate clients
(e.g. AECI Chempark). They must be professional, technically accurate, commercially sound,
and never use language that makes the engagement sound like a pilot or trial.

## Review dimensions

### 1. Executive clarity  (weight: high)
- Can a non-technical executive understand the value proposition in the first 2 paragraphs?
- Is there a clear problem statement, a clear proposed solution, and a clear outcome?
- Is there a named point-of-contact for BlackFire?

### 2. Technical accuracy  (weight: high)
- Are all system names, product names, and integrations correctly described?
- Are claimed capabilities (e.g. "24/7 monitoring", "sub-5-minute response") supported by the
  service model described elsewhere in the proposal?
- Cross-check against memory: 3 active vendors — BlackFire monitoring, tactical reaction
  provider (R6k/month flat), separate physical guard company.

### 3. Commercial completeness  (weight: high)
- Is pricing broken down clearly (setup, monthly recurring, per-incident costs)?
- Are SLAs and response-time commitments explicit?
- Are exclusions and assumptions listed?

### 4. Language and tone  (weight: medium)
- Professional and confident — never apologetic or speculative.
- No "demo", "pilot", "trial", "test" language — this is a live service.
- No passive voice for commitments ("will be done" → "BlackFire will do").
- South African English spelling (e.g. "organisation", "licence" for noun, "authorize" is OK).

### 5. Brand consistency  (weight: medium)
- Company name is "BlackFire Solutions" on first use, "BlackFire" thereafter — never "Blackfire" or "BLACKFIRE".
- Use "the Umlilo Portal" for the software platform — never "the system" or "the portal" alone on first use.

### 6. Risk and compliance flags  (weight: medium)
- POPIA compliance language for any personal data handling.
- Liability cap / indemnity clauses present?
- Insurance cover mentioned?

## Output format

Score each dimension 1–5. Provide an overall readiness score.

```
## Proposal Review — <document name> — YYYY-MM-DD

| Dimension             | Score | Notes                              |
|-----------------------|-------|------------------------------------|
| Executive clarity     |  /5   |                                    |
| Technical accuracy    |  /5   |                                    |
| Commercial completeness| /5   |                                    |
| Language & tone       |  /5   |                                    |
| Brand consistency     |  /5   |                                    |
| Risk & compliance     |  /5   |                                    |
| **Overall**           | **/30**|                                   |

### Critical issues (must fix before sending)
1. ...

### Recommended improvements
1. ...

### Verdict
[READY TO SEND | NEEDS REVISION | DO NOT SEND — CRITICAL ISSUES]
```
