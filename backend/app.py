import os

from flask import Flask
from flask_cors import CORS

from config.aws import init_infrastructure
from controllers.auth_controller import auth_bp
from controllers.asset_controller import asset_bp
from controllers.worker_controller import worker_bp
from controllers.cart_controller import cart_bp
from controllers.order_controller import order_bp
from utils.exceptions import AppError
from utils.response import error_response


def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # Bootstrap MiniStack/LocalStack resources: S3 bucket, DynamoDB tables,
    # and worker EC2 instances. Idempotent — safe to call on every restart.
    init_infrastructure()

    # Max upload size: 55 MB (thumbnail 5 MB + 3D file 50 MB)
    app.config["MAX_CONTENT_LENGTH"] = 55 * 1024 * 1024

    origins = [o.strip() for o in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",") if o.strip()]

    # CORS — whitelist the Vite dev server origin
    CORS(
        app,
        origins=origins,
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(asset_bp)
    app.register_blueprint(worker_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(order_bp)

    # -----------------------------------------------------------------
    # Global error handlers
    # -----------------------------------------------------------------

    @app.errorhandler(AppError)
    def handle_app_error(error: AppError):
        """Catch all custom AppError subclasses and serialise them."""
        return error_response(error.code, error.message, error.status_code)

    @app.errorhandler(404)
    def handle_404(_):
        return error_response("NOT_FOUND", "Endpoint not found", 404)

    @app.errorhandler(405)
    def handle_405(_):
        return error_response("METHOD_NOT_ALLOWED", "Method not allowed", 405)

    @app.errorhandler(413)
    def handle_413(_):
        return error_response(
            "PAYLOAD_TOO_LARGE",
            "File too large. Max total upload size is 55 MB.",
            413,
        )

    @app.errorhandler(500)
    def handle_500(_):
        return error_response("INTERNAL_ERROR", "An unexpected error occurred", 500)

    # -----------------------------------------------------------------
    # Health check
    # -----------------------------------------------------------------

    @app.route("/api/health", methods=["GET"])
    def health():
        return {"success": True, "data": {"status": "ok"}}, 200

    return app


# Allow `flask run` to discover the app
app = create_app()
