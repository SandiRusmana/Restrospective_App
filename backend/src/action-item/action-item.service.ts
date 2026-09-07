import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { ConvertToActionDto } from './dto/convert-to-action.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';

@Injectable()
export class ActionItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pusher: PusherService,
  ) {}

  /**
   * Mengonversi Card Menjadi Action Item
   */
  async convertCardToAction(
    userId: string,
    cardId: string,
    dto: ConvertToActionDto,
  ) {
    // 1. Cari Card beserta Board dan Workspace Members
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        board: {
          include: {
            workspace: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card tidak ditemukan');
    }

    const workspace = card.board.workspace;
    const isMember = workspace.members.some((m) => m.userId === userId);
    const isOwner = workspace.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenException(
        'Anda bukan anggota workspace tempat card ini berada',
      );
    }

    // 2. Jika assigneeId diberikan, pastikan assignee adalah anggota workspace
    if (dto.assigneeId) {
      const isAssigneeMember =
        workspace.ownerId === dto.assigneeId ||
        workspace.members.some((m) => m.userId === dto.assigneeId);

      if (!isAssigneeMember) {
        throw new BadRequestException(
          'Assignee yang dipilih bukan anggota workspace ini',
        );
      }
    }

    const title = dto.title?.trim() || card.content;
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    // 3. Simpan atau perbarui ActionItem di database
    const actionItem = await (this.prisma as any).actionItem.upsert({
      where: { cardId },
      create: {
        cardId,
        boardId: card.boardId,
        assigneeId: dto.assigneeId || null,
        dueDate,
        title,
        status: dto.status || 'PENDING',
      },
      update: {
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
        ...(dto.dueDate !== undefined ? { dueDate } : {}),
        ...(dto.title !== undefined ? { title } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 4. Broadcast Realtime via Pusher
    const channels = [
      `board-${card.boardId}`,
      `private-board-${card.boardId}`,
      `presence-board-${card.boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'action-item.created', {
        cardId,
        boardId: card.boardId,
        columnId: card.columnId,
        actionItem,
      });

      // Broadcast juga update status card agar frontend yang mendengar card.updated langsung terupdate
      await this.pusher.trigger(channels, 'card.updated', {
        id: card.id,
        boardId: card.boardId,
        columnId: card.columnId,
        actionItem,
      });
    } catch (err) {
      console.warn(
        `[Pusher Warn] Gagal mengirim broadcast action-item.created:`,
        err.message,
      );
    }

    return {
      message: 'Card berhasil dikonversi menjadi action item',
      actionItem,
    };
  }

  /**
   * Mengubah Status, Assignee, atau Due Date Action Item
   */
  async updateActionItem(
    userId: string,
    actionItemId: string,
    dto: UpdateActionItemDto,
  ) {
    // 1. Cari Action Item beserta relasi Card & Workspace
    const actionItem = await (this.prisma as any).actionItem.findUnique({
      where: { id: actionItemId },
      include: {
        card: true,
        board: {
          include: {
            workspace: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!actionItem) {
      throw new NotFoundException('Action item tidak ditemukan');
    }

    const workspace = actionItem.board.workspace;
    const isMember = workspace.members.some((m) => m.userId === userId);
    const isOwner = workspace.ownerId === userId;

    if (!isMember && !isOwner) {
      throw new ForbiddenException(
        'Anda bukan anggota workspace tempat action item ini berada',
      );
    }

    // 2. Jika assigneeId diganti, validasi keanggotaannya
    if (dto.assigneeId) {
      const isAssigneeMember =
        workspace.ownerId === dto.assigneeId ||
        workspace.members.some((m) => m.userId === dto.assigneeId);

      if (!isAssigneeMember) {
        throw new BadRequestException(
          'Assignee yang dipilih bukan anggota workspace ini',
        );
      }
    }

    const updateData: any = {};
    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }
    if (dto.assigneeId !== undefined) {
      updateData.assigneeId = dto.assigneeId;
    }
    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.title !== undefined) {
      updateData.title = dto.title.trim();
    }

    // 3. Update data ActionItem
    const updatedActionItem = await (this.prisma as any).actionItem.update({
      where: { id: actionItemId },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 4. Broadcast Realtime via Pusher
    const channels = [
      `board-${actionItem.boardId}`,
      `private-board-${actionItem.boardId}`,
      `presence-board-${actionItem.boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'action-item.updated', {
        actionItemId,
        cardId: actionItem.cardId,
        boardId: actionItem.boardId,
        actionItem: updatedActionItem,
      });

      await this.pusher.trigger(channels, 'card.updated', {
        id: actionItem.cardId,
        boardId: actionItem.boardId,
        actionItem: updatedActionItem,
      });
    } catch (err) {
      console.warn(
        `[Pusher Warn] Gagal mengirim broadcast action-item.updated:`,
        err.message,
      );
    }

    return {
      message: 'Action item berhasil diperbarui',
      actionItem: updatedActionItem,
    };
  }

  /**
   * Mengambil Seluruh Action Item pada Suatu Board
   */
  async getActionItemsByBoard(userId: string, boardId: string) {
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
    const isOwner = board.workspace.ownerId === userId;
    if (!isMember && !isOwner) {
      throw new ForbiddenException(
        'Anda bukan anggota workspace tempat board ini berada',
      );
    }

    return (this.prisma as any).actionItem.findMany({
      where: { boardId },
      include: {
        card: {
          select: {
            id: true,
            columnId: true,
            content: true,
            createdAt: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
