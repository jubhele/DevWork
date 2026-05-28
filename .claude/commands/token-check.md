# /token-check — Token & Cost Advisor

Analyse current model fit and cost trajectory for this session. Flag waste and recommend optimisations.

## Task tier classification

Re-read the current conversation and classify the primary task:

| Tier | Label       | Signal words                                               |
|------|-------------|-------------------------------------------------------------|
| 1    | Fast/Cheap  | quick, lookup, format, rename, fix typo, summarise short   |
| 2    | Medium      | plan, review, multi-file, analyse, debug, draft, explain   |
| 3    | Complex     | architect, security, reasoning, research, design, generate  |

## Model fit assessment

Current model is claude-sonnet-4-6 (Tier 2 optimal, trust 9/10).

| Provider | Tier 1 – Fast     | Tier 2 – Medium    | Tier 3 – Complex  |
|----------|-------------------|--------------------|-------------------|
| Claude   | Haiku 4.5 (9/10)  | Sonnet 4.6 (9/10)  | Opus 4.7 (10/10)  |
| OpenAI   | GPT-4o-mini (8/10)| GPT-4o (8/10)      | o3/o1 (9/10)      |
| Google   | Gemini Flash (7/10)| Gemini 1.5 Pro (8/10)| Gemini 2.5 Pro (9/10)|

## Cost targets

| Tier | Target per session |
|------|--------------------|
| 1    | < $0.05            |
| 2    | $0.05 – $0.50      |
| 3    | $0.50 – $5.00      |

## What to report

1. **Task tier detected**: which tier and why
2. **Active model fit**: correct / over-powered / under-powered
3. **Context size estimate**: count approximate message/token volume in this session
4. **Cost estimate**: rough USD estimate based on Sonnet 4.6 pricing ($3/$15 per M input/output tokens)
5. **Optimisation suggestions**:
   - If remaining work is Tier 1: suggest switching to Haiku 4.5
   - If context is large (>50k tokens estimated): suggest /compact or starting a new session
   - If multiple independent tasks remain: suggest batching into one message to reduce round-trips
   - If a task is purely read/search: suggest using a spawned Explore agent instead of main context

## Output format

```
## Token & Cost Check — YYYY-MM-DD HH:MM

Task tier:     <1 / 2 / 3> — <reason>
Active model:  claude-sonnet-4-6  →  <correct | over-powered | under-powered>
Context size:  ~<N>k tokens estimated
Est. cost:     ~$<X> so far this session

Optimisations:
- <suggestion 1>
- <suggestion 2>

Recommendation: <proceed as-is | switch to <model> | start new session>
```
