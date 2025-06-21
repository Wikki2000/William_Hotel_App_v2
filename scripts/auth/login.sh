#!/bin/bash
# POST request to logged-in user

if [ $# -ne 2 ]; then
  echo "Usage: <script> <email or username> <password>"
  exit 1
fi

curl -c cookies.txt -X POST http://localhost:5002/api/v1/account/login \
-H "Content-Type: application/json" \
-d "{\"email_or_username\": \"$1\", \"password\": \"$2\"}"
