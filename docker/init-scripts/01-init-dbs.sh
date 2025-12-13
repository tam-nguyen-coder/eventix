#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE eventix_booking_db;
    CREATE DATABASE eventix_payment_db;
EOSQL
