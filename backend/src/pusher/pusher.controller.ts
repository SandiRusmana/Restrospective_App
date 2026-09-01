import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  ForbiddenException, 
  NotFoundException, 
  Req 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PusherService } from './pusher.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('pusher')
export class PusherController {
  constructor(
    private readonly pusherService: PusherService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Endpoint Autentikasi Private Channel Pusher
   * Route: POST /api/pusher/auth
   * Memvalidasi token JWT user dan keanggotaan workspace sebelum mengizinkan subscribe.
   */
  @UseGuards(JwtAuthGuard)
  @Post('auth')
  async authenticateChannel(@Req() req: any, @Body() body: any) {
    const user = req.user;
    const socketId = body.socket_id || body.socketId;
    const channelName = body.channel_name || body.channelName;

    if (!socketId || !channelName) {
      throw new ForbiddenException('socket_id dan channel_name wajib diisi');
    }

    // Ekstrak boardId dari nama channel (misal: "private-board-123", "board-123")
    const match = channelName.match(/(?:private-)?board-?(.+)/);
    if (match && match[1]) {
      const boardId = match[1];
      const board = await this.prisma.board.findUnique({
        where: { id: boardId },
        select: { workspaceId: true },
      });

      if (!board) {
        throw new NotFoundException('Board tidak ditemukan');
      }

      // Pastikan user adalah anggota dari workspace yang menaungi board ini
      const membership = await this.prisma.workspaceMember.findFirst({
        where: {
          workspaceId: board.workspaceId,
          userId: user.id,
        },
      });

      if (!membership) {
        throw new ForbiddenException('Anda tidak memiliki akses ke channel board ini');
      }
    }

    // Data otorisasi presensi/channel
    const presenceData = {
      user_id: user.id,
      user_info: {
        id: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
      },
    };

    return this.pusherService.authorizeChannel(socketId, channelName, presenceData);
  }
}
