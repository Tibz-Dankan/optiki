#!/bin/bash
# Starts (or replaces) production at https://<OPTIKI_DOMAIN>. Its rows are tagged env=production.
# Usage: OPTIKI_DOMAIN=optiki.example.com ./deploy-prod.sh <image> <git-sha>

set -euo pipefail

IMAGE=${1:-}
SHA=${2:-}

if [ -z "$IMAGE" ] || [ -z "$SHA" ]; then
  echo "Usage: OPTIKI_DOMAIN=optiki.example.com ./deploy-prod.sh <image> <git-sha>"
  exit 1
fi

if [ -z "${OPTIKI_DOMAIN:-}" ]; then
  echo "ERROR: OPTIKI_DOMAIN is not set"
  exit 1
fi

source "$(dirname "$0")/lib.sh"

require_docker
require_env_file "$OPTIKI_HOME/prod.env"

echo "Deploying $IMAGE to https://$OPTIKI_DOMAIN"

start_app optiki-prod "$OPTIKI_DOMAIN" "$IMAGE" "$OPTIKI_HOME/prod.env" 8001 production "$SHA" -e APP_ENV=production
wait_for_health optiki-prod 8001 "$SHA"
