#!/bin/bash
# Starts (or replaces) the preview of one pull request at https://pr-<n>.<OPTIKI_DOMAIN>.
# Its rows in the shared database are tagged env=pr-<n>.
# Usage: OPTIKI_DOMAIN=optiki.example.com ./deploy-preview.sh <pr-number> <image> <git-sha>

set -euo pipefail

PR=${1:-}
IMAGE=${2:-}
SHA=${3:-}

if [[ ! "$PR" =~ ^[0-9]+$ ]] || [ -z "$IMAGE" ] || [ -z "$SHA" ]; then
  echo "Usage: OPTIKI_DOMAIN=optiki.example.com ./deploy-preview.sh <pr-number> <image> <git-sha>"
  exit 1
fi

if [ -z "${OPTIKI_DOMAIN:-}" ]; then
  echo "ERROR: OPTIKI_DOMAIN is not set"
  exit 1
fi

source "$(dirname "$0")/lib.sh"

require_docker
require_env_file "$OPTIKI_HOME/preview.env"

NAME="optiki-pr-$PR"
HOST="pr-$PR.$OPTIKI_DOMAIN"

echo "Deploying $IMAGE to https://$HOST"

start_app "$NAME" "$HOST" "$IMAGE" "$OPTIKI_HOME/preview.env" 8000 "pr-$PR" "$SHA" --label "optiki.pr=$PR"
wait_for_health "$NAME" 8000 "$SHA"
