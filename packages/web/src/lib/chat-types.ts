export interface ChatConversation {
  readonly id: string;
  readonly title: string | null;
  readonly updatedAt: string;
  /** Agent name for metadata display. Omit for shared page (single agent). */
  readonly agentName?: string;
}
