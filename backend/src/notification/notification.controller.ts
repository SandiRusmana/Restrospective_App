import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('users/me/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Mengambil notifikasi action item yang telah melewati due date (overdue)
   * GET /api/users/me/notifications/overdue-actions
   */
  @Get('overdue-actions')
  async getOverdueActionItems(
    @GetUser('id') userId: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.notificationService.getOverdueActionItems(userId, workspaceId);
  }

  /**
   * Endpoint opsional untuk konfirmasi tandai semua sudah dibaca
   * POST /api/users/me/notifications/mark-all-read
   */
  @Post('mark-all-read')
  async markAllAsRead(@GetUser('id') userId: string) {
    return {
      success: true,
      message: 'Semua notifikasi ditandai sebagai dibaca',
      readAt: new Date().toISOString(),
    };
  }
}
