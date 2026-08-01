"""Production WSGI entry point used by Gunicorn and Flask CLI commands."""

from app import create_app

app = create_app()
