import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateAnonymousDto } from './dto/update-anonymous.dto';
import { GetBoardsQueryDto } from './dto/get-boards-query.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post('workspaces/:workspaceId/boards')
  async createBoard(
    @GetUser('id') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() createBoardDto: CreateBoardDto,
  ) {
    return this.boardService.createBoard(userId, workspaceId, createBoardDto);
  }

  @Get('workspaces/:workspaceId/boards')
  async getWorkspaceBoards(
    @GetUser('id') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Query() query: GetBoardsQueryDto,
  ) {
    return this.boardService.getWorkspaceBoards(userId, workspaceId, query);
  }

  @Get('boards/templates')
  async getTemplates() {
    return this.boardService.getTemplates();
  }

  @Get('boards/:id')
  async getBoardById(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
  ) {
    return this.boardService.getBoardById(userId, boardId);
  }

  @Patch('boards/:id/anonymous')
  async updateAnonymous(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
    @Body() updateAnonymousDto: UpdateAnonymousDto,
  ) {
    return this.boardService.updateAnonymous(userId, boardId, updateAnonymousDto?.isAnonymous);
  }

  @Delete('boards/:id')
  async deleteBoard(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
  ) {
    return this.boardService.deleteBoard(userId, boardId);
  }
}
