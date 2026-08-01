"""Application factory wiring configuration, extensions, routes, and CLI commands."""

from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import HTTPException

from .commands import register_commands
from .config import Config
from .errors import ApiError
from .extensions import db, migrate


def create_app(test_config=None):
    """Create a configured Flask application without relying on global state."""
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": app.config["CORS_ORIGINS"],
                "methods": ["GET", "POST", "OPTIONS"],
                "allow_headers": ["Authorization", "Content-Type"],
            }
        },
    )

    from .api.admin import admin_bp
    from .api.public import public_bp

    app.register_blueprint(public_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    register_commands(app)

    @app.errorhandler(ApiError)
    def handle_api_error(error):
        return jsonify({"error": error.to_dict()}), error.status_code

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        db.session.rollback()
        return jsonify(
            {
                "error": {
                    "code": "duplicate_application",
                    "message": "An application already exists for this email or phone number.",
                }
            }
        ), 409

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        return jsonify(
            {"error": {"code": error.name.lower().replace(" ", "_"), "message": error.description}}
        ), error.code

    return app
