#!/bin/bash

DATABASE_NAME="wills_dev_db"
MYSQL_USER="wills_dev"

read -p "Enter the table name to backup: " TABLE_NAME

mysqldump -u"${MYSQL_USER}" -p "${DATABASE_NAME}" \
    "${TABLE_NAME}" > "${TABLE_NAME}_backup.sql"

echo "Backup for table '${TABLE_NAME}' save as ${TABLE_NAME}_backup.sql"
