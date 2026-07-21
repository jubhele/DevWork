# DP-700 Practice Test 01

Time limit: **60 minutes**  
Questions: **30**  
Instructions: Select the single best answer unless the question says **Choose two**. Do not open the answer key until you finish.

## Implement and manage an analytics solution

### 1

All notebooks in a Fabric workspace must use a common Spark runtime and a predefined set of libraries. Administrators want these defaults applied without editing every notebook. What should they configure?

A. A semantic model refresh policy  
B. The workspace Spark settings and environment  
C. A deployment pipeline rule  
D. A OneLake shortcut

### 2

A team wants notebook changes tracked in Azure DevOps and promoted through development, test, and production workspaces. Which combination best supports this lifecycle?

A. Workspace Git integration and Fabric deployment pipelines  
B. OneLake shortcuts and sensitivity labels  
C. Dataflow Gen2 and Eventstreams  
D. Mirroring and dynamic data masking

### 3

The production workspace uses a different data-source connection from development. The same Fabric item must be promoted without manually editing it after every deployment. What should you use?

A. Spark autoscale  
B. A deployment pipeline with stage-specific rules or parameters  
C. A KQL update policy  
D. A workspace domain

### 4

An engineer must modify one pipeline but must not administer the entire workspace. What follows least-privilege design?

A. Assign the workspace Admin role  
B. Grant only the required item-level permission on the pipeline  
C. Assign tenant administrator rights  
D. Grant access to the workspace’s underlying storage account

### 5

Regional managers query the same warehouse table, but each manager must see only rows for their own region. Which control is most appropriate?

A. Dynamic data masking  
B. Row-level security  
C. Column-level security  
D. A sensitivity label

### 6

Analysts may query a customer table but must never access the `national_id` column. Which control directly enforces this requirement?

A. Column-level security  
B. Row-level security  
C. Item endorsement  
D. A scheduled trigger

### 7

Security must be enforced consistently on OneLake data regardless of which compatible Fabric engine accesses it. Which feature should be configured?

A. Notebook source control  
B. OneLake security  
C. Spark session tags  
D. Pipeline retry policy

### 8

A business analyst needs a low-code transformation with visual steps and reusable destinations. There is no need for complex Spark logic. Which Fabric item is the best fit?

A. Dataflow Gen2  
B. Eventhouse  
C. Spark notebook  
D. Semantic model

### 9

A pipeline must begin as soon as a file-arrival event is received rather than at a fixed time. What should you configure?

A. A schedule trigger  
B. An event-based trigger  
C. A deployment rule  
D. A warehouse materialized view

### 10

A parent pipeline invokes the same child notebook for 12 regions. The region and processing date change on every invocation. What is the best design?

A. Create 12 copies of the notebook  
B. Pass pipeline parameters to a parameterized notebook  
C. Store the region in a sensitivity label  
D. Use 12 production workspaces

## Ingest and transform data

### 11

A source table contains a reliable `last_modified_utc` column. Only rows changed since the previous successful run should be loaded. Which pattern is most appropriate?

A. Full reload on every run  
B. Watermark-based incremental load  
C. Random sampling  
D. Cross join

### 12

Customer attributes must retain history so reports can reproduce the values that applied when each sale occurred. Which dimensional-model technique should be used?

A. Slowly changing dimension Type 1  
B. Slowly changing dimension Type 2  
C. Degenerate dimension only  
D. Truncate and reload the dimension

### 13

Data already resides in an ADLS Gen2 account. Fabric users need near-immediate access without duplicating the files into OneLake. What should you create?

A. A OneLake shortcut  
B. A full-copy pipeline  
C. A semantic model import  
D. A deployment pipeline

### 14

An operational Azure SQL database must be continuously replicated into Fabric with minimal custom ingestion code. Which feature is the best starting point when the source is supported?

A. Mirroring  
B. A manual CSV export  
C. A notebook scheduled once per month  
D. A workspace domain

### 15

A PySpark DataFrame contains duplicate events with the same `event_id`. Only one record per identifier should remain before writing the Silver table. Which operation directly addresses this?

A. `df.crossJoin(other)`  
B. `df.dropDuplicates(["event_id"])`  
C. `df.orderBy("event_id")`  
D. `df.repartition(1)`

### 16

A sales fact arrives before its product dimension row. The business requires the fact to remain loadable and to be corrected when the dimension arrives. Which approach is best?

A. Discard the fact permanently  
B. Use an inferred/unknown dimension member and update the relationship later  
C. Convert the fact into a dimension  
D. Disable referential checks in every downstream model

### 17

An IoT stream must be filtered and routed into Fabric destinations with a managed visual ingestion experience. Which item is the best fit?

A. Eventstream  
B. Deployment pipeline  
C. Dataflow Gen2 only  
D. Database project

### 18

A KQL query must calculate an event count for each non-overlapping five-minute interval. Which window is appropriate?

A. Session window  
B. Tumbling window  
C. Cross-database shortcut  
D. Slowly changing window

### 19

Queries over external OneLake shortcut data in an Eventhouse require lower latency while the source remains external. Which option should be evaluated?

A. Query acceleration for OneLake shortcuts  
B. A Power BI gateway  
C. Notebook high concurrency  
D. A deployment pipeline

### 20

A transformation requires complex reusable Python logic, custom libraries, and large-scale distributed processing. Which option is the best fit?

A. Dataflow Gen2  
B. A PySpark notebook  
C. A sensitivity label  
D. A workspace role

## Monitor and optimize an analytics solution

### 21

A nightly pipeline failed. You need to identify the failed activity and inspect its input, output, and error details. Where should you start?

A. The pipeline run details in the monitoring experience  
B. The workspace Git branch  
C. The sensitivity-label policy  
D. The semantic-model relationship view

### 22

Operations must be notified when an ingestion job fails. Which design best meets the requirement?

A. Configure monitoring and an alert/notification on the failure condition  
B. Add more columns to the target table  
C. Create a OneLake shortcut  
D. Endorse the pipeline

### 23

A notebook succeeds interactively but fails in a pipeline because a parameter is null. What should you inspect first?

A. The notebook activity’s parameter mapping and run output  
B. The warehouse distribution strategy  
C. The workspace sensitivity label  
D. The Power BI theme

### 24

An Eventstream receives data, but no events reach the destination after a schema change. Which two areas should be checked first? **Choose two.**

A. Eventstream health and error details  
B. Source-to-destination field mapping/schema compatibility  
C. Deployment-pipeline approval history  
D. Workspace display name

### 25

A Lakehouse Delta table has accumulated many small files, slowing scans. Which maintenance action most directly improves file layout?

A. Compact the table with an optimization operation  
B. Add a sensitivity label  
C. Disable monitoring  
D. Convert every column to text

### 26

A pipeline copies 20 independent tables sequentially and misses its service-level target. What is the best first optimization?

A. Run independent copy activities in parallel within safe source and capacity limits  
B. Add a row-level security policy  
C. Convert all tables to CSV  
D. Place each activity in a separate tenant

### 27

A warehouse query scans a large fact table but filters and joins repeatedly on the same selective columns. What should you examine first?

A. Query plan, statistics, table design, and appropriate indexing/partitioning options  
B. Workspace description text  
C. Sensitivity-label color  
D. Notebook markdown cells

### 28

One key accounts for most records in a Spark join, leaving a few tasks running far longer than the others. What is the likely cause?

A. Data skew  
B. A missing sensitivity label  
C. Over-endorsement  
D. A deployment-stage mismatch

### 29

A semantic model refresh exceeds its expected duration after a source schema change. Which evidence is most useful first?

A. Refresh history and detailed refresh error/step information  
B. The workspace icon  
C. Git commit author avatars  
D. The tenant’s default theme

### 30

An Eventhouse query repeatedly scans a large time range although users usually request the latest hour. Which change is most likely to reduce work?

A. Apply an early selective time filter and review data organization/query plan  
B. Remove the timestamp column  
C. Convert the query into a sensitivity label  
D. Disable caching and monitoring

## Answer sheet

| Q | Answer | Confidence | Q | Answer | Confidence |
|---|---|---|---|---|---|
| 1 |  |  | 16 |  |  |
| 2 |  |  | 17 |  |  |
| 3 |  |  | 18 |  |  |
| 4 |  |  | 19 |  |  |
| 5 |  |  | 20 |  |  |
| 6 |  |  | 21 |  |  |
| 7 |  |  | 22 |  |  |
| 8 |  |  | 23 |  |  |
| 9 |  |  | 24 |  |  |
| 10 |  |  | 25 |  |  |
| 11 |  |  | 26 |  |  |
| 12 |  |  | 27 |  |  |
| 13 |  |  | 28 |  |  |
| 14 |  |  | 29 |  |  |
| 15 |  |  | 30 |  |  |
