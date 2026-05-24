#!/usr/bin/env bash
# 同步 products/study-tracker-mp/ → 公开 repo yoyo20260321/study-tracker-mp
# 用法: bash products/study-tracker-mp/scripts/sync-to-public.sh "commit message"

set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${HOME}/.cache/study-tracker-mp-mirror"
MSG="${1:-sync: latest changes}"

if [ ! -d "$DEST" ]; then
  echo "[sync] cloning mirror to $DEST"
  git clone https://github.com/yoyo20260321/study-tracker-mp.git "$DEST"
fi

cd "$DEST"
git pull --quiet origin main

# rsync 排除 secrets / local
rsync -a --delete \
  --exclude='node_modules' \
  --exclude='project.private.config.json' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --exclude='.git' \
  "${SRC}/" "${DEST}/"

git add -A
if git diff --cached --quiet; then
  echo "[sync] no changes"
  exit 0
fi

git commit -m "$MSG"
git push origin main
echo "[sync] ✓ pushed to https://github.com/yoyo20260321/study-tracker-mp"
