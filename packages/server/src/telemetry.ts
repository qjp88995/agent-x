import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-node';

if (process.env.AI_SDK_TELEMETRY === 'true') {
  const sdk = new NodeSDK({
    spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
  });

  sdk.start();
}
