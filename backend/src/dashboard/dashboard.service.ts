import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mengambil Ringkasan Dashboard Action Item Suatu Workspace
   * dengan Prisma aggregate, groupBy, dan filter tanggal createdAt
   */
  async getDashboardSummary(
    userId: string,
    workspaceId: string,
    startDate?: string,
    endDate?: string,
  ) {
    // 1. Validasi keberadaan Workspace dan keanggotaan user
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace tidak ditemukan');
    }

    const isMember = workspace.members.length > 0;
    const isOwner = workspace.ownerId === userId;
    if (!isMember && !isOwner) {
      throw new ForbiddenException('Anda bukan anggota dari workspace ini');
    }

    // 2. Susun filter kondisi (termasuk filter tanggal createdAt)
    const whereCondition: any = {
      board: {
        workspaceId,
      },
    };

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start || end) {
      whereCondition.createdAt = {};
      if (start && !isNaN(start.getTime())) {
        whereCondition.createdAt.gte = start;
      }
      if (end && !isNaN(end.getTime())) {
        // Jika format hanya tanggal YYYY-MM-DD, set ke akhir hari
        if (endDate && (!endDate.includes('T') || endDate.length <= 10)) {
          end.setHours(23, 59, 59, 999);
        }
        whereCondition.createdAt.lte = end;
      }
    }

    // 3. Prisma Aggregate untuk menghitung Total Action Items
    const totalAggregate = await this.prisma.actionItem.aggregate({
      where: whereCondition,
      _count: {
        id: true,
      },
    });
    const totalActionItems = totalAggregate._count.id || 0;

    // 4. Prisma GroupBy berdasarkan status Action Item (PENDING, IN_PROGRESS, DONE)
    const statusGroups = await this.prisma.actionItem.groupBy({
      by: ['status'],
      where: whereCondition,
      _count: {
        id: true,
      },
    });

    // Petakan hasil groupBy
    let doneCount = 0;
    let pendingCount = 0;
    let inProgressCount = 0;

    statusGroups.forEach((group) => {
      const count = group._count.id || 0;
      if (group.status === 'DONE') {
        doneCount = count;
      } else if (group.status === 'PENDING') {
        pendingCount = count;
      } else if (group.status === 'IN_PROGRESS') {
        inProgressCount = count;
      }
    });

    // Total yang belum selesai (pending + in progress)
    const totalPending = pendingCount + inProgressCount;

    // Hitung persentase penyelesaian (Completion Rate %)
    const completionRate =
      totalActionItems > 0
        ? Math.round((doneCount / totalActionItems) * 10000) / 100
        : 0;

    // 5. Data timeline untuk grafik perkembangan (trend per hari)
    const allItems = await this.prisma.actionItem.findMany({
      where: whereCondition,
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const timelineMap: Record<
      string,
      { date: string; total: number; done: number; pending: number; inProgress: number }
    > = {};

    allItems.forEach((item) => {
      const dateKey = item.createdAt.toISOString().split('T')[0];
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = {
          date: dateKey,
          total: 0,
          done: 0,
          pending: 0,
          inProgress: 0,
        };
      }
      timelineMap[dateKey].total += 1;
      if (item.status === 'DONE') {
        timelineMap[dateKey].done += 1;
      } else if (item.status === 'IN_PROGRESS') {
        timelineMap[dateKey].inProgress += 1;
      } else {
        timelineMap[dateKey].pending += 1;
      }
    });

    const timeline = Object.values(timelineMap);

    return {
      workspaceId,
      workspaceName: workspace.name,
      total: totalActionItems,
      totalActionItems,
      completed: doneCount,
      done: doneCount,
      pending: pendingCount,
      inProgress: inProgressCount,
      totalPending,
      completionRate,
      statusCounts: {
        PENDING: pendingCount,
        IN_PROGRESS: inProgressCount,
        DONE: doneCount,
      },
      statusBreakdown: [
        { status: 'PENDING', label: 'Pending', count: pendingCount },
        { status: 'IN_PROGRESS', label: 'In Progress', count: inProgressCount },
        { status: 'DONE', label: 'Selesai', count: doneCount },
      ],
      chartData: [
        { name: 'Selesai', value: doneCount, status: 'DONE', color: '#16a34a' },
        { name: 'In Progress', value: inProgressCount, status: 'IN_PROGRESS', color: '#2563eb' },
        { name: 'Pending', value: pendingCount, status: 'PENDING', color: '#f59e0b' },
      ],
      timeline,
      filter: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }

  /**
   * Mengambil Ringkasan Dashboard Khusus Satu Board (1 Board 1 Ringkasan)
   */
  async getBoardDashboardSummary(
    userId: string,
    boardId: string,
    startDate?: string,
    endDate?: string,
  ) {
    // 1. Validasi keberadaan Board dan keanggotaan Workspace
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
      throw new ForbiddenException('Anda bukan anggota dari workspace ini');
    }

    // 2. Susun filter kondisi khusus board ini
    const whereCondition: any = {
      boardId,
    };

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start || end) {
      whereCondition.createdAt = {};
      if (start && !isNaN(start.getTime())) {
        whereCondition.createdAt.gte = start;
      }
      if (end && !isNaN(end.getTime())) {
        if (endDate && (!endDate.includes('T') || endDate.length <= 10)) {
          end.setHours(23, 59, 59, 999);
        }
        whereCondition.createdAt.lte = end;
      }
    }

    // 3. Prisma Aggregate untuk menghitung Total Action Items board ini
    const totalAggregate = await this.prisma.actionItem.aggregate({
      where: whereCondition,
      _count: {
        id: true,
      },
    });
    const totalActionItems = totalAggregate._count.id || 0;

    // 4. Prisma GroupBy berdasarkan status Action Item (DONE, PENDING, IN_PROGRESS)
    const statusGroups = await this.prisma.actionItem.groupBy({
      by: ['status'],
      where: whereCondition,
      _count: {
        id: true,
      },
    });

    let doneCount = 0;
    let pendingCount = 0;
    let inProgressCount = 0;

    statusGroups.forEach((group) => {
      const count = group._count.id || 0;
      if (group.status === 'DONE') {
        doneCount = count;
      } else if (group.status === 'PENDING') {
        pendingCount = count;
      } else if (group.status === 'IN_PROGRESS') {
        inProgressCount = count;
      }
    });

    const totalPending = pendingCount + inProgressCount;
    const completionRate =
      totalActionItems > 0
        ? Math.round((doneCount / totalActionItems) * 10000) / 100
        : 0;
    const pendingRate =
      totalActionItems > 0 ? Math.round((totalPending / totalActionItems) * 10000) / 100 : 0;

    // 5. Action Items list di board ini dengan detail Assignee
    const rawActionItems = await this.prisma.actionItem.findMany({
      where: whereCondition,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 6. Metrik kartu dan voting khusus board ini
    const totalCards = await this.prisma.card.count({
      where: {
        boardId,
      },
    });

    const totalVotes = await this.prisma.vote.count({
      where: {
        card: {
          boardId,
        },
      },
    });

    // 7. Top 3 Ide / Catatan dengan vote terbanyak di board ini
    const topCards = await this.prisma.card.findMany({
      where: {
        boardId,
      },
      include: {
        votes: true,
        column: {
          select: {
            id: true,
            name: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        votes: {
          _count: 'desc',
        },
      },
      take: 3,
    });

    return {
      boardId,
      boardTitle: board.name,
      workspaceId: board.workspaceId,
      workspaceName: board.workspace.name,
      total: totalActionItems,
      totalActionItems,
      completed: doneCount,
      done: doneCount,
      pending: pendingCount,
      inProgress: inProgressCount,
      totalPending,
      completionRate,
      pendingRate,
      totalCards,
      totalVotes,
      topCards: topCards.map((c) => ({
        id: c.id,
        content: c.content,
        columnName: c.column?.name,
        votesCount: c.votes?.length || 0,
        authorName: c.isAnonymous ? 'Anonim' : c.author?.name || 'Anggota Tim',
        authorAvatar: c.isAnonymous ? null : c.author?.avatarUrl,
      })),
      actionItems: rawActionItems.map((ai) => ({
        id: ai.id,
        title: ai.title || 'Action Item',
        status: ai.status,
        boardId: ai.boardId,
        boardName: board.name,
        assignee: ai.assignee || {
          name: 'Belum ditugaskan',
          avatarUrl: null,
        },
        createdAt: ai.createdAt,
      })),
      filter: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    };
  }
}
