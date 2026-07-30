# Plugin Package Format

Future uploaded plugins should use a manifest-driven package format.

```json
{
  "id": "example-plugin",
  "name": "Example Plugin",
  "version": "1.0.0",
  "type": "plugin",
  "requiresCore": ">=0.1.0",
  "requiresNode": ">=20",
  "main": "index.ts",
  "hooks": "hooks.ts",
  "settingKey": "plugin_example_enabled",
  "migrations": [],
  "permissions": [],
  "requiresBuild": false
}
```

## Safety rules

- Packages must include `manifest.json`.
- Zip paths must not contain absolute paths or `../`.
- Updates must create a backup before replacement.
- Packages with `requiresBuild: true` require Docker rebuild/redeploy.
