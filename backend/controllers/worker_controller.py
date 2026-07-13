"""Worker controller, HTTP endpoint for monitoring EC2 worker status.

This module ONLY handles request parsing and response formatting.
All business logic lives in services.worker_service.
"""

from flask import Blueprint
from services import worker_service
from utils.response import success_response

worker_bp = Blueprint("workers", __name__)


@worker_bp.route("/api/workers", methods=["GET"])
def list_workers():
    """List all EC2 worker instances and their simulated status.

    Returns: [{"instance_id", "name", "status", "state"}, ...]
    """
    result = worker_service.list_workers()
    return success_response(result)
