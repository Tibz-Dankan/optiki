#!/bin/bash
# Helpers shared by the deploy scripts. Sourced, not run.

OPTIKI_HOME="$HOME/optiki"
EDGE_NETWORK=optiki-edge
DB_NETWORK=optiki-db

require_docker() {
  if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed!"
    exit 1
  fi

  if ! docker info &> /dev/null; then
    echo "ERROR: Cannot run Docker commands. Is the daemon running, and is $USER in the docker group?"
    exit 1
  fi

  for network in "$EDGE_NETWORK" "$DB_NETWORK"; do
    if ! docker network inspect "$network" &> /dev/null; then
      echo "ERROR: Docker network $network not found. Start the infrastructure first:"
      echo "  cd $OPTIKI_HOME/deploy && docker compose up -d"
      exit 1
    fi
  done
}

require_env_file() {
  if [ ! -f "$1" ]; then
    echo "ERROR: $1 not found. Create it from deploy/$(basename "$1").example"
    exit 1
  fi
}

# Replaces <container> with a fresh one serving https://<host> through Traefik.
# The container publishes no ports: Traefik is the only ingress, which is what
# makes the X-Real-IP header (used for rate limiting) trustworthy.
# Usage: start_app <container> <host> <image> <env-file> <port> <optiki-env> <git-sha> [extra docker create args...]
start_app() {
  local name=$1 host=$2 image=$3 env_file=$4 port=$5 optiki_env=$6 sha=$7
  shift 7

  docker rm -f "$name" &> /dev/null || true

  docker create --name "$name" --restart unless-stopped \
    --network "$EDGE_NETWORK" \
    --memory 512m --cpus 1 \
    --env-file "$env_file" \
    -e OPTIKI_ENV="$optiki_env" \
    -e APP_BASE_URL="https://$host" \
    -e GIT_SHA="$sha" \
    --label traefik.enable=true \
    --label "traefik.docker.network=$EDGE_NETWORK" \
    --label "traefik.http.routers.$name.rule=Host(\`$host\`)" \
    --label "traefik.http.routers.$name.entrypoints=websecure" \
    --label "traefik.http.routers.$name.tls.certresolver=letsencrypt" \
    --label "traefik.http.services.$name.loadbalancer.server.port=$port" \
    "$@" "$image" > /dev/null

  docker network connect "$DB_NETWORK" "$name"
  docker start "$name" > /dev/null
}

# Polls /health inside <container> until it reports <git-sha>, so tests never run against a stale deploy.
# Usage: wait_for_health <container> <port> <git-sha>
wait_for_health() {
  local name=$1 port=$2 sha=$3 body

  for _ in $(seq 1 45); do
    if [ "$(docker inspect -f '{{.State.Running}}' "$name" 2> /dev/null)" != "true" ]; then
      echo "ERROR: $name stopped while starting:"
      docker logs --tail 50 "$name"
      exit 1
    fi

    body=$(docker exec "$name" wget -qO- "http://127.0.0.1:$port/health" 2> /dev/null || true)
    if [[ "$body" == *"\"commit\":\"$sha\""* ]]; then
      echo "$name is healthy at $sha"
      return 0
    fi

    sleep 2
  done

  echo "ERROR: $name did not report $sha on /health within 90s:"
  docker logs --tail 50 "$name"
  exit 1
}
