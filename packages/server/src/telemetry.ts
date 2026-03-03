import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';

if (process.env.AI_SDK_TELEMETRY === 'true') {
  const exporter = new OTLPTraceExporter({
    url: process.env.OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
  });

  const sdk = new NodeSDK({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });

  sdk.start();
}
