"""Alembic environment bound to the Flask application's SQLAlchemy metadata."""

from logging.config import fileConfig

from alembic import context
from flask import current_app

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def get_metadata():
    """Return model metadata after Flask-Migrate has initialized the app."""
    return current_app.extensions["migrate"].db.metadata


def run_migrations_offline():
    """Generate SQL without opening a database connection."""
    url = current_app.extensions["migrate"].db.engine.url
    context.configure(url=str(url), target_metadata=get_metadata(), literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Apply migrations using the active Flask SQLAlchemy engine."""
    connectable = current_app.extensions["migrate"].db.engine
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=get_metadata())
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
