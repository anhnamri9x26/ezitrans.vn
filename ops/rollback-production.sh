#!/usr/bin/env bash
set -Eeuo pipefail
APP_DIR="${APP_DIR:-/home/ezitrans.vn/next-cms}"; IMAGE="${1:-}"; [[ "$IMAGE" =~ ^ghcr\.io/anhnamri9x26/ezitrans-cms:[A-Za-z0-9._-]+$ && "$IMAGE" != *:latest ]]||{ echo "Usage: $0 <immutable-image>" >&2;exit 2; };cd "$APP_DIR";exec 9>/var/lock/ezitrans-production-deploy.lock;flock -n 9||exit 75
docker pull "$IMAGE";cp -a docker-compose.yml "releases/rollback-$(date -u +%Y%m%dT%H%M%SZ).yml"
awk -v image="$IMAGE" 'BEGIN{a=0;c=0}/^  app:[[:space:]]*$/{a=1;print;next}a&&/^  [A-Za-z0-9_-]+:[[:space:]]*$/{a=0}a&&!c&&/^[[:space:]]+image:/{sub(/image:.*/,"image: "image);c=1}{print}END{if(!c)exit 42}' docker-compose.yml >docker-compose.yml.tmp
docker compose -f docker-compose.yml.tmp config --quiet;mv docker-compose.yml.tmp docker-compose.yml;docker compose up -d --no-deps --force-recreate app
for _ in {1..36};do curl -fsS http://127.0.0.1:3011/api/health/live >/dev/null&&curl -fsS https://ezitrans.vn/api/health/live >/dev/null&&{ echo "ROLLBACK SUCCESS";exit 0; };sleep 5;done;echo "ROLLBACK HEALTH FAILED" >&2;exit 1