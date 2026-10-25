#!/bin/bash
# Zero-downtime deployment of optiki-backend into the shared app-stack (Docker Swarm).
# Usage: ./optiki-deploy.sh [new-image-tag]

set -e  # Exit on any error

NEW_IMAGE=$1
if [ -z "$NEW_IMAGE" ]; then
  echo "Error: New image tag not provided"
  echo "Usage: ./optiki-deploy.sh [new-image-tag]"
  exit 1
fi

echo "Deploying new image: $NEW_IMAGE"

SERVICE="app-stack_optiki-backend"
HOST="optikiapi.tuliime.com"

# Create the project directory if it doesn't exist
mkdir -p ~/app
cd ~/app

# Copy optiki.env from the home directory to the app directory
if [ -f ~/optiki.env ]; then
  echo "Copying optiki.env from home directory to app directory..."
  mkdir -p ./optiki
  cp ~/optiki.env ./optiki/.env
else
  echo "ERROR: No ~/optiki.env file found!"
  echo "Please create it from server/.env.example in the optiki repo"
  exit 1
fi

# Copy docker-compose.yaml from the home directory to the app directory
if [ -f ~/docker-compose.yaml ]; then
  echo "Copying docker-compose.yaml from home directory to app directory..."
  cp ~/docker-compose.yaml ./
else
  echo "ERROR: No ~/docker-compose.yaml file found!"
  echo "It is deployed by tuliime-backend and must define the optiki-backend service"
  exit 1
fi

if ! grep -q '^  optiki-backend:' docker-compose.yaml; then
  echo "ERROR: docker-compose.yaml has no optiki-backend service"
  echo "Deploy tuliime-backend's docker-compose.yaml with the optiki-backend service first"
  exit 1
fi

# Initialize Docker Swarm if not already initialized
if ! docker info | grep -q "Swarm: active"; then
  echo "Initializing Docker Swarm..."
  docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')
fi

echo "About to deploy stack with image: ${NEW_IMAGE}"

# Deploy or update the stack
if docker stack ls | grep -q "app-stack"; then
  echo "Updating existing stack..."
else
  echo "Deploying new stack..."
fi
docker stack deploy -c docker-compose.yaml app-stack --with-registry-auth

# Wait for backend service to be running and healthy behind Traefik
echo "Waiting for backend service to start and answer https://$HOST/health..."

check_service() {
  echo "  Checking service existence..."
  if ! docker service ls | grep -q $SERVICE; then
    echo "  Service $SERVICE not found"
    return 1
  fi

  echo "  Checking service replicas..."
  if ! docker service ls | grep $SERVICE | grep -q "1/1"; then
    echo "  Service replicas not ready yet"
    return 1
  fi

  # No container port is published on the host, so check through Traefik on loopback.
  # -k: the connection is to 127.0.0.1, and the origin cert may be Traefik's default one.
  echo "  Checking health endpoint through Traefik..."
  if ! curl -fsSk -o /dev/null --max-time 5 --resolve "$HOST:443:127.0.0.1" "https://$HOST/health"; then
    echo "  Health endpoint not responding"
    return 1
  fi

  echo "  Health endpoint is responding"

  return 0
}

# Keep checking until service is running or timeout (200 seconds)
MAX_ATTEMPTS=40
ATTEMPT=1
WAIT_TIME=5  # seconds between attempts

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Checking if backend service is running (attempt $ATTEMPT/$MAX_ATTEMPTS)..."

  if check_service; then
    echo "Backend service is now running and healthy at https://$HOST!"
    break
  fi

  # If this is the first few attempts, show more debugging info
  if [ $ATTEMPT -le 3 ] || [ $(($ATTEMPT % 10)) -eq 0 ]; then
    echo "Service status:"
    docker service ps "$SERVICE" --no-trunc || true
    echo "Recent logs:"
    docker service logs "$SERVICE" --tail 10 || true
  fi

  ATTEMPT=$((ATTEMPT+1))

  if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo "ERROR: Backend service failed to start within the allocated time."
    echo "Final service status:"
    docker service ps "$SERVICE" --no-trunc || true
    echo "Detailed container logs:"
    docker service logs "$SERVICE" --tail 100 || true
    echo "Number of variables in optiki/.env: $(grep -v '^#' ./optiki/.env | grep -v '^$' | wc -l)"
    exit 1
  fi

  echo "Waiting for $WAIT_TIME seconds before next check..."
  sleep $WAIT_TIME
done

echo "Deployment successful!"
