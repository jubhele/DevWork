# Databricks Data Engineer Associate Practice Test 01

Time limit: **60 minutes**  
Questions: **30**  
Instructions: Select the single best answer unless the question says **Choose two**. Do not open the answer key until you finish.

## Databricks Intelligence Platform

### 1

Which pair provides reliable lakehouse tables and centralized governance in the Databricks Data Intelligence Platform?

A. Delta Lake and Unity Catalog  
B. MLflow and a local filesystem  
C. JDBC and notebook widgets  
D. Spark UI and Git branches

### 2

A team runs intermittent ETL jobs and does not want to provision or tune clusters. Which compute option is the best starting point when supported?

A. Serverless compute  
B. A permanently running all-purpose cluster  
C. A developer laptop  
D. A SQL warehouse used as file storage

### 3

An engineer must choose compute for an interactive notebook exploration that requires rapid iteration and shared development. Which consideration matters most?

A. Select compute designed for interactive workloads and compatible with the required runtime/libraries  
B. Always choose the largest available cluster  
C. Use job compute regardless of workload behavior  
D. Ignore cost and startup characteristics

## Data ingestion and loading

### 4

Files arrive repeatedly in cloud object storage. The engineer needs an idempotent SQL command that tracks files already loaded into a Delta table. Which command is designed for this?

A. `COPY INTO`  
B. `VACUUM`  
C. `DESCRIBE HISTORY`  
D. `GRANT SELECT`

### 5

Millions of JSON files arrive continuously, and new fields may appear. The pipeline needs scalable discovery plus controlled schema evolution. Which tool is the best fit?

A. Auto Loader with schema enforcement/evolution settings  
B. A manual `dbutils.fs.ls` loop  
C. A cross join  
D. `VACUUM RETAIN 0 HOURS`

### 6

A supported SaaS application must be ingested with a managed connector and governed destination tables. Which service should be evaluated first?

A. Lakeflow Connect managed connectors  
B. Spark UI  
C. Delta Sharing  
D. Databricks Repos

### 7

A small local CSV file must be explored once in a notebook. Which approach is most proportionate?

A. Upload/import the file to an accessible governed location and read it with Spark or SQL  
B. Deploy an enterprise CDC connector  
C. Configure cross-cloud Delta Sharing  
D. Create an ABAC policy first

### 8

When choosing between Auto Loader and a managed Lakeflow Connect connector, which requirement most strongly favors the managed connector?

A. A supported enterprise application requires managed extraction and incremental ingestion semantics  
B. Files land directly in object storage  
C. The data is already a Spark DataFrame  
D. The only requirement is to rename one column

## Data transformation and modeling

### 9

Raw source data must be retained unchanged before cleaning and standardization. In a medallion architecture, where should it first land?

A. Bronze  
B. Silver  
C. Gold  
D. A dashboard

### 10

A large fact DataFrame joins to a very small dimension DataFrame. Which strategy can avoid a large shuffle when the small table fits the threshold?

A. Broadcast the dimension DataFrame  
B. Cross join the tables  
C. Repartition both DataFrames to one partition  
D. Convert both DataFrames to local Python lists

### 11

Two DataFrames have the same columns. You must append all rows and preserve duplicates. Which operation should you use?

A. `unionAll`/`union` with compatible schemas  
B. Inner join  
C. Left anti join  
D. Cross join followed by `distinct`

### 12

A JSON record contains an array of products. The output needs one row per product while retaining the order identifier. Which operation is appropriate?

A. `explode` the products array  
B. `dropDuplicates` on order identifier  
C. Broadcast the orders table  
D. `VACUUM` the source

### 13

Multiple records exist for each business key. Only the record with the latest `updated_at` value should remain. Which pattern is most reliable?

A. Use a window partitioned by the key, order descending by timestamp, then keep row number 1  
B. Call `dropDuplicates` without defining which record wins  
C. Sort the entire DataFrame and take the first row  
D. Use a cross join with the source

### 14

A report needs approximate unique-user counts over a very large dataset where a small error is acceptable. Which aggregate is most appropriate?

A. Approximate count distinct  
B. Sum of user IDs  
C. Mean of user IDs  
D. Row count divided by partitions

### 15

A Spark stage creates thousands of tiny shuffle tasks with substantial scheduling overhead. Which setting should be reviewed first?

A. `spark.sql.shuffle.partitions`  
B. The Unity Catalog metastore name  
C. A table comment  
D. A job email subject

### 16

BI users need a precomputed, refreshable Gold-layer object for an expensive aggregation. Which object is a strong candidate?

A. A materialized view  
B. A raw Bronze file  
C. A cluster event log only  
D. A Git branch

### 17

A Silver table must reject records whose amount is negative while tracking failed expectations. What capability should be implemented?

A. Declarative data-quality expectations/validation rules in the pipeline  
B. A larger driver node  
C. Delta Sharing  
D. A workspace folder

## Working with Lakeflow Jobs

### 18

A workflow should run a recovery task only when the transformation task fails. What should you configure?

A. A conditional dependency/control-flow rule in Lakeflow Jobs  
B. A cross join  
C. A table mask  
D. A notebook markdown cell

### 19

A job should begin whenever new files arrive, but not on a fixed clock schedule. Which trigger is most appropriate?

A. File-arrival trigger  
B. Cron schedule  
C. Manual-only trigger  
D. Table comment trigger

### 20

Task C requires outputs from Tasks A and B. How should this be represented?

A. Make C depend on both A and B in the Lakeflow Jobs DAG  
B. Put all tasks in separate workspaces with no dependencies  
C. Use a sensitivity label  
D. Add a cluster policy to C only

### 21

A failed multi-task job is fixed. Only failed and dependent tasks should run again. Which action best avoids repeating successful independent work?

A. Repair the failed job run  
B. Clone the workspace  
C. Delete the job history  
D. Restart every successful upstream source manually

## Implementing CI/CD

### 22

A developer wants to isolate changes, commit them, and open a pull request from the Databricks workspace. What should be used?

A. Databricks Git integration with a feature branch  
B. Spark UI stages  
C. Delta table history only  
D. A Unity Catalog external location

### 23

The same deployment definition must target dev, test, and prod with different catalog names. What is the preferred pattern?

A. Declarative Automation Bundle variables and target overrides  
B. Three unrelated hand-edited copies  
C. Store production names in notebook output  
D. Rename the metastore before each deployment

### 24

Which CLI sequence best supports an automated bundle delivery workflow?

A. Validate the bundle, then deploy it to the selected target  
B. Vacuum, then delete the Git repository  
C. Revoke all privileges, then clone the metastore  
D. Export notebook HTML, then restart the workspace

## Troubleshooting, monitoring, and optimization

### 25

A job is gradually taking longer each week. Which view best supports comparison against historical runtimes?

A. Lakeflow Jobs run history  
B. Unity Catalog grants  
C. Notebook markdown history  
D. Workspace folder permissions

### 26

One Spark task processes far more data than its peers and spills heavily to disk. What is the most likely diagnosis?

A. Data skew causing shuffle imbalance  
B. A missing Git tag  
C. Too many sensitivity labels  
D. A Delta Sharing recipient error

### 27

A large Delta table is frequently filtered on several evolving access patterns. The team wants automated file-layout maintenance. Which features should be evaluated?

A. Liquid clustering and predictive optimization  
B. Notebook widgets and comments  
C. Cross joins and Python lists  
D. Git branches and pull requests

## Governance and security

### 28

Deleting a Unity Catalog table must also remove the underlying data managed by Databricks. Which table type matches this lifecycle?

A. Managed table  
B. External table  
C. Foreign table  
D. Temporary view

### 29

An analyst group already has `USE CATALOG` and `USE SCHEMA`. It needs read access to all current tables in a schema. Which privilege is required on the tables?

A. `SELECT`  
B. `MODIFY`  
C. `CREATE CATALOG`  
D. `MANAGE` on the metastore

### 30

One centrally managed policy must mask a sensitive column and filter rows according to user-group attributes across many tables. Which Unity Catalog capability best fits?

A. Attribute-based access control policies  
B. Notebook-scoped variables  
C. A job retry policy  
D. A cluster init script

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
