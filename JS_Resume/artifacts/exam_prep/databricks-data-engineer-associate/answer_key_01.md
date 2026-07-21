# Databricks Data Engineer Associate Practice Test 01 — Answer Key

## Score summary

- Intelligence Platform: questions 1–3 — ___ / 3
- Ingestion and loading: questions 4–8 — ___ / 5
- Transformation and modeling: questions 9–17 — ___ / 9
- Lakeflow Jobs: questions 18–21 — ___ / 4
- CI/CD: questions 22–24 — ___ / 3
- Troubleshooting and optimization: questions 25–27 — ___ / 3
- Governance and security: questions 28–30 — ___ / 3
- Total: ___ / 30

## Answers and explanations

1. **A** — Delta Lake supplies reliable table capabilities; Unity Catalog centralizes governance and access control.
2. **A** — Serverless compute removes cluster provisioning and tuning for supported workloads and follows consumption-oriented pricing.
3. **A** — Compute selection should match workload type, compatibility, startup behavior, collaboration, and cost—not simply maximum size.
4. **A** — `COPY INTO` supports incremental, idempotent loading by tracking files previously processed.
5. **A** — Auto Loader is designed for scalable file discovery and supports controlled schema inference, enforcement, and evolution.
6. **A** — Lakeflow Connect provides managed ingestion from supported enterprise sources into governed destinations.
7. **A** — A governed upload/read is proportionate for a one-off local file; enterprise CDC infrastructure would be excessive.
8. **A** — A managed connector is preferable when it supplies supported source extraction and incremental semantics; Auto Loader is strongest for files already landing in object storage.
9. **A** — Bronze preserves raw source fidelity before cleansing and conformance in Silver.
10. **A** — Broadcasting a genuinely small dimension avoids shuffling the large fact side of the join.
11. **A** — Union appends compatible rows and preserves duplicates; joins combine columns based on relationships.
12. **A** — `explode` expands each array element into its own output row.
13. **A** — A partitioned window with deterministic ordering explicitly selects the latest record per key.
14. **A** — Approximate count distinct trades a small amount of precision for efficient cardinality estimation at scale.
15. **A** — Excessive shuffle partitions can create many tiny tasks, so the shuffle partition setting is a primary tuning point.
16. **A** — A materialized view stores and refreshes precomputed query results suitable for repeated BI access.
17. **A** — Data-quality expectations or validation rules can enforce the condition and capture failure metrics/behavior.
18. **A** — Lakeflow Jobs dependencies and run-if conditions express failure-specific control flow.
19. **A** — File-arrival triggers are data-driven and avoid polling on a fixed schedule.
20. **A** — The DAG should explicitly model both upstream dependencies so C starts only after their required outcomes.
21. **A** — Repair run reruns failed and affected downstream tasks while preserving successful work where possible.
22. **A** — Git integration supports branch creation/switching, commits, pushes, and pull-request workflows.
23. **A** — Bundle variables and target overrides keep one deployable codebase while supplying environment-specific settings.
24. **A** — Validation catches definition/configuration issues before deployment to the chosen target.
25. **A** — Run history exposes duration and status trends across executions.
26. **A** — Uneven task data plus heavy spill are classic evidence of skew and shuffle imbalance.
27. **A** — Liquid clustering adapts data organization, while predictive optimization automates supported maintenance operations.
28. **A** — Databricks manages both metadata and underlying data lifecycle for a managed table.
29. **A** — `SELECT` grants permission to read table data; catalog and schema use privileges are also prerequisites as stated.
30. **A** — Unity Catalog ABAC applies centrally governed row-filtering and column-masking policies using attributes.

## Objective follow-up

| Missed questions | Review area |
|---|---|
| 1–3 | Platform components and compute selection |
| 4–8 | `COPY INTO`, Auto Loader, Lakeflow Connect, and ingestion choices |
| 9–17 | Medallion design, DataFrame operations, tuning, Gold objects, and quality |
| 18–21 | Lakeflow Jobs DAGs, triggers, conditions, and repair runs |
| 22–24 | Git integration and Declarative Automation Bundles |
| 25–27 | Run history, Spark UI diagnosis, liquid clustering, and predictive optimization |
| 28–30 | Unity Catalog table lifecycle, grants, and ABAC |

Source baseline: [Databricks Data Engineer Associate exam guide](https://www.databricks.com/sites/default/files/2026-03/databricks-certified-data-engineer-associate-exam-guide-may-4-2026.pdf), exam version effective 4 May 2026.
