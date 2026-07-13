import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const SERVICE_NAME = 'weather-recommendation';
const DEFAULT_TRACE_EXPORTER_URL = 'http://localhost:5022/v1/traces';
const DEFAULT_METRIC_EXPORT_INTERVAL_MS = 60000;

let started = false;

const openTelemetrySdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? SERVICE_NAME,
  }),
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({ url: getTraceExporterUrl() }),
    ),
  ],
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
    exportIntervalMillis: getMetricExportIntervalMillis(),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

export function startOpenTelemetry(): void {
  if (process.env.OTEL_SDK_DISABLED === 'true') {
    return;
  }

  openTelemetrySdk.start();
  started = true;
}

export async function shutdownOpenTelemetry(): Promise<void> {
  if (!started) {
    return;
  }

  await openTelemetrySdk.shutdown();
  started = false;
}

function getTraceExporterUrl(): string {
  return (
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
    DEFAULT_TRACE_EXPORTER_URL
  );
}

function getMetricExportIntervalMillis(): number {
  const configuredInterval = Number(process.env.OTEL_METRIC_EXPORT_INTERVAL);

  return Number.isFinite(configuredInterval) && configuredInterval > 0
    ? configuredInterval
    : DEFAULT_METRIC_EXPORT_INTERVAL_MS;
}
