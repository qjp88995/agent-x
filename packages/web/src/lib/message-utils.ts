import type { MessageResponse } from '@agent-x/shared';
import type { UIMessage } from 'ai';

export function toUIMessages(messages: MessageResponse[]): UIMessage[] {
  return messages.map(msg => {
    const rawParts = msg.parts;

    // Index tool-result by toolCallId for pairing
    const resultMap = new Map<
      string,
      Extract<(typeof rawParts)[number], { type: 'tool-result' }>
    >();
    for (const p of rawParts) {
      if (p.type === 'tool-result') {
        resultMap.set(p.toolCallId, p);
      }
    }

    const parts: UIMessage['parts'] = [];
    for (const p of rawParts) {
      if (p.type === 'reasoning') {
        parts.push({
          type: 'reasoning' as const,
          text: p.text ?? '',
          state: 'done' as const,
        });
      } else if (p.type === 'tool-call') {
        const result = resultMap.get(p.toolCallId);
        parts.push({
          type: `tool-${p.toolName}`,
          toolCallId: p.toolCallId,
          toolName: p.toolName,
          state: result ? 'output-available' : 'input-available',
          input: p.args,
          ...(result ? { output: result.result } : {}),
        } as unknown as UIMessage['parts'][number]);
      } else if (p.type === 'tool-result') {
        // Skip - already merged into tool-call above
      } else if (p.type === 'text') {
        parts.push({
          type: 'text' as const,
          text: p.text ?? '',
        });
      }
    }

    return {
      id: msg.id,
      role:
        msg.role.toLowerCase() === 'user'
          ? ('user' as const)
          : ('assistant' as const),
      parts,
      createdAt: new Date(msg.createdAt),
    };
  });
}
