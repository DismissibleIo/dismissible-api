#!/bin/bash
# Test Docker image for dismissible-api
#
# Usage:
#   ./test-docker-image.sh [--no-build|--skip-build] [IMAGE_TAG]
#
# Examples:
#   ./test-docker-image.sh                           # Build and test with default tag
#   ./test-docker-image.sh custom-tag                # Build and test with custom tag
#   ./test-docker-image.sh --no-build                # Test existing image (skip build)
#   ./test-docker-image.sh --no-build custom-tag     # Test existing custom image
#
# Environment:
#   DISMISSIBLE_TEST_STORAGE_TYPE=memory              # Avoid an external DB
#   DISMISSIBLE_STORAGE_RUN_SETUP=true                # Exercise storage setup
#   DOCKER_TEST_NETWORK_MODE=host                     # Use host networking (CI)
#   DOCKER_TEST_PORT=3001                             # Request a fixed host port
#
# Default image tag: dismissible-api:pr-check

set -Eeuo pipefail

# Parse command line arguments
BUILD_IMAGE=true
IMAGE_TAG=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --no-build|--skip-build)
      BUILD_IMAGE=false
      shift
      ;;
    *)
      IMAGE_TAG="$1"
      shift
      ;;
  esac
done

# Set default tag if not provided
if [ -z "$IMAGE_TAG" ]; then
  IMAGE_TAG="dismissible-api:pr-check"
fi

MAX_WAIT_SECONDS="${DOCKER_TEST_MAX_WAIT_SECONDS:-60}"
STORAGE_TYPE="${DISMISSIBLE_TEST_STORAGE_TYPE:-postgres}"
STORAGE_RUN_SETUP="${DISMISSIBLE_STORAGE_RUN_SETUP:-false}"
STORAGE_HOST="${DISMISSIBLE_TEST_STORAGE_HOST:-host.docker.internal}"
STORAGE_PORT="${DISMISSIBLE_TEST_STORAGE_PORT:-5432}"
STORAGE_DATABASE="${DISMISSIBLE_TEST_STORAGE_DATABASE:-dismissible}"
STORAGE_CONNECTION_STRING="${DISMISSIBLE_TEST_STORAGE_CONNECTION_STRING:-postgresql://postgres:postgres@${STORAGE_HOST}:${STORAGE_PORT}/${STORAGE_DATABASE}}"
DOCKER_NETWORK_MODE="${DOCKER_TEST_NETWORK_MODE:-bridge}"
DOCKER_TEST_PORT="${DOCKER_TEST_PORT:-0}"

CONTAINER_ID=""
HOST_PORT=""

print_container_diagnostics() {
  if [ -z "$CONTAINER_ID" ]; then
    return
  fi

  echo "Container state:"
  docker inspect --format='status={{.State.Status}} exit={{.State.ExitCode}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}not-configured{{end}}' "$CONTAINER_ID" 2>/dev/null || true
  echo "Container health log:"
  docker inspect --format='{{if .State.Health}}{{range .State.Health.Log}}{{printf "  %s exit=%d output=%s\n" .Start .ExitCode .Output}}{{end}}{{else}}  healthcheck is not configured{{end}}' "$CONTAINER_ID" 2>/dev/null || true
  echo "Container logs:"
  docker logs "$CONTAINER_ID" 2>&1 || true
}

# Build Docker image unless --no-build flag was provided
if [ "$BUILD_IMAGE" = true ]; then
  echo "Building Docker image: $IMAGE_TAG"
  echo ""

  if ! docker build -t "$IMAGE_TAG" .; then
    echo "✗ Docker build failed"
    exit 1
  fi

  echo ""
  echo "✓ Docker image built successfully"
  echo ""
fi

cleanup() {
  if [ -n "$CONTAINER_ID" ]; then
    echo "Cleaning up container..."
    docker rm -f "$CONTAINER_ID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# Run container in detached mode
if [ "$DOCKER_NETWORK_MODE" = "host" ]; then
  DOCKER_RUN_ARGS=(run -d --network host
    -e "DISMISSIBLE_STORAGE_TYPE=$STORAGE_TYPE"
    -e "DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING=postgresql://postgres:postgres@localhost:${STORAGE_PORT}/${STORAGE_DATABASE}"
    -e "DISMISSIBLE_STORAGE_RUN_SETUP=$STORAGE_RUN_SETUP"
    "$IMAGE_TAG")
else
  DOCKER_RUN_ARGS=(run -d
    -p "127.0.0.1:${DOCKER_TEST_PORT}:3001"
    --add-host host.docker.internal:host-gateway
    -e "DISMISSIBLE_STORAGE_TYPE=$STORAGE_TYPE"
    -e "DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING=$STORAGE_CONNECTION_STRING"
    -e "DISMISSIBLE_STORAGE_RUN_SETUP=$STORAGE_RUN_SETUP"
    "$IMAGE_TAG")
fi

if ! CONTAINER_ID="$(docker "${DOCKER_RUN_ARGS[@]}")"; then
  echo "✗ Container failed to start"
  exit 1
fi

echo "Container started: $CONTAINER_ID"

if [ "$DOCKER_NETWORK_MODE" = "host" ]; then
  HOST_PORT=3001
else
  HOST_PORT="$(docker inspect --format='{{(index (index .NetworkSettings.Ports "3001/tcp") 0).HostPort}}' "$CONTAINER_ID")"
fi
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://127.0.0.1:${HOST_PORT}/health}"

# Wait for container to be healthy
echo "Waiting for container to be healthy (max ${MAX_WAIT_SECONDS}s)..."
for i in $(seq 1 "$MAX_WAIT_SECONDS"); do
  HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null || echo "unknown")
  CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_ID" 2>/dev/null || echo "unknown")
  echo "  Attempt $i/$MAX_WAIT_SECONDS: health status = $HEALTH_STATUS"
  
  if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo "✓ Container is healthy!"
    break
  fi
  
  if [ "$CONTAINER_STATUS" = "exited" ] || [ "$CONTAINER_STATUS" = "dead" ]; then
    echo "✗ Container exited before becoming healthy"
    print_container_diagnostics
    exit 1
  fi

  if [ "$i" -eq "$MAX_WAIT_SECONDS" ]; then
    echo "✗ Container failed to become healthy within ${MAX_WAIT_SECONDS} seconds"
    print_container_diagnostics
    exit 1
  fi
  sleep 1
done

# Verify health endpoint responds
echo ""
echo "Verifying $HEALTH_ENDPOINT..."
HTTP_CODE=$(curl --silent --show-error --output /dev/null --write-out "%{http_code}" "$HEALTH_ENDPOINT" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Health endpoint returned 200"
else
  echo "✗ Health endpoint returned $HTTP_CODE"
  print_container_diagnostics
  exit 1
fi

echo ""
echo "✓ Docker image test passed!"
