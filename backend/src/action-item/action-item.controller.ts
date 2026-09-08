import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionItemService } from './action-item.service';
import { ConvertToActionDto } from './dto/convert-to-action.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class ActionItemController {
  constructor(private readonly actionItemService: ActionItemService) {}

  /**
   * Konversi Card Menjadi Action Item
   * POST /api/cards/:id/convert-to-action
   */
  @Post('cards/:id/convert-to-action')
  async convertCardToAction(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
    @Body() dto: ConvertToActionDto,
  ) {
    return this.actionItemService.convertCardToAction(userId, cardId, dto);
  }

  /**
   * Update Status, Assignee, atau Due Date Action Item
   * PATCH /api/action-items/:id
   */
  @Patch('action-items/:id')
  async updateActionItem(
    @GetUser('id') userId: string,
    @Param('id') actionItemId: string,
    @Body() dto: UpdateActionItemDto,
  ) {
    return this.actionItemService.updateActionItem(userId, actionItemId, dto);
  }

  /**
   * Mengambil Semua Action Item di Board
   * GET /api/boards/:id/action-items
   */
  @Get('boards/:id/action-items')
  async getActionItemsByBoard(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.actionItemService.getActionItemsByBoard(userId, boardId);
  }

  /**
   * Mengambil Action Items Berdasarkan Workspace (dengan filter status)
   * GET /api/workspaces/:id/action-items?status=pending
   */
  @Get('workspaces/:id/action-items')
  async getActionItemsByWorkspace(
    @GetUser('id') userId: string,
    @Param('id') workspaceId: string,
    @Query('status') status?: string,
  ) {
    return this.actionItemService.getActionItemsByWorkspace(
      userId,
      workspaceId,
      status,
    );
  }
}
