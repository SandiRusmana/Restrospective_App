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
    // - Khusus yang di-assign ke user saat ini (assigneeId == userId atau assignee.email == userEmail)
    const whereClause: any = {
      status: {
        in: [ActionItemStatus.PENDING, ActionItemStatus.IN_PROGRESS],
      },
      AND: [
        ...(workspaceId ? [{ board: { workspaceId } }] : []),
        {
          OR: [
            { assigneeId: userId },
            ...(userEmail ? [{ assignee: { email: userEmail } }] : []),
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
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // 3. Format data action item: Pisahkan antara Overdue vs Baru Ditugaskan
    const overdueActions: any[] = [];
    const assignedActions: any[] = [];

    items.forEach((item: any) => {
      const hasDueDate = Boolean(item.dueDate);
      const itemDueDate = hasDueDate ? new Date(item.dueDate) : null;
      const isOverdue = Boolean(itemDueDate && itemDueDate.getTime() < now.getTime());

      let overdueDays = 0;
      let overdueBadge = 'Ditugaskan';
      if (isOverdue && itemDueDate) {
        const diffMs = now.getTime() - itemDueDate.getTime();
        overdueDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        overdueBadge = `Terlambat ${overdueDays} hari`;
      } else if (hasDueDate && itemDueDate) {
        const diffMs = itemDueDate.getTime() - now.getTime();
        const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        overdueBadge = remainingDays <= 0 ? 'Hari ini' : `${remainingDays} hari lagi`;
      }

      const dueDateDisplay = itemDueDate
        ? itemDueDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'Belum ditentukan';

      const formatted = {
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
        isOverdue,
        overdueDays,
        overdueBadge,
        type: isOverdue ? 'OVERDUE' : 'ASSIGNED',
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

      if (isOverdue) {
        overdueActions.push(formatted);
      } else {
        assignedActions.push(formatted);
      }
    });

    const allNotifications = [...overdueActions, ...assignedActions];

    return {
      count: allNotifications.length,
      overdueCount: overdueActions.length,
      assignedCount: assignedActions.length,
      overdueActions,
      assignedActions,
      notifications: allNotifications,
    };
  }
}
