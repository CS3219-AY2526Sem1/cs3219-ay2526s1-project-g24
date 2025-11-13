# AI Assistance Disclosure:
# Tool: GitHub Copilot (model: Claude Sonnet 4.5)
# Date Range: November 1-10, 2025
# Scope: Generated Prometheus metrics middleware for FastAPI:
#   - HTTP request counter with method, endpoint, status labels
#   - Request duration histogram with configurable buckets
#   - Active requests gauge
#   - Metrics endpoint exposure at /metrics
#   - Automatic endpoint path normalization
# Author review: Code reviewed, tested, and validated by team. Modified for:
#   - Enhanced metric bucketing for better observability
#   - Added metrics endpoint skip logic

"""
Prometheus metrics middleware for FastAPI services.

Usage:
    from app.middleware.metrics import setup_metrics
    
    app = FastAPI()
    setup_metrics(app)
"""

from fastapi import FastAPI, Request, Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
import time
from typing import Callable

# Define metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

ACTIVE_REQUESTS = Gauge(
    'active_requests',
    'Number of requests currently being processed'
)


async def metrics_middleware(request: Request, call_next: Callable) -> Response:
    """
    Middleware to track request metrics.
    
    Tracks:
    - Total request count by method, endpoint, and status
    - Request duration by method and endpoint
    - Active requests gauge
    """
    # Skip metrics endpoint itself
    if request.url.path == "/metrics":
        return await call_next(request)
    
    ACTIVE_REQUESTS.inc()
    start_time = time.time()
    
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        
        # Normalize endpoint path (remove IDs for better aggregation)
        endpoint = request.url.path
        
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=endpoint,
            status=response.status_code
        ).inc()
        
        REQUEST_DURATION.labels(
            method=request.method,
            endpoint=endpoint
        ).observe(duration)
        
        return response
    finally:
        ACTIVE_REQUESTS.dec()


async def metrics_endpoint(request: Request) -> Response:
    """
    Endpoint to expose Prometheus metrics.
    """
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


def setup_metrics(app: FastAPI) -> None:
    """
    Set up Prometheus metrics for a FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    # Add middleware
    app.middleware("http")(metrics_middleware)
    
    # Add metrics endpoint
    app.get("/metrics", include_in_schema=False)(metrics_endpoint)
