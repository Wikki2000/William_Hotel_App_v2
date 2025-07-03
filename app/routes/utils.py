#!/usr/bin/python3
"""Define function needed accross different files."""
from uuid import uuid4


def cache_burst_versioning(version_id="v1"):
    """Version ID for static files cache bursting."""
    return version_id if version_id else str(uuid4())

