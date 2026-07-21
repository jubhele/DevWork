# Quote and Tracker Record UI

- The PHP portal, Next.js portal, and Expo mobile app all expose the Call Log number and service name on each linked Quote record; missing links remain explicit.
- Shared `Quote` data carries `callout_ref`, while Next.js and Expo resolve either that reference or `callout_id` against Call Log records.
- Authorized Tracker editors (`task.update`) can select one or more active eligible users inside a ticket and persist them through the audited PHP task API using `assigned_to_usernames`.
- Shared task data carries the full `assignees` collection so all clients display multi-user ownership consistently.
- Reassignment must retain at least one owner and refresh persisted task data after saving.
- `three-platform-quote-tracker-parity-regression.ps1` guards the PHP, Next.js, Expo, shared-type, shared-client, and permission contracts together.
