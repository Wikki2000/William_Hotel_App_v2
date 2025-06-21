#!/bin/bash

MYSQL_USER="wills_dev"
DATABASE_NAME="wills_dev_db"

# Prompt for the table name to restore
read -p "Enter the table name to restore: " TABLE_NAME

# Define the backup file name based on the table name
BACKUP_FILE="${TABLE_NAME}_backup.sql"

# Check if the backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file $BACKUP_FILE not found!"
    exit 1
fi

echo "Restoring table '$TABLE_NAME' from backup file $BACKUP_FILE into database '$DATABASE_NAME'..."

# Run the MySQL command to restore the table
mysql -u "$MYSQL_USER" -p "$DATABASE_NAME" < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Table '$TABLE_NAME' restored successfully!"
else
    echo "Failed to restore table '$TABLE_NAME'. Please check your credentials and backup file."
fi

