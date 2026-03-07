import type { UIMessageChunk } from 'ai';

interface StepData {
  readonly reasoning?: string | ReadonlyArray<{ text: string }>;
  readonly text?: string;
  readonly toolCalls?: ReadonlyArray<{
    toolCallId: string;
    toolName: string;
    input: unknown;
  }>;
  readonly toolResults?: ReadonlyArray<{
    toolCallId: string;
    toolName: string;
    output: unknown;
  }>;
}

export function extractPartsFromSteps(
  steps: ReadonlyArray<StepData>
): Array<Record<string, unknown>> {
  const parts: Array<Record<string, unknown>> = [];

  for (const step of steps) {
    if (step.reasoning) {
      const reasoningText = Array.isArray(step.reasoning)
        ? step.reasoning.map((r: { text: string }) => r.text).join('')
        : String(step.reasoning);
      if (reasoningText) {
        parts.push({ type: 'reasoning', text: reasoningText });
      }
    }

    if (step.text && step.toolCalls?.length) {
      parts.push({ type: 'text', text: step.text });
    }

    for (const tc of step.toolCalls ?? []) {
      parts.push({
        type: 'tool-call',
        toolCallId: tc.toolCallId,
        toolName: tc.toolName,
        args: tc.input,
      });
    }

    for (const tr of step.toolResults ?? []) {
      parts.push({
        type: 'tool-result',
        toolCallId: tr.toolCallId,
        toolName: tr.toolName,
        result: tr.output,
        isError: false,
      });
    }

    if (step.text && !step.toolCalls?.length) {
      parts.push({ type: 'text', text: step.text });
    }
  }

  return parts;
}

export function extractPartsFromBuffer(
  buffer: ReadonlyArray<UIMessageChunk>
): Array<Record<string, unknown>> {
  const parts: Array<Record<string, unknown>> = [];
  let currentText = '';
  let currentReasoning = '';

  for (const chunk of buffer) {
    switch (chunk.type) {
      case 'reasoning-delta':
        currentReasoning += chunk.delta;
        break;
      case 'reasoning-end':
        if (currentReasoning) {
          parts.push({ type: 'reasoning', text: currentReasoning });
          currentReasoning = '';
        }
        break;
      case 'text-delta':
        currentText += chunk.delta;
        break;
      case 'text-end':
        if (currentText) {
          parts.push({ type: 'text', text: currentText });
          currentText = '';
        }
        break;
      case 'tool-input-available':
        parts.push({
          type: 'tool-call',
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          args: chunk.input,
        });
        break;
      case 'tool-output-available':
        parts.push({
          type: 'tool-result',
          toolCallId: chunk.toolCallId,
          result: chunk.output,
          isError: false,
        });
        break;
      default:
        break;
    }
  }

  // Flush any remaining accumulated content (stream interrupted mid-part)
  if (currentReasoning) {
    parts.push({ type: 'reasoning', text: currentReasoning });
  }
  if (currentText) {
    parts.push({ type: 'text', text: currentText });
  }

  return parts;
}
