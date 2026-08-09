# Ezitrans production deployment secrets

The GitHub Actions environment named `production` requires these secrets:

| Secret | Value |
|---|---|
| `EZITRANS_VPS_HOST` | `139.180.222.198` |
| `EZITRANS_VPS_PORT` | SSH port, currently `2222` |
| `EZITRANS_VPS_USER` | Dedicated deploy user (preferred), temporarily `root` |
| `EZITRANS_VPS_SSH_KEY` | Private Ed25519 deploy key |
| `EZITRANS_VPS_KNOWN_HOSTS` | Output of `ssh-keyscan -p 2222 139.180.222.198` after fingerprint verification |

Never store passwords, PATs, `.env`, or private keys in the repository. Configure required reviewers on the `production` environment. The VPS already has a read-only GHCR login; GitHub Actions uses `GITHUB_TOKEN` only to push the image.

## Deploy key

Create a dedicated key locally with `ssh-keygen -t ed25519`, append only its public key to the deployment account's `authorized_keys`, and store the private key in `EZITRANS_VPS_SSH_KEY`. Verify the host fingerprint out-of-band before storing `known_hosts`.

## First server bootstrap

Create `/home/ezitrans.vn/next-cms/ops`, upload the scripts once, set mode `700`, and run:

```bash
/home/ezitrans.vn/next-cms/ops/deploy-production.sh --dry-run ghcr.io/anhnamri9x26/ezitrans-cms:2026.08.07-1
```

The script never deploys `latest` and never prints `.env`.