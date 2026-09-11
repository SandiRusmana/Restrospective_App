import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Mengambil Ringkasan Dashboard Action Items Suatu Workspace
   * GET /api/workspaces/:id/dashboard-summary
   */
  @Get('workspaces/:id/dashboard-summary')
  async getDashboardSummary(
    @GetUser('id') userId: string,
    @Param('id') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.dashboardService.getDashboardSummary(
      userId,
      workspaceId,
      startDate || from,
      endDate || to,
    );
  }

  /**
   * Mengambil Ringkasan Dashboard Khusus Satu Board (1 Board 1 Ringkasan)
   * GET /api/boards/:id/dashboard-summary
   */
  @Get('boards/:id/dashboard-summary')
  async getBoardDashboardSummary(
    @GetUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) boardId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.dashboardService.getBoardDashboardSummary(
      userId,
      boardId,
      startDate || from,
      endDate || to,
    );
  }
}
