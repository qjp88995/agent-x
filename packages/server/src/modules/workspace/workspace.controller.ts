import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Res,
  StreamableFile,
} from '@nestjs/common';

import { Response } from 'express';

import { CurrentUserPayload } from '../../common/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatService } from '../chat/chat.service';
import { WorkspaceService } from './workspace.service';

@Controller('conversations/:conversationId/files')
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly chatService: ChatService
  ) {}

  @Get()
  async getFileTree(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    await this.chatService.verifyOwnership(conversationId, user.id);
    return this.workspaceService.listFiles(conversationId);
  }

  @Get('download')
  async downloadWorkspace(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response
  ) {
    await this.chatService.verifyOwnership(conversationId, user.id);
    return this.workspaceService.downloadAsZip(conversationId, res);
  }

  @Post()
  async createFile(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { path: string; content: string }
  ) {
    await this.chatService.verifyOwnership(conversationId, user.id);
    return this.workspaceService.createFile(
      conversationId,
      body.path,
      body.content
    );
  }

  @Post('directories')
  async createDirectory(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { path: string }
  ) {
    await this.chatService.verifyOwnership(conversationId, user.id);
    return this.workspaceService.createDirectory(conversationId, body.path);
  }

  @Delete('directories')
  async deleteDirectory(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { path: string }
  ) {
    await this.chatService.verifyOwnership(conversationId, user.id);
    const deleted = await this.workspaceService.deleteDirectory(
      conversationId,
      body.path
    );
    return { success: true, deletedFiles: deleted };
  }

  @Patch('directories/rename')
  async renameDirectory(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { oldPath: string; newPath: string }
  ) {
    await this.chatService.verifyOwnership(conversationId, user.id);
    await this.workspaceService.renameDirectory(
      conversationId,
      body.oldPath,
      body.newPath
    );
    return { success: true };
  }

  @Get(':fileId/content')
  async getFileContent(
    @Param('conversationId') conversationId: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    await this.chatService.verifyOwnership(conversationId, user.id);
    return this.workspaceService.getFileContentById(conversationId, fileId);
  }

  @Put(':fileId/content')
  async updateFileContent(
    @Param('conversationId') conversationId: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { content: string }
  ) {
    await this.chatService.verifyOwnership(conversationId, user.id);
    return this.workspaceService.updateFileById(
      conversationId,
      fileId,
      body.content
    );
  }

  @Delete(':fileId')
  async deleteFile(
    @Param('conversationId') conversationId: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    await this.chatService.verifyOwnership(conversationId, user.id);
    const file = await this.workspaceService.getFileById(
      conversationId,
      fileId
    );
    await this.workspaceService.deleteFile(conversationId, file.path);
    return { success: true };
  }

  @Patch(':fileId/rename')
  async renameFile(
    @Param('conversationId') conversationId: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { newPath: string }
  ) {
    await this.chatService.verifyOwnership(conversationId, user.id);
    const file = await this.workspaceService.getFileById(
      conversationId,
      fileId
    );
    return this.workspaceService.renameFile(
      conversationId,
      file.path,
      body.newPath
    );
  }

  @Get(':fileId/download')
  async downloadFile(
    @Param('conversationId') conversationId: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.chatService.verifyOwnership(conversationId, user.id);

    const { content, mimeType, fileName } =
      await this.workspaceService.readFileById(conversationId, fileId);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(content);
  }
}
