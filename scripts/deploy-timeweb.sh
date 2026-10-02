#!/usr/bin/env bash
set -euo pipefail

# Run from the mystix repo root on your Mac (VPN off):
#   bash scripts/deploy-timeweb.sh
#
# Copies backend + compose to the VPS. Leaves MONGODB_URI on the server
# as-is (Atlas). Set TIMEWEB_PUBLIC_URL if the public API origin changes.
# If a VPN (utun) swallows SSH, the script binds to Wi-Fi (en0) automatically.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${TIMEWEB_HOST:-root@201.24.124.49}"
REMOTE_DIR="${TIMEWEB_DIR:-~/mystix}"
PUBLIC_URL="${TIMEWEB_PUBLIC_URL:-https://arcanyx.ru}"
SSH_TARGET="${HOST#*@}"
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
SSH_OPTS=(-o ConnectTimeout=20)
SCP_OPTS=(-o ConnectTimeout=20)
if [[ -n "$LAN_IP" ]] && route -n get "$SSH_TARGET" 2>/dev/null | grep -q 'interface: utun'; then
  echo "VPN route detected; binding SSH to Wi-Fi $LAN_IP"
  SSH_OPTS+=(-b "$LAN_IP")
  SCP_OPTS+=(-o "BindAddress=$LAN_IP")
fi

cd "$ROOT"

if [[ ! -f backend/.env ]]; then
  echo "backend/.env is missing."
  exit 1
fi

echo "Copying files to $HOST:$REMOTE_DIR"
ssh "${SSH_OPTS[@]}" "$HOST" "mkdir -p $REMOTE_DIR/backend/data $REMOTE_DIR/backend/media/meditations $REMOTE_DIR/backend/media/covers"

scp "${SCP_OPTS[@]}" Dockerfile docker-compose.yml .dockerignore "$HOST:$REMOTE_DIR/"
scp "${SCP_OPTS[@]}" backend/*.py backend/requirements.txt backend/Procfile backend/runtime.txt \
  "$HOST:$REMOTE_DIR/backend/"
scp "${SCP_OPTS[@]}" backend/data/meditations.json backend/data/tarot_spreads.json \
  backend/data/daily_quotes.json \
  "$HOST:$REMOTE_DIR/backend/data/"
if [[ -d backend/static ]]; then
  ssh "${SSH_OPTS[@]}" "$HOST" "mkdir -p $REMOTE_DIR/backend/static"
  scp "${SCP_OPTS[@]}" -r backend/static/. "$HOST:$REMOTE_DIR/backend/static/"
fi
if [[ -d backend/media ]]; then
  scp "${SCP_OPTS[@]}" -r backend/media/. "$HOST:$REMOTE_DIR/backend/media/"
fi

ssh "${SSH_OPTS[@]}" "$HOST" "bash -s" <<EOF
set -euo pipefail
cd $REMOTE_DIR
set_env() {
  local key="\$1"
  local value="\$2"
  if grep -q "^\${key}=" backend/.env; then
    sed -i "s|^\${key}=.*|\${key}=\${value}|" backend/.env
  else
    printf '%s=%s\n' "\$key" "\$value" >> backend/.env
  fi
}
set_env PUBLIC_API_URL "$PUBLIC_URL"
set_env ADMIN_EMAILS "fckgmia@gmail.com"
set_env S3_ENDPOINT_URL "https://s3.twcstorage.ru"
set_env S3_BUCKET "f37d10a9-8395-43a1-8ef6-7041b336e49b"
set_env S3_REGION "ru-1"
set_env S3_PUBLIC_BASE_URL "https://s3.twcstorage.ru/f37d10a9-8395-43a1-8ef6-7041b336e49b"
set_env S3_MEDITATIONS_PREFIX ""
set_env S3_COVERS_PREFIX ""
set_env ADMIN_AUDIO_MAX_MB "120"
set_env ADMIN_COVER_MAX_MB "12"
grep -q '^S3_ACCESS_KEY_ID=' backend/.env || printf 'S3_ACCESS_KEY_ID=\n' >> backend/.env
grep -q '^S3_SECRET_ACCESS_KEY=' backend/.env || printf 'S3_SECRET_ACCESS_KEY=\n' >> backend/.env
grep -q '^FAL_KEY=' backend/.env || printf 'FAL_KEY=\n' >> backend/.env
grep -q '^FAL_IMAGE_MODEL=' backend/.env || printf 'FAL_IMAGE_MODEL=fal-ai/flux/schnell\n' >> backend/.env

if command -v docker >/dev/null 2>&1; then
  docker compose up -d --build api
else
  echo "Docker is not installed. Run: sudo apt-get install -y docker.io docker-compose-v2"
  exit 1
fi
if [[ -f /etc/nginx/sites-enabled/arcanyx.ru ]]; then
  sed -i -E 's/client_max_body_size [0-9]+m;/client_max_body_size 140m;/' /etc/nginx/sites-enabled/arcanyx.ru
  nginx -t
  systemctl reload nginx
fi
mkdir -p /var/www/arcanyx/media/meditations
if ls backend/media/meditations/*.mp3 >/dev/null 2>&1; then
  cp -a backend/media/meditations/*.mp3 /var/www/arcanyx/media/meditations/
  chown -R www-data:www-data /var/www/arcanyx
fi
echo
echo "Local health:"
sleep 3
curl -sS --max-time 8 http://127.0.0.1:8000/api/health || true
echo
echo "Public URL: $PUBLIC_URL/api/health"
echo "Google callback: $PUBLIC_URL/api/auth/google/callback"
EOF
