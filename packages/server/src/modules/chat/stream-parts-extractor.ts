import type { UIMessage, UIMessageChunk } from 'ai';

/**
 * Extract text content from the last UIMessage in a list.
 */
export function extractUserMessageContent(messages: UIMessage[]): string {
  const lastMsg = messages[messages.length - 1];
  return lastMsg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('');
}

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

  const flushReasoning = () => {
    if (currentReasoning) {
      parts.push({ type: 'reasoning', text: currentReasoning });
      currentReasoning = '';
    }
  };

  const flushText = () => {
    if (currentText) {
      parts.push({ type: 'text', text: currentText });
      currentText = '';
    }
  };

  const partialToolCalls = new Map<
    string,
    { toolName: string; inputText: string }
  >();

  for (const chunk of buffer) {
    switch (chunk.type) {
      case 'reasoning-delta':
        currentReasoning += chunk.delta;
        break;
      case 'reasoning-end':
        flushReasoning();
        break;
      case 'text-delta':
        currentText += chunk.delta;
        break;
      case 'text-end':
        flushText();
        break;
      case 'tool-input-start':
        flushReasoning();
        flushText();
        partialToolCalls.set(chunk.toolCallId, {
          toolName: chunk.toolName,
          inputText: '',
        });
        break;
      case 'tool-input-delta':
        {
          const partial = partialToolCalls.get(chunk.toolCallId);
          if (partial) {
            partial.inputText += chunk.inputTextDelta;
          }
        }
        break;
      case 'tool-input-available':
        // Full input received — remove from partial tracking
        partialToolCalls.delete(chunk.toolCallId);
        flushReasoning();
        flushText();
        parts.push({
          type: 'tool-call',
          toolCallId: chunk.toolCallId,
          toolName: chunk.toolName,
          args: chunk.input,
        });
        break;
      case 'tool-output-available':
        flushReasoning();
        flushText();
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
  flushReasoning();
  flushText();

  // Flush partial tool calls that never received tool-input-available
  for (const [toolCallId, partial] of partialToolCalls) {
    let args: unknown = partial.inputText;
    try {
      args = JSON.parse(partial.inputText);
    } catch {
      // Keep as string if JSON is incomplete
    }
    parts.push({
      type: 'tool-call',
      toolCallId,
      toolName: partial.toolName,
      args,
    });
  }

  return parts;
}
