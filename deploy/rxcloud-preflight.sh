#!/usr/bin/env bash
# RX CLOUD — read-only prerequisites check for the machine running this script.
set -Eeuo pipefail
if [[ "${1:---check}" != "--check" || $# -gt 1 ]]; then
  echo "Usage: bash deploy/rxcloud-preflight.sh [--check]" >&2
  exit 2
fi
cd "$(dirname "$0")/.."
failed=0
check(){
  local label="$1"; shift
  if "$@" >/dev/null 2>&1; then
    printf 'OK  %s\n' "$label"
  else
    printf 'WARN %s\n' "$label"
    failed=1
  fi
}
node_supported(){
  command -v node >/dev/null || return 1
  local major
  major="$(node -p 'Number(process.versions.node.split(".")[0])')" || return 1
  [[ "$major" =~ ^[0-9]+$ ]] && (( major >= 22 ))
}
echo 'RX CLOUD — read-only server readiness check'
check 'Linux operating system' test "$(uname -s)" = Linux
check 'Node.js >=22' node_supported
check 'git installed' command -v git
check 'Caddy installed' command -v caddy
check 'curl installed' command -v curl
check 'systemctl installed' command -v systemctl
check 'server source present' test -f rx-cloud-server.cjs
check 'Worker adapter present' test -f worker.js
check 'public assets directory present' test -d public
check 'staging env example present' test -f deploy/rxcloud.env.example
check 'existing service template present' test -f deploy/rxcloud.service
check 'existing proxy template present' test -f deploy/Caddyfile.rxcloud.example
echo 'No files, services, firewall, DNS or production systems were changed.'
if (( failed )); then
  echo 'RESULT: NOT READY — address warnings before install.'
  exit 1
fi
echo 'RESULT: basic prerequisites found; HTTPS, backups, security and live service still unverified.'
