# Workspace Secret Management

`C:\DevWork\.env` is the source of truth for credentials, deployment identities, and
provider accounts across the workspace. App-local `.env` files are generated mirrors.

## Namespaces

| Prefix | Owner | Mirror |
|---|---|---|
| `GBL_*` | Workspace-wide services and identity | Root vault only |
| `BF_*` | BlackFire and the BlackFire Portal | `BlackFire\BlackFire Portal\.env` |
| `AI_*` | Astute Insights | `Astute\.env` |

New variables must use one of these prefixes. Global values are not copied into app mirrors
unless a future runtime explicitly allowlists an individual key.

## Files

- `C:\DevWork\.env` contains real values and is never committed.
- `C:\DevWork\.env.example` is the committed key schema with no real secrets.
- `C:\DevWork\.env.enc` is the encrypted-at-rest copy of the complete root vault.
- App `.env` files are generated from the matching namespace in the root vault.

## Refresh

Run the one-shot command after changing the root vault:

```powershell
powershell -ExecutionPolicy Bypass -File C:\DevWork\scripts\refresh-workspace-secrets.ps1
```

It regenerates both app mirrors and `C:\DevWork\.env.enc`.

## Recovery Export

Create a portable recovery export with:

```powershell
powershell -ExecutionPolicy Bypass -File C:\DevWork\scripts\export-workspace-secret-recovery.ps1
```

The default destination is `%USERPROFILE%\DevWork-Vault-Backups`. The script writes the
encrypted vault under `encrypted-vaults` and the matching master key under `recovery-keys`.
Move those two artifacts to separate secure locations. Together they can recover every
secret in the workspace.

Use `-DestinationRoot` to export directly to an offline or encrypted drive.

## Restore

Restore on a machine that has no plaintext vault by supplying the exported key file:

```powershell
powershell -ExecutionPolicy Bypass -File C:\DevWork\scripts\restore-workspace-secrets.ps1 `
  -EncryptedInput D:\SecureBackup\workspace-vault_YYYYMMDD_HHmmss.env.enc `
  -MasterKeyFile E:\RecoveryKeys\workspace-vault_YYYYMMDD_HHmmss.key
```

The restore recreates `C:\DevWork\.env`, refreshes the encrypted working copy, and
regenerates both app mirrors.

## Agent Operations

- Agents may use app-prefixed cPanel credentials to create mailboxes for that app's domains.
- Agents may use stored mailbox credentials to complete provider email verification.
- Agents may use app-prefixed Git and cPanel deployment credentials when deployment is requested.
- Global registration credentials are the default for shared provider accounts; app-specific
  credentials should use the owning app prefix.
- Missing credentials must be added to the root vault, never directly to an app mirror.

## Security Rules

- Never commit `.env`, `.env.enc`, generated mirrors, recovery keys, or exports.
- Never print secret values in terminal output, logs, documentation, or chat.
- Keep the encrypted vault and exported recovery key in separate secure locations.
- Production BlackFire secrets remain in `~/blackfire_secrets.php`; the portal mirror is for
  local development only.
