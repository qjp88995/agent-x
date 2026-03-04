import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ShareTokenService } from '../agent/share-token.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class PublicChatService {
  constructor(
    private readonly shareTokenService: ShareTokenService,
    private readonly chatService: ChatService
  ) {}

  async getAgentInfo(rawToken: string) {
    const result = await this.shareTokenService.validate(rawToken);

    if (!result) {
      throw new NotFoundException('Invalid or expired share token');
    }

    const { agentVersion } = result;

    return {
      agentName: agentVersion.agent.name,
      agentDescription: agentVersion.agent.description,
      agentAvatar: agentVersion.agent.avatar,
      versionNumber: agentVersion.version,
    };
  }

  async createConversation(rawToken: string) {
    const result = await this.shareTokenService.validate(rawToken);

    if (!result) {
      throw new NotFoundException('Invalid or expired share token');
    }

    const { shareTokenId, agentVersion } = result;

    await this.shareTokenService.incrementUsage(shareTokenId);

    return this.chatService.createPublicConversation(
      agentVersion.agentId,
      agentVersion.id,
      shareTokenId
    );
  }

  async getMessages(rawToken: string, conversationId: string) {
    const { shareTokenId } = await this.validateToken(rawToken);

    await this.chatService.verifyPublicAccess(conversationId, shareTokenId);

    return this.chatService.getPublicMessages(conversationId);
  }

  async verifyAccess(rawToken: string, conversationId: string) {
    const { shareTokenId } = await this.validateToken(rawToken);

    return this.chatService.verifyPublicAccess(conversationId, shareTokenId);
  }

  private async validateToken(rawToken: string) {
    const result = await this.shareTokenService.validate(rawToken);

    if (!result) {
      throw new BadRequestException('Invalid or expired share token');
    }

    return result;
  }
}
