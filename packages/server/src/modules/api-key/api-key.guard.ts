import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Request } from 'express';

import { ApiKeyService } from './api-key.service';

const API_KEY_PREFIX = 'sk-agx-';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token?.startsWith(API_KEY_PREFIX)) {
      return false;
    }

    const keyData = await this.apiKeyService.validate(token);

    if (!keyData) {
      return false;
    }

    (request as unknown as Record<string, unknown>)['user'] = {
      id: keyData.userId,
      agentId: keyData.agentId,
    };

    return true;
  }
}
