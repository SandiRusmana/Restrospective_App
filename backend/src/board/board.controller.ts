<<<<<<< HEAD
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
=======
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
>>>>>>> 3e52db1 (fitur template)
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
<<<<<<< HEAD

@UseGuards(JwtAuthGuard)
@Controller()
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post('workspaces/:workspaceId/boards')
=======
import { CreateCardDto } from './dto/create-card.dto';

@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  // ─── Board Endpoints ───

  @Post()
>>>>>>> 3e52db1 (fitur template)
  async createBoard(
    @GetUser('id') userId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() createBoardDto: CreateBoardDto,
  ) {
    return this.boardService.createBoard(userId, workspaceId, createBoardDto);
  }

<<<<<<< HEAD
  @Get('workspaces/:workspaceId/boards')
  async getWorkspaceBoards(
    @GetUser('id') userId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.boardService.getWorkspaceBoards(userId, workspaceId);
  }

  @Get('boards/:id')
  async getBoardById(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.boardService.getBoardById(userId, boardId);
  }
=======
  @Get()
  async getBoardsByWorkspace(
    @GetUser('id') userId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.boardService.getBoardsByWorkspace(userId, workspaceId);
  }

  @Get(':boardId')
  async getBoardById(
    @GetUser('id') userId: string,
    @Param('boardId') boardId: string,
  ) {
    return this.boardService.getBoardById(userId, boardId);
  }

  @Delete(':boardId')
  async deleteBoard(
    @GetUser('id') userId: string,
    @Param('boardId') boardId: string,
  ) {
    return this.boardService.deleteBoard(userId, boardId);
  }

  // ─── Card Endpoints ───

  @Post(':boardId/cards')
  async createCard(
    @GetUser('id') userId: string,
    @Param('boardId') boardId: string,
    @Body() createCardDto: CreateCardDto,
  ) {
    return this.boardService.createCard(userId, boardId, createCardDto);
  }

  @Delete(':boardId/cards/:cardId')
  async deleteCard(
    @GetUser('id') userId: string,
    @Param('boardId') boardId: string,
    @Param('cardId') cardId: string,
  ) {
    return this.boardService.deleteCard(userId, boardId, cardId);
  }
>>>>>>> 3e52db1 (fitur template)
}
