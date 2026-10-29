#!/usr/bin/env bash
# RX CLOUD 3.0 — safe bootstrap PREVIEW, no production changes.
set -Eeuo pipefail
usage(){ echo "Usage: bash deploy/rxcloud-preflight.sh [--check]"; }
if [[ "${1:---check}" != "--check" || $# -gt 1 ]]; then usage; exit 2; fi
fail=0
check(){ if eval "$2" >/dev/null 2>&1; then printf 'OK  %s\n' "$1"; else printf 'WARN %s\n' "$1"; fail=1; fi; }
echo 'RX CLOUD 3.0 — read-only server readiness check'
check 'Linux operating system' '[[ "$(uname -s)" == Linux ]]'
check 'Node.js >=22' 'command -v node && [[ "$(node -p "process.versions.node.split(\x27.\x27)[0]")" -ge 22 ]]'
check 'git installed' 'command -v git'
check 'Caddy installed' 'command -v caddy'
check 'curl installed' 'command -v curl'
check 'systemctl installed' 'command -v systemctl'
check 'server source present' '[[ -f rx-cloud-server.cjs && -f worker.js && -d public ]]'
check 'staging env example present' '[[ -f deploy/rxcloud.env.example ]]'
check 'existing service template present' '[[ -f deploy/rxcloud.service ]]'
check 'existing proxy template present' '[[ -f deploy/Caddyfile.rxcloud.example ]]'
echo 'No files, services, firewall, DNS or production systems were changed.'
if (( fail )); then echo 'RESULT: NOT READY — address warnings before install.'; exit 1; fi
echo 'RESULT: basic prerequisites found; security and functional tests still required.'
