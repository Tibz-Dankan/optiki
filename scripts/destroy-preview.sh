#!/bin/bash
# Removes one pull request's preview container and deletes its env=pr-<n> rows from the shared database.
# The purge runs with the preview's own image (it knows every table that PR added), falling back to production's.
# Usage: ./destroy-preview.sh <pr-number> [image]

set -euo pipefail

PR=${1:-}
IMAGE=${2:-}

if [[ ! "$PR" =~ ^[0-9]+$ ]]; then
  echo "Usage: ./destroy-preview.sh <pr-number> [image]"
  exit 1
fi

source "$(dirname "$0")/lib.sh"

require_docker
require_env_file "$OPTIKI_HOME/preview.env"

NAME="optiki-pr-$PR"

if [ -z "$IMAGE" ]; then
  IMAGE=$(docker inspect -f '{{.Config.Image}}' "$NAME" 2> /dev/null || true)
fi
if [ -z "$IMAGE" ]; then
  IMAGE=$(docker inspect -f '{{.Config.Image}}' optiki-prod 2> /dev/null || true)
fi

echo "Removing $NAME"
docker rm -f "$NAME" &> /dev/null || true

if [ -z "$IMAGE" ]; then
  echo "ERROR: no optiki image found to run the purge with. Run it by hand:"
  echo "  docker run --rm --network $DB_NETWORK --env-file $OPTIKI_HOME/preview.env --entrypoint ./purge <image> pr-$PR"
  exit 1
fi

echo "Purging env pr-$PR with $IMAGE"
docker run --rm --network "$DB_NETWORK" --env-file "$OPTIKI_HOME/preview.env" --entrypoint ./purge "$IMAGE" "pr-$PR"

# Images no container uses any more (closed PRs, old production builds)
docker image prune -af --filter "until=24h" > /dev/null || true
