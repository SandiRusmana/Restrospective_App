import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';

@Injectable()
export class VoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pusher: PusherService,
  ) { }

  /**
   * Helper untuk validasi bahwa user memiliki akses ke board tempat card berada
   */
  private async checkCardAndAccess(userId: string, cardId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        board: {
          select: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card tidak ditemukan');
    }

    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId: card.board.workspaceId,
        userId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Anda tidak memiliki akses ke board ini');
    }

    return card;
  }

  /**
   * Menambahkan vote pada suatu card
   */
  async vote(userId: string, cardId: string) {
    const card = await this.checkCardAndAccess(userId, cardId);

    // Validasi apakah user sudah pernah vote pada card ini
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        cardId_userId: {
          cardId,
          userId,
        },
      },
    });

    if (existingVote) {
      throw new BadRequestException('User tidak bisa vote dua kali pada card yang sama');
    }

    // Buat vote baru di database
    await this.prisma.vote.create({
      data: {
        cardId,
        userId,
      },
    });

    // Hitung jumlah vote terbaru
    const voteCount = await this.prisma.vote.count({
      where: { cardId },
    });

    // Broadcast realtime via Pusher ke channel board-{boardId} dan private-board-{boardId}
    const channels = [`private-board-${card.boardId}`, `board-${card.boardId}`];
    const voteData = {
      cardId,
      boardId: card.boardId,
      userId,
      action: 'vote',
      voteCount,
      votesCount: voteCount,
      hasVoted: true,
      votedAt: new Date().toISOString(),
    };

    try {
      await this.pusher.trigger(channels, 'vote.updated', voteData);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast vote.updated:`, err.message);
    }

    return {
      message: 'Vote berhasil ditambahkan',
      cardId,
      voteCount,
      hasVoted: true,
    };
  }

  /**
   * Menghapus vote (unvote) pada suatu card
   */
  async unvote(userId: string, cardId: string) {
    const card = await this.checkCardAndAccess(userId, cardId);

    // Cek apakah vote memang ada
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        cardId_userId: {
          cardId,
          userId,
        },
      },
    });

    if (!existingVote) {
      throw new NotFoundException('Vote tidak ditemukan pada card ini');
    }

    // Hapus vote dari database
    await this.prisma.vote.delete({
      where: {
        cardId_userId: {
          cardId,
          userId,
        },
      },
    });

    // Hitung jumlah vote terbaru
    const voteCount = await this.prisma.vote.count({
      where: { cardId },
    });

    // Broadcast realtime via Pusher
    const channels = [`private-board-${card.boardId}`, `board-${card.boardId}`];
    const voteData = {
      cardId,
      boardId: card.boardId,
      userId,
      action: 'unvote',
      voteCount,
      votesCount: voteCount,
      hasVoted: false,
      votedAt: new Date().toISOString(),
    };

    try {
      await this.pusher.trigger(channels, 'vote.updated', voteData);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast vote.updated:`, err.message);
    }

    return {
      message: 'Vote berhasil dibatalkan',
      cardId,
      voteCount,
      hasVoted: false,
    };
  }
}
