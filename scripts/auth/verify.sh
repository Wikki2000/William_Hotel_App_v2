#!/bin/bash
# Sent curl request to send-token endpoint

if [ $# -ne 1 ]; then
  echo "Usage: <script> <token>"
  exit 1
fi

curl -b cookies.txt -X POST http://localhost:5002/api/v1/account/verify \
-H "Content-Type: application/json" -d "{\"token\": \"$1\"}"
