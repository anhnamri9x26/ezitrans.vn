# Docker Recovery Guide

This guide documents safe operator steps for Docker Desktop and BuildKit failures
that can happen during CMS image builds or one-click core updates.

## Symptoms

Common Docker Desktop metadata/storage errors:

```txt
write /var/lib/docker/buildkit/containerd-overlayfs/metadata_v2.db: input/output error
write /var/lib/desktop-containerd/daemon/io.containerd.metadata.v1.bolt/meta.db: input/output error
```

These errors usually mean Docker's internal metadata store failed to write. They
are different from TypeScript, Next.js, or application compile errors.

## Safe First Steps

1. Restart Docker Desktop.
2. Check host disk space.
3. Reopen the terminal after Docker is fully running.
4. Run:
   ```txt
   docker system df
   ```
5. Retry:
   ```txt
   docker compose build
   ```

## Manual-Only Recovery Steps

> [!WARNING]
> Do not automate these from the CMS. They can delete local build cache, images,
> and containers that may be needed for recovery.

Use only after manual review:

```txt
docker builder prune
```

```txt
docker system prune
```

If Docker Desktop metadata errors persist, use Docker Desktop's own
troubleshooting tools to repair/reset Docker's internal storage.

## Update Center Behavior

The Admin Update Center surfaces diagnostics from `update-agent` when reachable:

- Docker version
- Docker Compose version
- current app image
- compose project path
- `docker system df`
- update log list

The CMS will show guidance for metadata I/O errors, but it will not perform
prune/reset automatically.
