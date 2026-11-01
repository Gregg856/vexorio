#!/usr/bin/env bash
# RX CLOUD 3.1 — staged installer, defaults to read-only preview.
set -Eeuo pipefail
MODE="${1:---dry-run}"
if [[ "$MODE" != "--dry-run" && "$MODE" != "--install" ]] || [[ $# -gt 1 ]]; then
  echo "Usage: bash deploy/rxcloud-install.sh [--dry-run|--install]" >&2; exit 2
fi
cd "$(dirname "$0")/.."
echo "RX CLOUD 4.2 — mode: $MODE"
if [[ "$MODE" == "--dry-run" ]]; then
  if [[ ! -f rx-cloud-server.cjs || ! -f worker.js || ! -f index.html ]]; then
    echo "WARNING: Missing RX CLOUD source files or index.html asset. Installation is NOT ready."
  fi
  echo "Would check Linux, Node.js 22+, systemd, Caddy and source tree."
  echo "Would create system user rxcloud and /opt/rxcloud/vexorio."
  echo "Would copy application root static assets, install a systemd unit and prepare /etc/rxcloud/rxcloud.env."
  echo "Would NOT start services, modify DNS, enable Caddy, or touch production."
  exit 0
fi
if [[ ! -f rx-cloud-server.cjs || ! -f worker.js || ! -f index.html ]]; then
  echo "Missing RX CLOUD source files or index.html asset. Installation refused." >&2; exit 1
fi
# Refuse symlinks and likely private files in the published asset set.
while IFS= read -r -d '' asset; do
  name="${asset#./}"
  if [[ -L "$asset" ]]; then echo "Refusing symlink asset: $name" >&2; exit 1; fi
  case "${name,,}" in
    *secret*|*credential*|*private*|*backup*|*token*|*password*|*.env*|*.pem|*.key)
      echo "Refusing potentially sensitive asset: $name" >&2; exit 1;;
  esac
done < <(find . -maxdepth 1 \( -type f -o -type l \) \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.json' -o -name '*.txt' -o -name '*.webmanifest' \) -print0)
if [[ "$(uname -s)" != Linux || "$(id -u)" -ne 0 ]]; then
  echo "--install requires root on Linux" >&2; exit 1
fi
for bin in node systemctl id install cp; do command -v "$bin" >/dev/null || { echo "Missing $bin" >&2; exit 1; }; done
major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( major < 22 )); then echo "Node.js >=22 required" >&2; exit 1; fi
if [[ -e /etc/systemd/system/rxcloud.service || -e /opt/rxcloud/vexorio ]]; then
  echo "Existing installation detected. Refusing to overwrite." >&2; exit 1
fi
if ! id rxcloud >/dev/null 2>&1; then
  useradd --system --home-dir /opt/rxcloud --shell /usr/sbin/nologin rxcloud
fi
install -d -m 0750 -o rxcloud -g rxcloud /opt/rxcloud/vexorio
# Exclude .git and sensitive local files; copy only required server sources.
install -m 0644 -o rxcloud -g rxcloud rx-cloud-server.cjs worker.js /opt/rxcloud/vexorio/
install -d -m 0755 -o rxcloud -g rxcloud /opt/rxcloud/vexorio/public
find . -maxdepth 1 -type f -name '*.html' -exec cp -t /opt/rxcloud/vexorio/public/ -- {} +
for pattern in '*.js' '*.css' '*.svg' '*.png' '*.jpg' '*.jpeg' '*.webp' '*.ico' '*.json' '*.txt' '*.webmanifest'; do
  find . -maxdepth 1 -type f -name "$pattern" -exec cp -t /opt/rxcloud/vexorio/public/ -- {} +
done
runtime_modules=(rx-persistent-memory.mjs rx-knowledge-base.mjs rx-world-knowledge.mjs rx-chat-planner.mjs rx-task-catalog.cjs rx-math-core.cjs rx-queen-model-bridge.mjs rx-bibi-model-bridge.mjs rx-queen-local-model.cjs)
for module in "${runtime_modules[@]}"; do
  if [[ ! -f "$module" || -L "$module" ]]; then echo "Missing or unsafe runtime module: $module" >&2; exit 1; fi
done
install -m 0644 -o rxcloud -g rxcloud "${runtime_modules[@]}" /opt/rxcloud/vexorio/
chown -R rxcloud:rxcloud /opt/rxcloud/vexorio/public
install -d -m 0700 -o root -g root /etc/rxcloud
install -m 0600 -o root -g root deploy/rxcloud.env.example /etc/rxcloud/rxcloud.env
install -m 0644 -o root -g root deploy/rxcloud.service /etc/systemd/system/rxcloud.service
systemctl daemon-reload
echo "Staged only: fill /etc/rxcloud/rxcloud.env with STAGING credentials, then validate before enabling service."
echo "No service started, no DNS modified, no production migration."
