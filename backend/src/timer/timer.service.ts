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
  private async broadcastTimerUpdate(boardId: string, timer: any, user?: any) {
    const channels = [
      `private-board-${boardId}`,
      `board-${boardId}`,
      `presence-board-${boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'timer.updated', {
        timer,
        boardId,
        startedById: timer?.startedById || user?.id || null,
        user: user || null,
        facilitator: user?.name || user?.email?.split('@')[0] || 'Facilitator',
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
    const board = await this.checkBoardAccess(userId, boardId);
    let timer = await this.getOrCreateTimer(boardId);

    let facilitator = 'Facilitator';
    if (timer.startedById) {
      const starter = await this.prisma.user.findUnique({
        where: { id: timer.startedById },
        select: { id: true, name: true, email: true },
      });
      if (starter) {
        facilitator = starter.name || starter.email?.split('@')[0] || 'Facilitator';
      }
    } else {
      const owner = await this.prisma.user.findUnique({
        where: { id: board.workspace.ownerId },
        select: { id: true, name: true, email: true },
      });
      facilitator = owner?.name || owner?.email?.split('@')[0] || 'Facilitator';
    }

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
          startedById: timer.startedById || null,
          facilitator,
        };
      }
    }

    return {
      ...timer,
      startedById: timer.startedById || null,
      facilitator,
    };
  }

  /**
   * Memulai / Melanjutkan Timer (Start / Resume)
   */
  async startTimer(userId: string, boardId: string, duration?: number) {
    await this.checkBoardAccess(userId, boardId);
    let timer = await this.getOrCreateTimer(boardId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    const durationToSet = duration && duration > 0 ? duration : timer.duration;

    // Jika durasi baru ditentukan atau waktu sebelumnya sudah 0, gunakan durationToSet
    let remainingToSet = duration && duration > 0 ? duration : timer.remaining;
    if (remainingToSet <= 0) {
      remainingToSet = durationToSet;
    }

    const updatedTimer = await (this.prisma as any).boardTimer.update({
      where: { id: timer.id },
      data: {
        duration: durationToSet,
        isRunning: true,
        remaining: remainingToSet,
        startedAt: new Date(),
        pausedAt: null,
        startedById: userId,
      },
    });

    await this.broadcastTimerUpdate(boardId, updatedTimer, user);
    return {
      ...updatedTimer,
      startedById: userId,
      facilitator: user?.name || user?.email?.split('@')[0] || 'Facilitator',
    };
  }

  /**
   * Menjeda Timer (Pause)
   */
  async pauseTimer(userId: string, boardId: string) {
    const board = await this.checkBoardAccess(userId, boardId);
    const timer = await this.getOrCreateTimer(boardId);

    // Hanya yang memulai timer atau owner workspace yang berhak menjeda (pause)
    const isStarter = timer.startedById ? timer.startedById === userId : true;
    const isOwner = board.workspace.ownerId === userId;
    if (!isStarter && !isOwner) {
      throw new ForbiddenException(
        'Hanya pengguna yang memulai timer yang dapat menjeda sesi ini',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!timer.isRunning) {
      return {
        ...timer,
        startedById: timer.startedById || null,
        facilitator: user?.name || user?.email?.split('@')[0] || 'Facilitator',
      };
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

    await this.broadcastTimerUpdate(boardId, updatedTimer, user);
    return {
      ...updatedTimer,
      startedById: timer.startedById || userId,
      facilitator: user?.name || user?.email?.split('@')[0] || 'Facilitator',
    };
  }

  /**
   * Mereset Timer ke Durasi Awal
   */
  async resetTimer(userId: string, boardId: string) {
    const board = await this.checkBoardAccess(userId, boardId);
    const timer = await this.getOrCreateTimer(boardId);

    // Hanya yang memulai timer atau owner workspace yang berhak mereset timer
    const isStarter = timer.startedById ? timer.startedById === userId : true;
    const isOwner = board.workspace.ownerId === userId;
    if (!isStarter && !isOwner) {
      throw new ForbiddenException(
        'Hanya pengguna yang memulai timer yang dapat mereset sesi ini',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    const updatedTimer = await this.prisma.boardTimer.update({
      where: { id: timer.id },
      data: {
        isRunning: false,
        remaining: timer.duration,
        startedAt: null,
        pausedAt: null,
      },
    });

    await this.broadcastTimerUpdate(boardId, updatedTimer, user);
    return {
      ...updatedTimer,
      startedById: timer.startedById || userId,
      facilitator: user?.name || user?.email?.split('@')[0] || 'Facilitator',
    };
  }

  /**
   * Mengubah Durasi Sesi Timer (Preset 1m, 3m, 5m, 10m, 15m, 20m, dll)
   */
  async updateDuration(userId: string, boardId: string, updateDurationDto: UpdateDurationDto) {
    await this.checkBoardAccess(userId, boardId);
    const timer = await this.getOrCreateTimer(boardId);
    const { duration } = updateDurationDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

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

    await this.broadcastTimerUpdate(boardId, updatedTimer, user);
    return {
      ...updatedTimer,
      facilitator: user?.name || user?.email?.split('@')[0] || 'Facilitator',
    };
  }
}
