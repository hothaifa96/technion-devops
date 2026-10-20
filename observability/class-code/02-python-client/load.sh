#!/usr/bin/env bash
# Generate traffic against the shop app. Usage: ./load.sh [base_url]
BASE=${1:-http://localhost:5000}
echo "sending traffic to $BASE (Ctrl+C to stop)"
while true; do
  curl -s -o /dev/null "$BASE/"
  curl -s -o /dev/null "$BASE/products"
  curl -s -o /dev/null "$BASE/checkout" &
  curl -s -o /dev/null -X POST "$BASE/orders"
  curl -s -o /dev/null "$BASE/does-not-exist"
  sleep 0.2
done
