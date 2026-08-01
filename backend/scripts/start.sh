#!/usr/bin/env sh
# Apply safe Alembic migrations before starting the single Render web process.
set -eu

flask --app wsgi db upgrade
exec gunicorn --workers 2 --threads 4 --bind "0.0.0.0:$PORT" --timeout 30 wsgi:app
