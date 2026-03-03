export interface CreateConversationDto {
  agentId: string;
  title?: string;
}

export interface SendMessageDto {
  content: string;
}

export interface ConversationResponse {
  id: string;
  agentId: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; args: Record<string, unknown> }
  | { type: 'tool-result'; toolCallId: string; toolName: string; result: unknown; isError?: boolean }
  | { type: 'file'; mediaType: string; url: string };

export interface MessageResponse {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  metadata: Record<string, unknown> | null;
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
  createdAt: string;
}
