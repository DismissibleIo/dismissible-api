#!/bin/bash
# Runs the API image in Docker Compose against every storage and cache combination.
# Each combination goes through the item lifecycle and a short performance test.
#
# Usage:
#   ./scripts/test-compose-stack.sh
#
# Uses its own Compose project, which is removed with its volumes on exit.

set -euo pipefail

COMPOSE=(docker compose -p dismissible-compose-test)
API_URL="http://localhost:3001"
MAX_WAIT_SECONDS=60
REPORT_DIR="$(mktemp -d)"

cleanup() {
  "${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$REPORT_DIR"
}
trap cleanup EXIT

expect_status() {
  local expected="$1" method="$2" path="$3"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API_URL$path")
  if [ "$status" != "$expected" ]; then
    echo "✗ $method $path returned $status, expected $expected"
    "${COMPOSE[@]}" logs --tail 50 dismissible-api
    exit 1
  fi
}

wait_for_api() {
  for _ in $(seq 1 "$MAX_WAIT_SECONDS"); do
    if curl -s -o /dev/null -f "$API_URL/health"; then
      return
    fi
    sleep 1
  done
  echo "✗ API was not healthy within ${MAX_WAIT_SECONDS}s"
  "${COMPOSE[@]}" logs --tail 50 dismissible-api
  exit 1
}

"${COMPOSE[@]}" build dismissible-api

for storage in memory postgres dynamodb; do
  for cache in "" memory redis; do
    echo ""
    echo "=== storage=$storage cache=${cache:-none}"

    DISMISSIBLE_STORAGE_TYPE="$storage" DISMISSIBLE_CACHE_TYPE="$cache" \
      "${COMPOSE[@]}" up -d --no-build --force-recreate dismissible-api
    wait_for_api

    item="/v1/users/compose-user/items/item-$storage-${cache:-none}-$(date +%s)"
    expect_status 400 DELETE "$item"
    expect_status 200 GET "$item"
    expect_status 200 DELETE "$item"
    expect_status 400 DELETE "$item"
    expect_status 201 POST "$item"
    echo "✓ Item lifecycle"

    PERF_DURATION=2 PERF_CONNECTIONS=5 PERF_CREATE_COUNT=50 PERF_GET_COUNT=50 \
      PERF_OUTPUT_PATH="$REPORT_DIR/$storage-${cache:-none}.html" \
      npm run --silent test:perf | grep -E 'Phase:|Average:.*req/s|Errors:  |Timeouts:|Non-2xx:|completed'
  done
done

echo ""
echo "✓ Compose stack test passed!"
