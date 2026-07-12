# BlackFire Multi-Agent Architecture — Recommendations

## Overview

Recommendations for evolving the BlackFire multi-agent workforce (uSibali, uMlawuli, and the 10 Sebenza agents) toward clearer boundaries, better communication, observability, and a modernized interaction model between the portal, orchestration layer, and individual agents.

## 1. Clear Agent Boundaries

**Per-agent contracts:**
- Define explicit input/output schemas per Sebenza agent (uNkanyezi, uSiba, uMhloli, uMakhi, uMdwebi, uMvavanyi, uMcwaningi, uMbheki, uMlindi) — each agent should declare what payload shape it accepts and what it guarantees to return, so callers don't need to know its internals
- Document each agent's domain ownership explicitly (per the §12.2 routing table) so overlapping requests (e.g. "review this code for security" — uMlindi vs. uMcwaningi) resolve deterministically instead of by whichever agent picks it up first
- Prevent cross-agent state leakage: uMakhi's code-change context should not silently bleed into uMvavanyi/uMcwaningi/uMbheki's QA passes — each QA agent should receive only the diff/output it needs to test, not uMakhi's full working memory

**Governance/execution split:**
- Separate governance-tier logic (uSibali cost clearance, uMlawuli routing/supervision) from Sebenza execution logic — governance agents should never perform task work themselves, only gate and route it
- Enforce the existing hard-cap iteration budgets (§13.1: uNkanyezi 3, uSiba 2, uMhloli 5, uMakhi 3, uMdwebi 2, uMvavanyi 3, uMcwaningi 3, uMbheki 2, uMlindi 2) at the orchestration layer via a counter uMlawuli tracks, not just as a documented convention an agent is trusted to self-enforce
- On cap exceeded, uMlawuli terminates the loop and logs `LOOP_TERMINATED` per the constitution — this should be a hard orchestration-layer check, not something each agent implements independently (and inconsistently)

**Escalation boundary:**
- Define exactly what "escalate to uMlawuli" means mechanically (return a specific status code/JSON shape) rather than leaving it as informal handoff language

## 2. Improved Communication Patterns

**Protocol:**
- Move from ad-hoc conversational handoffs to the strict JSON protocol already defined in the constitution (§13.2 session JSON metadata block) as the actual wire format between uMlawuli and Sebenza agents, not just a post-hoc logging artifact
- Standardize a request envelope (task_id, assigned_agent, payload, budget/tier, correlation_id) distinct from the existing response/outcome metadata block, so requests and results share a traceable ID

**Transport:**
- Introduce a message bus or queue between uMlawuli and Sebenza agents instead of direct synchronous calls — decouples agent execution time from the caller and makes retries/backpressure tractable
- For any move to true multi-process/multi-service agents (rather than in-process Claude Code sub-agents), this queue is also the natural place to add the WebSocket layer described in §3 for client-facing streaming

**Fault tolerance:**
- Add retry/backoff semantics matching the constitution's fault-tolerance rule (§13.3: 3 retries on crash/timeout/corrupted payload, then halt + flag a system error), with `retry_count` incremented in the JSON metadata block on each attempt exactly as specified
- Add circuit breakers so a repeatedly failing agent (e.g. uMhloli timing out on external research calls) doesn't get retried into the ground — trip after N consecutive failures across sessions, not just within one task

**Context handling:**
- Implement the §13.4 memory compression trigger (70% context capacity) as an actual mechanism — uSibali should be able to intercept a worker's context, summarize/drop stale facts/merge duplicates, and hand back a compressed payload with `action_taken: "Summarised context"` logged, rather than this being aspirational text

## 3. Async Processing & Client Integration

- Implement agent-to-client direct communication (WebSockets)
- Add client-side agent workers with the Web Workers API
- Create agent selection UI patterns
- Implement agent result caching
- Add agent context persistence

## 4. Cross-Cutting Concerns

**Agent Communication:**
- Standardize agent message format (JSON Schema)
- Implement versioned agent APIs
- Add circuit breakers for agent calls

**Observability:**
- Implement agent telemetry
- Add request tracing across all layers
- Create agent performance dashboards

**Security:**
- Implement agent authentication (JWT/OAuth)
- Add rate limiting per agent type
- Create agent permission matrix

## 5. Deployment Improvements

- Containerize agents for independent scaling
- Implement agent blue-green deployments
- Add agent feature flags
- Create agent rollback procedures

## Implementation Roadmap

**Phase 1 (0-4 weeks):**
- Agent orchestration layer
- Basic agent communication
- Telemetry foundation

**Phase 2 (4-8 weeks):**
- Asynchronous processing
- Client-side agent hooks
- Security implementation

**Phase 3 (8-12 weeks):**
- Advanced routing
- Full observability
- Performance optimization

## Expected Benefits

- 30-50% reduction in request processing time
- Improved system resilience
- Better development velocity for new features
- Enhanced debugging capabilities
- More flexible scaling options
