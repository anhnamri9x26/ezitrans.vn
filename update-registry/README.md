# Lexi Update Registry

Read-only registry for signed Lexi CMS release manifests.

## Local canary

```powershell
node update-registry/scripts/keygen.mjs update-registry/.keys
node update-registry/scripts/publish.mjs --version 0.1.1-canary.1 --channel canary --image ghcr.io/your-org/lexi-cms-core@sha256:<64-hex-digest> --key update-registry/.keys/release-private.pem --changelog "First canary|Health probes"
node update-registry/server.mjs
```

Configure the CMS with the public key and `LEXI_UPDATE_REGISTRY_URL`. The private key must stay in CI secrets or an offline release workstation and must never be copied to website servers.
