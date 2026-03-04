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
