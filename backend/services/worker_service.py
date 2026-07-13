"""Worker service — simulates distributing jobs across EC2 instances.

MiniStack/LocalStack cannot actually execute code inside an EC2 instance,
so each "worker" here is only a status representation (idle/busy/error)
via instance tags. The real work (e.g. uploading a file to S3) still runs
in this backend process; this module just wraps it with worker selection,
fault injection, and a single retry — the same pattern a real distributed
job queue would use, minus the network hop.

This module NEVER touches Flask request/response objects.
"""

import random
from typing import Callable, TypeVar

from config.settings import settings
from repositories import ec2_repo
from utils.exceptions import ServiceUnavailableError

T = TypeVar("T")


class WorkerFailureError(Exception):
    """Internal signal that a worker "failed" (fault injection)."""


def list_workers() -> list[dict]:
    """Return simplified worker status for the ``/api/workers`` endpoint."""
    workers = ec2_repo.list_workers()
    result = []
    for w in workers:
        tags = ec2_repo.extract_tags(w)
        result.append({
            "instance_id": w["InstanceId"],
            "name": tags.get("Name"),
            "status": tags.get("Status", "unknown"),
            "state": w["State"]["Name"],
        })
    return result


def run_job(job_fn: Callable[[], T]) -> tuple[str, T]:
    """Run ``job_fn`` on an idle worker, with fault injection and one retry.

    Parameters
    ----------
    job_fn : Callable[[], T]
        A zero-argument function performing the actual work (e.g. an S3
        upload). Exceptions it raises propagate after being recorded as a
        worker failure.

    Returns
    -------
    tuple[str, T]
        The instance ID that "processed" the job, and the job's result.

    Raises
    ------
    ServiceUnavailableError
        If no worker is available at all.
    """
    worker_id = _pick_idle_worker()

    try:
        return _execute_on(worker_id, job_fn)
    except WorkerFailureError:
        backup_worker_id = _pick_idle_worker(exclude=worker_id)
        return _execute_on(backup_worker_id, job_fn)


def _execute_on(worker_id: str, job_fn: Callable[[], T]) -> tuple[str, T]:
    """Mark ``worker_id`` busy, run ``job_fn``, then mark idle/error."""
    ec2_repo.set_status(worker_id, "busy")
    try:
        if random.random() < settings.WORKER_FAULT_RATE:
            raise WorkerFailureError(f"Worker {worker_id} failed (simulated)")
        result = job_fn()
    except WorkerFailureError:
        ec2_repo.set_status(worker_id, "error")
        raise
    except Exception:
        ec2_repo.set_status(worker_id, "error")
        raise
    else:
        ec2_repo.set_status(worker_id, "idle")
        return worker_id, result


def _pick_idle_worker(exclude: str | None = None) -> str:
    """Pick an idle worker instance ID, falling back to any non-excluded one.

    Raises
    ------
    ServiceUnavailableError
        If there are no workers at all.
    """
    workers = list_workers()
    idle = [w for w in workers if w["status"] == "idle" and w["instance_id"] != exclude]
    if idle:
        return idle[0]["instance_id"]

    fallback = [w for w in workers if w["instance_id"] != exclude]
    if not fallback:
        raise ServiceUnavailableError("No EC2 worker instances are available")

    return fallback[0]["instance_id"]
