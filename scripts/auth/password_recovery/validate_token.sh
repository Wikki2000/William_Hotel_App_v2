#!/bin/bash
# POST request to register user

if [ $# -ne 1 ]; then
  echo "Usage: <script> <email>"
  exit 1
fi

curl POST http://localhost:5002/api/v1/account/validate-token \
-H "Content-Type: application/json" -d "{\"token\": \"$1\"}"
