#!/bin/bash
# POST request to create drinks object

if [ $# -ne 1 ]; then
  echo "Usage: <script> <id>  <room_type> <room_number> <unit_cost>"
  exit 1
fi

curl -X POST http://localhost:5002/api/v1/services/"$1"/add-room \
-H "Content-Type: application/json" -d "{\"room_type\": \"$2\", \"room_number\": \"$2\", \"unit_cost\": \"$3\"}"
