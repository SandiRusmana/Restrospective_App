import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Mengambil Ringkasan Dashboard Action Items Suatu Workspace
   * GET /api/workspaces/:id/dashboard-summary
   */
  @Get(':id/dashboard-summary')
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
}
