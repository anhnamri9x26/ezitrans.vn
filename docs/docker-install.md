# Docker Install Guide

This project supports a Docker-first deployment model for WordPress-like one-click updates.

## Recommended server

- Ubuntu VPS
- Docker and Docker Compose
- Caddy or Nginx Proxy Manager in front of the app
- Persistent site folder per website

## Folder layout

```txt
/opt/sites/example.com/
├─ docker-compose.yml
├─ .env
├─ content/
│  ├─ uploads/
│  ├─ plugins/
│  ├─ themes/
│  ├─ backups/
│  ├─ upgrade-temp/
│  └─ logs/
└─ postgres-data/
```

## Install steps

1. Copy `docker-compose.example.yml` to `docker-compose.yml`.
2. Copy `.env.example` to `.env`.
3. Change passwords and `UPDATE_AGENT_TOKEN`.
4. Start services with Docker Compose.
5. Open the app and complete activation/login.

## Update model

Core updates are image-based. Plugin/theme updates will use `content/plugins` and `content/themes` in later milestones.
