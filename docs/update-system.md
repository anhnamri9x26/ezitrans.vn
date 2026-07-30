# Update System

The update system is designed to feel like WordPress while staying safe for a Next.js Docker deployment.

## Components

- `app`: Next.js CMS.
- `db`: PostgreSQL.
- `update-agent`: internal service that receives authenticated update requests.
- `content/`: persistent runtime data similar to `wp-content`.

## Current behavior through Milestone 4

- Admin page: `/admin/updates`.
- API: `/api/updates/status`.
- API: `/api/updates/core` creates an `UpdateJob`, enables maintenance mode, creates a backup, then calls update-agent.
- API: `/api/updates/database` creates an `UpdateJob`, enables maintenance mode, creates a backup, then simulates migration completion.
- API: `/api/updates/backups` lists recent `PackageBackup` records.
- update-agent runs in simulation mode by default.
- Real Docker mode can pull a target image, recreate the app service, health-check, and attempt rollback.
- Logs are stored in DB and agent log files.

## Maintenance mode

Maintenance mode is file-based:

```txt
content/.maintenance
```

The file stores JSON metadata including:

- job ID
- reason
- start time

Public frontend routes render a maintenance screen while this file exists. Admin and API routes remain available so the update dashboard can keep working.

## Backups

Pre-update backups are stored under:

```txt
content/backups/
```

Each backup folder contains:

- `database.sql` from `pg_dump`
- `content/uploads/` snapshot when present
- `content/plugins/` snapshot when present
- `content/themes/` snapshot when present
- `manifest.json`

A matching `PackageBackup` database record is created for admin visibility.

> [!IMPORTANT]
> `pg_dump` must be available in the runtime environment. The Docker image installs `postgresql-client` for this. Local Windows development also needs PostgreSQL client tools in `PATH` before manual update backup tests can succeed.

## Real Docker updates

Simulation mode remains the default:

```txt
SIMULATE_UPDATES=true
```

To allow the update-agent to execute real Docker operations:

```txt
SIMULATE_UPDATES=false
CORE_IMAGE_REPOSITORY=ezitrans-cms
APP_HEALTH_URL=http://app:3000/api/system/health
```

The update-agent container needs Docker CLI access through:

```txt
/var/run/docker.sock:/var/run/docker.sock
```

Real core update flow:

1. App creates update job.
2. App enables maintenance mode.
3. App creates DB/content backup.
4. App sends `targetImage` to update-agent.
5. update-agent tags the current app image as rollback.
6. update-agent pulls the target image.
7. update-agent recreates the app service through Docker Compose.
8. update-agent calls the app health endpoint.
9. On failure, update-agent attempts rollback to the rollback tag.

> [!CAUTION]
> Mounting the Docker socket gives update-agent high privileges over the host Docker daemon. Keep the update-agent private and protect it with `UPDATE_AGENT_TOKEN`.

## Restore status

Restore from backup is still manual. Milestone 4 adds image rollback for failed Docker core updates, but DB/content restore remains a future explicit restore workflow.

## Runtime plugin/theme ZIP updates

Milestone 5 installs uploaded extension ZIP files into persistent runtime content folders:

```txt
content/plugins/{plugin-id}/
content/themes/{theme-id}/
```

Plugin ZIP requirements:

- `.zip` file, max 50MB
- `manifest.json`
- required fields: `id`, `name`, `version`, `settingKey`
- safe ID: lowercase letters, numbers, and hyphen only

Theme ZIP requirements:

- `.zip` file, max 100MB
- `theme.json`
- required fields: `id`, `name`, `version`
- required file: `Homepage.tsx`
- safe ID: lowercase letters, numbers, and hyphen only

Security checks are mandatory before install:

- path traversal validation
- symlink rejection
- blocked dangerous extensions
- file count, depth, single-file size, and total extracted size limits
- source scan warnings for risky patterns

Install/update flow:

1. Save ZIP to `content/upgrade-temp`.
2. Extract into an isolated temporary folder.
3. Validate paths and scan files.
4. Validate manifest and required files.
5. Stage package folder.
6. Backup existing runtime package if present.
7. Rename existing target to a temporary rollback folder.
8. Atomically rename staged package into final target.
9. Upsert `InstalledPackage` with `source: CONTENT`.
10. Create `PackageBackup` record when replacing an existing package.
11. Remove temp/rollback folders after success.
12. Restore rollback folder if install fails.

> [!IMPORTANT]
> Production ZIP extraction uses `unzip` inside the app container. The Dockerfile
> installs it in the runner image alongside `postgresql-client`.

> [!WARNING]
> Runtime-installed package files are persisted safely in `content/`, but React
> component execution still depends on the existing extension/theme loader. If a
> package requires newly compiled imports, a follow-up runtime loader milestone may
> be needed.

## Runtime activation and loading

Milestone 6 makes runtime content packages visible and manageable from admin while keeping code execution safe.

Support matrix:

| Package capability | Built-in source | Content source |
| --- | --- | --- |
| Plugin metadata | Supported | Supported |
| Plugin activate/deactivate | Supported | Supported |
| Plugin hooks | Supported via generated registry | Metadata-only; runtime hook import is blocked |
| Theme metadata | Supported | Supported |
| Theme activation | Supported | Guarded by activation rules |
| Theme TSX rendering | Supported at build time | Blocked until runtime renderer/rebuild support |

Runtime plugin behavior:

- `content/plugins/*/manifest.json` is scanned with the same manifest validator.
- Runtime plugins are synced into `InstalledPackage` with `source: CONTENT`.
- Activate/deactivate updates both plugin setting state and `InstalledPackage.status`.
- Runtime plugins that declare hook files show a warning because arbitrary hook imports from `content/` are not enabled yet.

Runtime theme behavior:

- `content/themes/*/theme.json` is scanned with the same manifest validator.
- Runtime themes are synced into `InstalledPackage` with `source: CONTENT`.
- Raw TSX runtime themes remain installable but activation is blocked unless a safe runtime render mode/fallback is declared.
- This avoids sending unsupported runtime theme IDs into Next.js dynamic imports.

> [!IMPORTANT]
> This milestone intentionally separates runtime package activation metadata from arbitrary uploaded TSX execution. Next.js does not compile newly uploaded files inside `content/` at runtime.

## Restore and recovery UX

Milestone 7 adds safe folder-level restore for runtime package backups.

Restore support matrix:

| Backup type | Restore support | Notes |
| --- | --- | --- |
| PLUGIN | Supported | Restores `content/plugins/{slug}` |
| THEME | Supported | Restores `content/themes/{slug}` |
| CORE | Not supported here | Core rollback belongs to Docker image rollback |
| DATABASE | Not supported here | Full DB/content restore is a later milestone |

Restore safety flow:

1. Validate the backup record exists.
2. Verify the backup path exists and is inside `content/backups`.
3. Verify the package payload folder exists.
4. Validate restored package manifest.
5. Dry-run can stop after validation without modifying files.
6. Restore creates a pre-restore snapshot of the current package folder.
7. Restore swaps folder contents.
8. `InstalledPackage` is synced to the restored manifest.
9. `UpdateJob` records success, failure, or rollback.
10. If restore fails after moving the current folder, the previous folder is moved back.

> [!WARNING]
> Restore is destructive for the target package folder, but it is protected by a
> pre-restore snapshot and rollback folder.

## Full restore strategy

Full DB/content restore is intentionally separate from package restore.

Recommended future full restore flow:

1. Enable maintenance mode.
2. Create a fresh backup of current database and `content/`.
3. Validate target restore manifest.
4. Validate DB dump format and expected schema version.
5. Restore content into a staging directory first.
6. Restore database through a controlled migration/restore path.
7. Run health checks.
8. Promote restored content if checks pass.
9. Roll back to the pre-restore backup if checks fail.
10. Disable maintenance mode after success or rollback.

Full restore artifacts should include:

- database dump
- content archive
- restore manifest
- CMS version
- created timestamp
- checksum list

> [!IMPORTANT]
> Full restore can overwrite live content and database state. It should require
> explicit dry-run checks and operator confirmation before destructive execution.

## Docker recovery operations

Milestone 8 adds Docker diagnostics and manual core rollback UX. See
[docker-recovery.md](file:///d:/Antigravity/ezitrans.vn/docs/docker-recovery.md)
for Docker Desktop metadata I/O recovery steps.

## Future behavior

- Add full database/content restore execution after dry-run validation is mature.
- Add richer rollback tag discovery from persisted update-agent logs.
- Add runtime hook loading for trusted plugin packages if needed.
- Add runtime renderer or rebuild strategy for content-installed TSX themes.
