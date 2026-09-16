import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateAnonymousDto } from './dto/update-anonymous.dto';
import { GetBoardsQueryDto } from './dto/get-boards-query.dto';
import { StartPresentationDto } from './dto/start-presentation.dto';

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

  @Patch('boards/:id')
  async updateBoard(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    return this.boardService.updateBoard(userId, boardId, updateBoardDto);
  }

  @Patch('boards/:id/anonymous')
  async updateAnonymous(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
    @Body() updateAnonymousDto: UpdateAnonymousDto,
  ) {
    return this.boardService.updateAnonymous(userId, boardId, updateAnonymousDto?.isAnonymous);
  }

  @Patch('boards/:id/status')
  async updateStatus(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
    @Body('status') status: string,
  ) {
    return this.boardService.updateBoardStatus(userId, boardId, status);
  }

  @Post('boards/:id/reveal')
  async revealBoard(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
  ) {
    return this.boardService.revealBoard(userId, boardId);
  }

  @Post('boards/:id/presentation/start')
  async startPresentation(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
    @Body() startPresentationDto?: StartPresentationDto,
  ) {
    return this.boardService.startPresentation(userId, boardId, startPresentationDto?.cardId);
  }

  @Post('boards/:id/presentation/next')
  async nextPresentation(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
  ) {
    return this.boardService.nextPresentationCard(userId, boardId);
  }

  @Post('boards/:id/presentation/prev')
  async prevPresentation(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
  ) {
    return this.boardService.prevPresentationCard(userId, boardId);
  }

  @Post('boards/:id/presentation/stop')
  async stopPresentation(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
  ) {
    return this.boardService.stopPresentation(userId, boardId);
  }

  @Delete('boards/:id')
  async deleteBoard(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
  ) {
    return this.boardService.deleteBoard(userId, boardId);
  }
}
