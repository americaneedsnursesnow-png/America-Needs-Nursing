-- Run once as a PostgreSQL superuser (e.g. user "postgres") in psql or pgAdmin:
--   psql -U postgres -f scripts/setup-local-postgres.sql
--
-- Then use in .env: DATABASE_USER=ann DATABASE_PASSWORD=ann DATABASE_NAME=ann

CREATE USER ann WITH PASSWORD 'ann' CREATEDB;
CREATE DATABASE ann OWNER ann;
