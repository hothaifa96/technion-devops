#!/bin/bash
set -euo pipefail

API_URL="${API_URL:-https://jsonplaceholder.typicode.com/users}"

echo "[$(date -Iseconds)] bash job on $(hostname)"
echo "GET ${API_URL}"

if ! body=$(curl -fsS --max-time 10 "$API_URL"); then
  echo "request failed" >&2
  exit 1
fi

echo "found $(echo "$body" | jq length) users:"
echo "$body" | jq -r '.[] | "  \(.name) <\(.email)> - \(.address.city)"'
