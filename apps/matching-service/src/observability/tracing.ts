// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: October 1-10, 2025
// Scope: Generated OpenTelemetry distributed tracing:
//   - initTracing(): Initialize OTEL SDK with auto-instrumentation
//   - shutdownTracing(): Graceful shutdown
//   - withSpan(): Helper function for creating traced operations
//   OTLP exporter for Jaeger/Grafana Tempo integration
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Added custom span attributes for matching operations
//   - Enhanced error tracking with span status codes
//   - Configured sampling strategies for production

/**
 * OpenTelemetry tracing configuration
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { trace, Span, SpanStatusCode } from "@opentelemetry/api";
import { logger } from "../observability/logger.js";

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK
 */
export function initTracing() {
  const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  // Skip tracing if no endpoint configured
  if (!otelEndpoint) {
    logger.info(
      "OpenTelemetry disabled: No OTEL_EXPORTER_OTLP_ENDPOINT configured",
    );
    return;
  }

  try {
    sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "matching-service",
        [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
      }),
      traceExporter: new OTLPTraceExporter({
        url: `${otelEndpoint}/v1/traces`,
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": {
            enabled: false,
          },
        }),
      ],
    });

    sdk.start();
    logger.info({ otelEndpoint }, "OpenTelemetry tracing initialized");
  } catch (error) {
    logger.error({ error }, "Failed to initialize OpenTelemetry");
  }
}

/**
 * Shutdown tracing (cleanup)
 */
export async function shutdownTracing() {
  if (sdk) {
    try {
      await sdk.shutdown();
      logger.info("OpenTelemetry tracing shut down");
    } catch (error) {
      logger.error({ error }, "Error shutting down OpenTelemetry");
    }
  }
}

/**
 * Get the tracer instance
 */
export function getTracer() {
  return trace.getTracer("matching-service");
}

/**
 * Helper to create and manage a span
 */
export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(name);

  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    span.setAttribute(key, value);
  });

  try {
    const result = await fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Helper to add event to current span
 */
export function addSpanEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>,
) {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Helper to set span attribute
 */
export function setSpanAttribute(
  key: string,
  value: string | number | boolean,
) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute(key, value);
  }
}
