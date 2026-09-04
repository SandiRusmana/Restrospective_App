import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { UpdateDurationDto } from './dto/update-duration.dto';

@Injectable()
export class TimerService {
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
  ) {}

  /**
   * Pengecekan Otorisasi Keanggotaan Workspace Berdasarkan Board ID
   */
  private async checkBoardAccess(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board tidak ditemukan');
    }

    const isMember = board.workspace.members.length > 0;
    if (!isMember) {
      throw new ForbiddenException('Anda tidak memiliki akses ke board workspace ini');
    }

    return board;
  }

  /**
   * Helper untuk mendapatkan atau membuat BoardTimer baru jika belum ada
   */
  private async getOrCreateTimer(boardId: string) {
    let timer = await this.prisma.boardTimer.findUnique({
      where: { boardId },
    });

    if (!timer) {
      timer = await this.prisma.boardTimer.create({
        data: {
          boardId,
          duration: 300,
          remaining: 300,
          isRunning: false,
          startedAt: null,
          pausedAt: null,
        },
      });
    }

    return timer;
  }

  /**
   * Broadcast perubahan timer via Pusher ke channel board
   */
  private async broadcastTimerUpdate(boardId: string, timer: any) {
    const channels = [
      `private-board-${boardId}`,
      `board-${boardId}`,
      `presence-board-${boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'timer.updated', {
        timer,
        boardId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast timer.updated:`, err.message);
    }
  }

  /**
   * Mengambil Status Timer Terkini
   */
  async getTimer(userId: string, boardId: string) {
    await this.checkBoardAccess(userId, boardId);
    let timer = await this.getOrCreateTimer(boardId);

    // Hitung sisa waktu terkini jika timer sedang berjalan
    if (timer.isRunning && timer.startedAt) {
      const now = Date.now();
      const started = new Date(timer.startedAt).getTime();
      const elapsed = Math.floor((now - started) / 1000);
      const computedRemaining = Math.max(0, timer.remaining - elapsed);

      if (computedRemaining <= 0) {
        // Waktu telah habis
        timer = await this.prisma.boardTimer.update({
          where: { id: timer.id },
          data: {
            remaining: 0,
            isRunning: false,
            startedAt: null,
            pausedAt: new Date(),
          },
        });
      } else {
        return {
          ...timer,
          remaining: computedRemaining,
        };
      }
    }

    return timer;
  }

  /**
   * Memulai / Melanjutkan Timer (Start / Resume)
   */
  async startTimer(userId: string, boardId: string) {
    await this.checkBoardAccess(userId, boardId);
    let timer = await this.getOrCreateTimer(boardId);

    if (timer.isRunning) {
      return this.getTimer(userId, boardId);
    }

    // Jika waktu sebelumnya sudah 0, mulai ulang dari duration
    let remainingToSet = timer.remaining;
    if (remainingToSet <= 0) {
      remainingToSet = timer.duration;
    }

    const updatedTimer = await this.prisma.boardTimer.update({
      where: { id: timer.id },
      data: {
        isRunning: true,
        remaining: remainingToSet,
        startedAt: new Date(),
        pausedAt: null,
      },
    });

    await this.broadcastTimerUpdate(boardId, updatedTimer);
    return updatedTimer;
  }

  /**
   * Menjeda Timer (Pause)
   */
  async pauseTimer(userId: string, boardId: string) {
    await this.checkBoardAccess(userId, boardId);
    const timer = await this.getOrCreateTimer(boardId);

    if (!timer.isRunning) {
      return timer;
    }

    let computedRemaining = timer.remaining;
    if (timer.startedAt) {
      const now = Date.now();
      const started = new Date(timer.startedAt).getTime();
      const elapsed = Math.floor((now - started) / 1000);
      computedRemaining = Math.max(0, timer.remaining - elapsed);
    }

    const updatedTimer = await this.prisma.boardTimer.update({
      where: { id: timer.id },
      data: {
        isRunning: false,
        remaining: computedRemaining,
        startedAt: null,
        pausedAt: new Date(),
      },
    });

    await this.broadcastTimerUpdate(boardId, updatedTimer);
    return updatedTimer;
  }

  /**
   * Mereset Timer ke Durasi Awal
   */
  async resetTimer(userId: string, boardId: string) {
    await this.checkBoardAccess(userId, boardId);
    const timer = await this.getOrCreateTimer(boardId);

    const updatedTimer = await this.prisma.boardTimer.update({
      where: { id: timer.id },
      data: {
        isRunning: false,
        remaining: timer.duration,
        startedAt: null,
        pausedAt: null,
      },
    });

    await this.broadcastTimerUpdate(boardId, updatedTimer);
    return updatedTimer;
  }

  /**
   * Mengubah Durasi Sesi Timer (Preset 1m, 3m, 5m, 10m, 15m, 20m, dll)
   */
  async updateDuration(userId: string, boardId: string, updateDurationDto: UpdateDurationDto) {
    await this.checkBoardAccess(userId, boardId);
    const timer = await this.getOrCreateTimer(boardId);
    const { duration } = updateDurationDto;

    const updatedTimer = await this.prisma.boardTimer.update({
      where: { id: timer.id },
      data: {
        duration,
        remaining: duration,
        isRunning: false,
        startedAt: null,
        pausedAt: null,
      },
    });

    await this.broadcastTimerUpdate(boardId, updatedTimer);
    return updatedTimer;
  }
}
