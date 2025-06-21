#!/bin/bash
# POST request to register user

if [ $# -ne 5 ]; then
  echo "Usage: <script> <first_name> <last_name> <username> <email> <password>"
  exit 1
fi

curl -X POST http://localhost:5002/api/v1/account/register \
-H "Content-Type: application/json" \
-d "{\"first_name\": \"$1\", \"last_name\": \"$2\", \"username\": \"$3\", \"email\": \"$4\", \"password\": \"$5\"}"
