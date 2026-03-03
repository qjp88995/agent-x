import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentStatus, MessageRole } from '../../generated/prisma/client';

interface MessageRecord {
  readonly id: string;
  readonly conversationId: string;
  readonly role: string;
  readonly parts: unknown;
  readonly metadata: unknown;
  readonly tokenUsage: unknown;
  readonly createdAt: Date;
}

interface TextPart {
  readonly type: string;
  readonly text?: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(userId: string, agentId: string, title?: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (agent.status !== AgentStatus.PUBLISHED) {
      throw new BadRequestException(
        'Only published agents can be used for conversations'
      );
    }

    return this.prisma.conversation.create({
      data: {
        userId,
        agentId,
        title: title ?? 'New Chat',
      },
      include: {
        agent: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      include: {
        agent: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(conversationId: string, userId: string) {
    await this.verifyOwnership(conversationId, userId);

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async saveMessage(
    conversationId: string,
    role: MessageRole,
    parts: unknown,
    tokenUsage?: unknown
  ) {
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        role,
        parts: parts as never,
        tokenUsage: tokenUsage as never,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getMessagesForAI(
    conversationId: string
  ): Promise<Array<{ role: string; content: string }>> {
    const messages: MessageRecord[] = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((msg: MessageRecord) => {
      const parts = msg.parts as TextPart[];
      const textContent = parts
        .filter(p => p.type === 'text')
        .map(p => p.text ?? '')
        .join('');

      return {
        role: msg.role === MessageRole.USER ? 'user' : 'assistant',
        content: textContent,
      };
    });
  }

  async verifyOwnership(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        agent: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async deleteConversation(id: string, userId: string) {
    await this.verifyOwnership(id, userId);

    await this.prisma.conversation.delete({ where: { id } });

    return { message: 'Conversation deleted successfully' };
  }
}
