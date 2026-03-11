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

import { Public } from '../auth/decorators/public.decorator';
import { WorkspaceService } from '../workspace/workspace.service';
import { PublicChatService } from './public-chat.service';

@Public()
@Controller('shared/:token/conversations/:conversationId/files')
export class SharedWorkspaceController {
  constructor(
    private readonly publicChatService: PublicChatService,
    private readonly workspaceService: WorkspaceService
  ) {}

  @Get()
  async listFiles(
    @Param('token') token: string,
    @Param('conversationId') conversationId: string
  ) {
    await this.publicChatService.verifyAccess(token, conversationId);
    return this.workspaceService.listFiles(conversationId);
  }

  @Get('download')
  async downloadWorkspace(
    @Param('token') token: string,
    @Param('conversationId') conversationId: string,
    @Res() res: Response
  ) {
    await this.publicChatService.verifyAccess(token, conversationId);
    return this.workspaceService.downloadAsZip(conversationId, res);
  }

  @Post()
  async createFile(
    @Param('token') token: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { path: string; content: string }
  ) {
    await this.publicChatService.verifyAccess(token, conversationId);
    return this.workspaceService.createFile(
      conversationId,
      body.path,
      body.content
    );
  }

  @Post('directories')
  async createDirectory(
    @Param('token') token: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { path: string }
  ) {
    await this.publicChatService.verifyAccess(token, conversationId);
    return this.workspaceService.createDirectory(conversationId, body.path);
  }

  @Delete('directories')
  async deleteDirectory(
    @Param('token') token: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { path: string }
  ) {
    await this.publicChatService.verifyAccess(token, conversationId);
    const deleted = await this.workspaceService.deleteDirectory(
      conversationId,
      body.path
    );
    return { success: true, deletedFiles: deleted };
  }

  @Patch('directories/rename')
  async renameDirectory(
    @Param('token') token: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { oldPath: string; newPath: string }
  ) {
    await this.publicChatService.verifyAccess(token, conversationId);
    await this.workspaceService.renameDirectory(
      conversationId,
      body.oldPath,
      body.newPath
    );
    return { success: true };
  }

  @Get(':fileId/content')
  async getFileContent(
    @Param('token') token: string,
    @Param('conversationId') conversationId: string,
    @Param('fileId') fileId: string
  ) {
    await this.publicChatService.verifyAccess(token, conversationId);
    return this.workspaceService.getFileContentById(conversationId, fileId);
  }

  @Put(':fileId/content')
  async updateFileContent(
    @Param('token') token: string,
    @Param('conversationId') conversationId: string,
    @Param('fileId') fileId: string,
    @Body() body: { content: string }
  ) {
    await this.publicChatService.verifyAccess(token, conversationId);
    return this.workspaceService.updateFileById(
      conversationId,
      fileId,
      body.content
    );
  }

  @Delete(':fileId')
  async deleteFile(
    @Param('token') token: string,
    @Param('conversationId') conversationId: string,
    @Param('fileId') fileId: string
  ) {
    await this.publicChatService.verifyAccess(token, conversationId);
    const file = await this.workspaceService.getFileById(
      conversationId,
      fileId
    );
    await this.workspaceService.deleteFile(conversationId, file.path);
    return { success: true };
  }

  @Patch(':fileId/rename')
  async renameFile(
    @Param('token') token: string,
    @Param('conversationId') conversationId: string,
    @Param('fileId') fileId: string,
    @Body() body: { newPath: string }
  ) {
    await this.publicChatService.verifyAccess(token, conversationId);
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
    @Param('token') token: string,
    @Param('conversationId') conversationId: string,
    @Param('fileId') fileId: string,
    @Res({ passthrough: true }) res: Response
  ) {
    await this.publicChatService.verifyAccess(token, conversationId);
    const { content, mimeType, fileName } =
      await this.workspaceService.readFileById(conversationId, fileId);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(content);
  }
}
