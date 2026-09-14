import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActionItemStatus } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mengambil semua Action Item yang melewati batas waktu (overdue) untuk user saat ini
   * GET /api/users/me/notifications/overdue-actions
   */
  async getOverdueActionItems(userId: string, workspaceId?: string) {
    const now = new Date();

    // 1. Ambil data user saat ini untuk email matching
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    const userEmail = currentUser?.email || '';

    // 2. Query Action Item dari database
    // Kriteria:
    // - status: PENDING atau IN_PROGRESS
    // - dueDate < sekarang (sudah lewat tenggat waktu)
    // - Milik user (assigneeId == userId atau assignee.email == userEmail)
    //   ATAU jika belum ada assignee, user adalah owner/anggota workspace tempat board berada
    const whereClause: any = {
      status: {
        in: [ActionItemStatus.PENDING, ActionItemStatus.IN_PROGRESS],
      },
      dueDate: {
        lt: now,
      },
      AND: [
        ...(workspaceId ? [{ board: { workspaceId } }] : []),
        {
          OR: [
            { assigneeId: userId },
            ...(userEmail ? [{ assignee: { email: userEmail } }] : []),
            {
              board: {
                workspace: {
                  OR: [
                    { ownerId: userId },
                    { members: { some: { userId } } },
                  ],
                },
              },
            },
          ],
        },
      ],
    };

    const items: any[] = await (this.prisma as any).actionItem.findMany({
      where: whereClause,
      include: {
        card: {
          include: {
            author: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
            comments: {
              select: { id: true },
            },
          },
        },
        board: {
          select: {
            id: true,
            name: true,
            workspaceId: true,
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
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
        dueDate: 'asc', // Yang paling lama terlambat muncul paling atas
      },
    });

    // 3. Format data action item beserta perhitungan hari keterlambatan
    const overdueActions = items.map((item: any) => {
      const itemDueDate = item.dueDate ? new Date(item.dueDate) : now;
      const diffMs = now.getTime() - itemDueDate.getTime();
      const overdueDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      const dueDateDisplay = itemDueDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      return {
        id: item.id,
        cardId: item.cardId,
        boardId: item.boardId,
        boardTitle: item.board?.name || item.board?.title || 'Sprint Retrospective',
        workspaceId: item.board?.workspaceId || item.board?.workspace?.id || '',
        workspaceName: item.board?.workspace?.name || 'Workspace',
        title: item.title || item.card?.content || 'Action Item',
        description: item.card?.content || item.title || '',
        dueDate: item.dueDate,
        dueDateDisplay,
        overdueDays,
        overdueBadge: `Terlambat ${overdueDays} hari`,
        status: item.status,
        assignee: item.assignee
          ? {
              id: item.assignee.id,
              name: item.assignee.name || 'Member',
              email: item.assignee.email,
              avatarUrl: item.assignee.avatarUrl,
              role: 'Member',
            }
          : {
              id: currentUser?.id || userId,
              name: currentUser?.name || 'Anda',
              email: currentUser?.email || '',
              avatarUrl: null,
              role: 'Member',
            },
        commentsCount: item.card?.comments?.length || 0,
        createdAt: item.createdAt,
      };
    });

    return {
      count: overdueActions.length,
      overdueActions,
    };
  }
}
