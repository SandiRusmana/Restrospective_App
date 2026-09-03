import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pusher: PusherService,
  ) {}

  /**
   * Helper: Validasi Akses Pengguna ke Board via Workspace
   */
  private async checkBoardAccess(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board tidak ditemukan');
    }

    const isMember = board.workspace.members.some((m) => m.userId === userId);
    const isOwner = board.workspace.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses ke board ini untuk menambahkan komentar',
      );
    }

    return board;
  }

  /**
   * Menambahkan Komentar pada Card
   */
  async createComment(
    userId: string,
    cardId: string,
    createCommentDto: CreateCommentDto,
  ) {
    // 1. Cari Card
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card tidak ditemukan');
    }

    // 2. Validasi Akses User ke Board
    await this.checkBoardAccess(userId, card.boardId);

    // 3. Simpan Komentar ke Database
    const comment = await this.prisma.comment.create({
      data: {
        cardId,
        userId,
        content: createCommentDto.content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedComment = {
      id: comment.id,
      cardId: comment.cardId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user,
    };

    // 4. Broadcast Realtime via Pusher ke channel board
    const channels = [
      `private-board-${card.boardId}`,
      `board-${card.boardId}`,
      `presence-board-${card.boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'comment.created', {
        cardId: card.id,
        boardId: card.boardId,
        comment: formattedComment,
      });
    } catch (err) {
      console.warn(
        `[Pusher Warn] Gagal mengirim broadcast comment.created:`,
        err.message,
      );
    }

    return {
      message: 'Komentar berhasil ditambahkan',
      comment: formattedComment,
    };
  }

  /**
   * Menghapus Komentar (Hanya Pemilik Komentar)
   */
  async deleteComment(userId: string, commentId: string) {
    // 1. Cari Komentar beserta Card terkait
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        card: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Komentar tidak ditemukan');
    }

    // 2. Ownership Check: Memastikan user adalah pembuat komentar
    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'Anda hanya dapat menghapus komentar milik Anda sendiri',
      );
    }

    // 3. Hapus Komentar dari Database
    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // 4. Broadcast Realtime via Pusher ke channel board
    const channels = [
      `private-board-${comment.card.boardId}`,
      `board-${comment.card.boardId}`,
      `presence-board-${comment.card.boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'comment.deleted', {
        cardId: comment.cardId,
        boardId: comment.card.boardId,
        commentId: comment.id,
      });
    } catch (err) {
      console.warn(
        `[Pusher Warn] Gagal mengirim broadcast comment.deleted:`,
        err.message,
      );
    }

    return {
      message: 'Komentar berhasil dihapus',
    };
  }
}
