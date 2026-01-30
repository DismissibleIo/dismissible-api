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
# Default image tag: dismissible-api:pr-check

set -e

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

MAX_WAIT_SECONDS=60
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://localhost:3001/health}"

# Build Docker image unless --no-build flag was provided
if [ "$BUILD_IMAGE" = true ]; then
  echo "Building Docker image: $IMAGE_TAG"
  echo ""

  docker build -t "$IMAGE_TAG" .
  BUILD_EXIT_CODE=$?

  echo ""
  if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo "✗ Docker build failed"
    exit 1
  fi

  echo "✓ Docker image built successfully"
  echo ""
fi

# Run container in detached mode
CONTAINER_ID=$(docker run -d \
  --network host \
  -e DISMISSIBLE_STORAGE_TYPE="postgres" \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://postgres:postgres@localhost:5432/dismissible" \
  -e DISMISSIBLE_RUN_MIGRATION=false \
  "$IMAGE_TAG")

echo "Container started: $CONTAINER_ID"

cleanup() {
  echo "Cleaning up container..."
  docker rm -f "$CONTAINER_ID" 2>/dev/null || true
}
trap cleanup EXIT

# Wait for container to be healthy
echo "Waiting for container to be healthy (max ${MAX_WAIT_SECONDS}s)..."
for i in $(seq 1 "$MAX_WAIT_SECONDS"); do
  HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null || echo "unknown")
  echo "  Attempt $i/$MAX_WAIT_SECONDS: health status = $HEALTH_STATUS"
  
  if [ "$HEALTH_STATUS" = "healthy" ]; then
    echo "✓ Container is healthy!"
    break
  fi
  
  if [ $i -eq "$MAX_WAIT_SECONDS" ]; then
    echo "✗ Container failed to become healthy within ${MAX_WAIT_SECONDS} seconds"
    echo ""
    echo "Container logs:"
    docker logs "$CONTAINER_ID"
    exit 1
  fi
  sleep 1
done

# Verify health endpoint responds
echo ""
echo "Verifying $HEALTH_ENDPOINT..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_ENDPOINT" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Health endpoint returned 200"
else
  echo "✗ Health endpoint returned $HTTP_CODE"
  echo ""
  echo "Container logs:"
  docker logs "$CONTAINER_ID"
  exit 1
fi

echo ""
echo "✓ Docker image test passed!"