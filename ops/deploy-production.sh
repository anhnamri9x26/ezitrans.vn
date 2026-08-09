#!/usr/bin/env bash
set -Eeuo pipefail
APP_DIR="${APP_DIR:-/home/ezitrans.vn/next-cms}"; COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"; PUBLIC_URL="${PUBLIC_URL:-https://ezitrans.vn}"; LOCK_FILE="${LOCK_FILE:-/var/lock/ezitrans-production-deploy.lock}"; DRY_RUN=false; TARGET_IMAGE=""
usage(){ echo "Usage: $0 [--dry-run] ghcr.io/anhnamri9x26/ezitrans-cms:<immutable-tag>"; }
while (($#)); do case "$1" in --dry-run) DRY_RUN=true;; -h|--help) usage;exit 0;; *) [[ -z "$TARGET_IMAGE" ]]||{ usage >&2;exit 2; };TARGET_IMAGE="$1";; esac;shift;done
[[ "$TARGET_IMAGE" =~ ^ghcr\.io/anhnamri9x26/ezitrans-cms:[A-Za-z0-9._-]+$ && "$TARGET_IMAGE" != *:latest ]]||{ echo "ERROR: immutable image tag required; latest forbidden" >&2;exit 2; }
cd "$APP_DIR"; [[ -f "$COMPOSE_FILE" && -f .env ]]||{ echo "ERROR: production files missing" >&2;exit 1; }
exec 9>"$LOCK_FILE";flock -n 9||{ echo "ERROR: deployment already running" >&2;exit 75; }
compose(){ docker compose -f "$COMPOSE_FILE" "$@"; }
old="$(compose config --images|grep ezitrans-cms|head -n1)"; [[ -n "$old" ]]||exit 1
rid="$(date -u +%Y%m%dT%H%M%SZ)-${TARGET_IMAGE##*:}";dir="$APP_DIR/releases/$rid";mkdir -p "$dir";chmod 700 "$APP_DIR/releases" "$dir";exec > >(tee -a "$dir/deploy.log") 2>&1
echo "old=$old target=$TARGET_IMAGE"
if $DRY_RUN;then compose config --quiet;compose ps;curl -fsS http://127.0.0.1:3011/api/health/live >/dev/null;echo 'DRY RUN OK';exit 0;fi
cp -a "$COMPOSE_FILE" "$dir/docker-compose.before.yml";cp -a .env "$dir/env.before";chmod 600 "$dir/env.before"
compose exec -T db pg_dump -U ezitrans -d ezitrans -Fc --no-owner --no-acl >"$dir/database.before.dump";compose exec -T db pg_restore --list <"$dir/database.before.dump" >/dev/null
docker pull "$TARGET_IMAGE"
awk -v image="$TARGET_IMAGE" 'BEGIN{a=0;c=0}/^  app:[[:space:]]*$/{a=1;print;next}a&&/^  [A-Za-z0-9_-]+:[[:space:]]*$/{a=0}a&&!c&&/^[[:space:]]+image:/{sub(/image:.*/,"image: "image);c=1}{print}END{if(!c)exit 42}' "$COMPOSE_FILE" >"$dir/target.yml"
cp "$dir/target.yml" "$COMPOSE_FILE.tmp";docker compose -f "$COMPOSE_FILE.tmp" config --quiet;mv "$COMPOSE_FILE.tmp" "$COMPOSE_FILE"
rollback(){ echo "ROLLBACK IMAGE $old";cp -a "$dir/docker-compose.before.yml" "$COMPOSE_FILE";compose up -d --no-deps --force-recreate app||true; }
trap 'r=$?;((r==0))||rollback;exit $r' EXIT
compose run --rm app npx prisma migrate status;compose run --rm app npm run migrate:deploy;compose up -d --no-deps --force-recreate app
ok=false;for _ in {1..36};do s="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' ezitransvn-app-1 2>/dev/null||true)";if [[ "$s" == healthy ]]&&curl -fsS http://127.0.0.1:3011/api/health/live >/dev/null;then ok=true;break;fi;sleep 5;done;$ok||exit 1
for x in /api/health/live / /login /sitemap.xml;do curl -fsS -o /dev/null "$PUBLIC_URL$x";done
trap - EXIT;printf '%s\n' "$TARGET_IMAGE" >"$dir/image.txt";printf '%s\n' "$old" >"$dir/previous-image.txt";echo "SUCCESS $(date -Is)"|tee "$dir/status.txt";echo "DEPLOYMENT SUCCESSFUL"