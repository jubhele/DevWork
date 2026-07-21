# DP-700 Practice Test 01 — Answer Key

## Score summary

- Implement and manage: questions 1–10 — ___ / 10
- Ingest and transform: questions 11–20 — ___ / 10
- Monitor and optimize: questions 21–30 — ___ / 10
- Total: ___ / 30

## Answers and explanations

1. **B** — Workspace Spark settings and environments centralize runtime and library defaults for notebooks.
2. **A** — Git integration provides version control; deployment pipelines promote content through stages.
3. **B** — Deployment rules or parameters substitute environment-specific configuration during promotion.
4. **B** — Item-level permission avoids granting broader workspace administration.
5. **B** — Row-level security filters records according to the querying principal’s context.
6. **A** — Column-level security prevents access to the protected column; masking would only obscure displayed values under defined conditions.
7. **B** — OneLake security is designed to enforce granular access consistently across supported engines.
8. **A** — Dataflow Gen2 is the low-code, visual transformation option.
9. **B** — An event-based trigger starts processing in response to an event such as file arrival.
10. **B** — Parameters make one notebook reusable and allow the pipeline to supply region and date dynamically.
11. **B** — A stored watermark makes the next run select records changed after the last successful boundary.
12. **B** — Type 2 dimensions add versioned rows so historical facts retain the applicable attribute values.
13. **A** — A shortcut exposes external data through OneLake without copying it.
14. **A** — Mirroring provides managed replication for supported operational sources.
15. **B** — `dropDuplicates` removes repeated rows based on the specified business key.
16. **B** — An inferred or unknown member preserves the fact and permits later correction when the dimension arrives.
17. **A** — Eventstream supplies managed real-time ingestion, filtering, and routing.
18. **B** — A tumbling window creates fixed, contiguous, non-overlapping intervals.
19. **A** — Query acceleration is specifically intended to improve Real-Time Intelligence queries over shortcut data.
20. **B** — PySpark notebooks support distributed processing, Python logic, and custom libraries.
21. **A** — Run details expose the activity-level inputs, outputs, timing, and failure message.
22. **A** — Monitoring plus a failure alert provides proactive operational notification.
23. **A** — The discrepancy is execution context; parameter mapping and run output are the most direct evidence.
24. **A and B** — Health/error telemetry identifies the failure, while mapping and schema compatibility address the likely cause after schema change.
25. **A** — Compaction/optimization rewrites small files into a more efficient layout.
26. **A** — Safe parallelism reduces elapsed time when activities have no dependency, subject to source and capacity constraints.
27. **A** — The plan and statistics reveal scan/join costs and guide physical design or query changes.
28. **A** — A highly uneven join-key distribution is data skew and produces straggler tasks.
29. **A** — Refresh history and detailed step errors show where time or failure was introduced.
30. **A** — Early time filtering reduces the scanned data; plan and organization review can expose further optimizations.

## Objective follow-up

| Missed questions | Review area |
|---|---|
| 1–3 | Workspace configuration, Git, and deployment pipelines |
| 4–7 | Fabric and OneLake security/governance |
| 8–10 | Orchestration choices, triggers, and parameters |
| 11–16 | Incremental/dimensional loading and batch transformation |
| 17–20 | Streaming, shortcuts, KQL, and Spark selection |
| 21–24 | Monitoring, alerts, and error diagnosis |
| 25–30 | Lakehouse, pipeline, warehouse, Spark, model, and Eventhouse optimization |

Source baseline: [Microsoft DP-700 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-700), skills measured as of 21 July 2026.
