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
}
