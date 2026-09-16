import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { getAllTemplates, getTemplateColumns } from './constants/retro-templates';
import { CreateBoardDto } from './dto/create-board.dto';
import { GetBoardsQueryDto } from './dto/get-boards-query.dto';

@Injectable()
export class BoardService {
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
  ) {}

  /**
   * Mengambil Semua Template Retrospective yang Tersedia
   */
  getTemplates() {
    return getAllTemplates();
  }

  /**
   * Pengecekan Keanggotaan User di Workspace
   */
  private async checkWorkspaceMembership(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!membership) {
      // Periksa apakah user adalah owner dari workspace
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { ownerId: true },
      });

      if (!workspace || workspace.ownerId !== userId) {
        throw new ForbiddenException('Anda bukan anggota dari workspace ini');
      }

      return {
        id: 'owner',
        workspaceId,
        userId,
        role: 'owner',
        joinedAt: new Date(),
      };
    }

    return membership;
  }

  /**
   * Membuat Board Baru dalam Workspace Berdasarkan Template / Kolom Kustom
   */
  async createBoard(userId: string, workspaceId: string, createBoardDto: CreateBoardDto) {
    // 1. Pastikan user adalah anggota workspace
    await this.checkWorkspaceMembership(userId, workspaceId);

    const { name, template = 'start-stop-continue', customColumns, isAnonymous = false, voteLimit } = createBoardDto;

    // 2. Tentukan struktur kolom (Kustom dari user ATAU dari Template)
    let columnsToCreate: { name: string; order: number }[] = [];

    if (customColumns && Array.isArray(customColumns) && customColumns.length > 0) {
      columnsToCreate = customColumns.map((colName, idx) => ({
        name: colName.trim(),
        order: idx + 1,
      }));
    } else {
      columnsToCreate = getTemplateColumns(template).map((col) => ({
        name: col.name,
        order: col.order,
      }));
    }

    // 3. Buat Board dan Kolom-Kolom
    const board = await this.prisma.board.create({
      data: {
        name,
        workspaceId,
        template,
        isAnonymous,
        voteLimit,
        columns: {
          create: columnsToCreate,
        },
      },
      include: {
        columns: {
          orderBy: {
            order: 'asc',
          },
        },
        cards: true,
      },
    });

    // 4. Realtime Broadcast via Pusher
    try {
      await this.pusher.trigger(`workspace-${workspaceId}`, 'board:created', { board });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim event board:created:`, err.message);
    }

    return {
      message: 'Board berhasil dibuat',
      board,
    };
  }

  /**
   * Mengambil Semua Board di Workspace Tertentu (Mendukung Pagination & Hitungan Card + Action Item)
   */
  async getWorkspaceBoards(userId: string, workspaceId: string, query?: GetBoardsQueryDto) {
    // 1. Pastikan user adalah anggota workspace
    await this.checkWorkspaceMembership(userId, workspaceId);

    const hasPagination = query && (query.page !== undefined || query.limit !== undefined);
    const page = query?.page ? Math.max(1, Number(query.page)) : 1;
    const limit = query?.limit ? Math.max(1, Number(query.limit)) : 10;
    const skip = (page - 1) * limit;

    const where = { workspaceId };

    // 2. Ambil total count jika pagination diminta
    const total = await this.prisma.board.count({ where });

    // 3. Susun query findMany dengan skip, take, dan _count untuk cards & actionItems
    const findArgs: any = {
      where,
      include: {
        columns: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            cards: true,
            actionItems: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    };

    if (hasPagination) {
      findArgs.skip = skip;
      findArgs.take = limit;
    }

    const boards = await (this.prisma as any).board.findMany(findArgs);

    const mappedBoards = (boards as any[]).map((b: any) => ({
      id: b.id,
      name: b.name,
      template: b.template,
      status: b.status || 'aktif',
      isRevealed: Boolean(b.isRevealed),
      presentationMode: Boolean(b.presentationMode),
      isAnonymous: b.isAnonymous,
      voteLimit: b.voteLimit,
      workspaceId: b.workspaceId,
      columns: b.columns,
      cardsCount: b._count?.cards ?? 0,
      actionItemsCount: b._count?.actionItems ?? 0,
      createdAt: b.createdAt,
    }));

    if (hasPagination) {
      const totalPages = Math.ceil(total / limit);
      return {
        data: mappedBoards,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    return mappedBoards;
  }

  /**
   * Alias untuk getWorkspaceBoards jika dipanggil oleh controller lain
   */
  async getBoardsByWorkspace(userId: string, workspaceId: string, query?: GetBoardsQueryDto) {
    return this.getWorkspaceBoards(userId, workspaceId, query);
  }

  /**
   * Mengambil Detail Board Berdasarkan ID
   */
  async getBoardById(userId: string, boardId: string) {
    // 1. Cari Board
    const board: any = await (this.prisma.board as any).findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: {
            order: 'asc',
          },
          include: {
            cards: {
              where: {
                OR: [
                  { isRevealed: true },
                  { authorId: userId },
                ],
              },
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                actionItem: {
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
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board tidak ditemukan');
    }

    // 2. Cek apakah user adalah anggota dari workspace tempat board berada (Pihak luar ditolak 403 Forbidden)
    const membership = await this.checkWorkspaceMembership(userId, board.workspaceId);

    // Cek apakah user adalah facilitator / admin / owner
    const isFacilitator =
      board.workspace.ownerId === userId ||
      membership.role === 'owner' ||
      membership.role === 'facilitator' ||
      membership.role === 'admin';

    const totalCardsCount = await (this.prisma.card as any).count({
      where: { boardId },
    });

    const baseResult = {
      ...board,
      totalCardsCount,
      userRole: membership.role,
      isFacilitator,
    };

    // Jika mode anonymous aktif dan user bukan facilitator, sembunyikan author card
    if (board.isAnonymous && !isFacilitator) {
      const sanitizedColumns = board.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) => ({
          ...card,
          author: null,
        })),
      }));

      return {
        ...baseResult,
        columns: sanitizedColumns,
      };
    }

    return baseResult;
  }

  /**
   * Menghapus Board (Hanya Owner Workspace)
   */
  async deleteBoard(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { workspace: true },
    });

    if (!board) {
      throw new NotFoundException('Board tidak ditemukan');
    }

    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId: board.workspaceId,
        userId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus board ini');
    }

    await this.prisma.$transaction([
      this.prisma.card.deleteMany({ where: { boardId } }),
      this.prisma.boardColumn.deleteMany({ where: { boardId } }),
      this.prisma.board.delete({ where: { id: boardId } }),
    ]);

    try {
      await this.pusher.trigger(`workspace-${board.workspaceId}`, 'board:deleted', { boardId });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim event board:deleted:`, err.message);
    }

    return { message: 'Board berhasil dihapus' };
  }

  /**
   * Mengubah Status Mode Anonymous pada Board (Hanya Facilitator / Owner)
   */
  async updateAnonymous(userId: string, boardId: string, isAnonymous?: boolean) {
    // 1. Ambil Board dan data Workspace beserta keanggotaan user
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

    const membership = board.workspace.members[0];
    if (!membership) {
      throw new ForbiddenException('Anda bukan anggota dari workspace ini');
    }

    // 2. Otorisasi: Dapat diakses oleh semua anggota workspace (baik facilitator maupun anggota)

    // 3. Tentukan status baru (jika tidak dikirimkan, lakukan toggle)
    const newStatus = isAnonymous !== undefined ? Boolean(isAnonymous) : !board.isAnonymous;

    // 4. Update status isAnonymous di Database
    const updatedBoard = await this.prisma.board.update({
      where: { id: boardId },
      data: { isAnonymous: newStatus },
    });

    // 5. Broadcast perubahan realtime via Pusher ke channel board
    const channels = [
      `board-${boardId}`,
      `private-board-${boardId}`,
      `presence-board-${boardId}`,
    ];

    const payload = {
      boardId,
      isAnonymous: newStatus,
    };

    try {
      await this.pusher.trigger(channels, 'board.anonymous.updated', payload);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast board.anonymous.updated:`, err.message);
    }

    return {
      message: `Mode anonymous berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      boardId,
      isAnonymous: newStatus,
      board: updatedBoard,
    };
  }

  /**
   * Update Detail Board (Nama / Judul)
   */
  async updateBoard(userId: string, boardId: string, updateData: { name?: string; title?: string }) {
    const { board } = await this.getBoardWithFacilitatorCheck(userId, boardId);

    const newName = updateData.name?.trim() || updateData.title?.trim();
    if (!newName) {
      throw new BadRequestException('Nama board wajib diisi');
    }

    const updatedBoard = await this.prisma.board.update({
      where: { id: boardId },
      data: { name: newName },
    });

    const channels = [
      `board-${boardId}`,
      `private-board-${boardId}`,
      `presence-board-${boardId}`,
      `workspace-${board.workspaceId}`,
    ];

    const payload = {
      boardId,
      name: newName,
      title: newName,
      updatedBy: userId,
    };

    try {
      await this.pusher.trigger(channels, 'board.updated', payload);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast board.updated:`, err.message);
    }

    return {
      message: 'Nama board berhasil diperbarui',
      board: {
        ...updatedBoard,
        title: updatedBoard.name,
      },
    };
  }

  /**
   * Update Status Board (Aktif / Selesai)
   * Hanya fasilitator / owner / admin yang dapat mengubah status board
   */
  async updateBoardStatus(userId: string, boardId: string, status: string) {
    const validStatus = status === 'selesai' ? 'selesai' : 'aktif';
    const { board } = await this.getBoardWithFacilitatorCheck(userId, boardId);

    const updatedBoard = await (this.prisma.board as any).update({
      where: { id: boardId },
      data: { status: validStatus },
    });

    const channels = [
      `board-${boardId}`,
      `private-board-${boardId}`,
      `presence-board-${boardId}`,
      `workspace-${board.workspaceId}`,
    ];

    const payload = {
      boardId,
      status: validStatus,
      updatedBy: userId,
    };

    try {
      await this.pusher.trigger(channels, 'board.status.updated', payload);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast board.status.updated:`, err.message);
    }

    return {
      message: `Status board berhasil diubah menjadi ${validStatus}`,
      boardId,
      status: validStatus,
      board: updatedBoard,
    };
  }

  /**
   * Reveal Semua Card Pada Suatu Board
   * Hanya dapat dilakukan oleh fasilitator / owner / admin
   * Mengubah seluruh card menjadi revealed dan broadcast via Pusher ke channel board-{boardId}
   */
  async revealBoard(userId: string, boardId: string) {
    // 1. Cari Board dan periksa membership
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

    const membership = board.workspace.members[0];
    const isFacilitator =
      board.workspace.ownerId === userId ||
      membership?.role === 'owner' ||
      membership?.role === 'facilitator' ||
      membership?.role === 'admin';

    if (!isFacilitator) {
      throw new ForbiddenException('Hanya fasilitator yang dapat melakukan reveal kartu');
    }

    // 2. Update status board dan semua card di board menjadi isRevealed: true
    await this.prisma.$transaction([
      this.prisma.board.update({
        where: { id: boardId },
        data: { isRevealed: true },
      }),
      this.prisma.card.updateMany({
        where: { boardId },
        data: { isRevealed: true },
      }),
    ]);

    // 3. Ambil seluruh card yang kini sudah revealed beserta relasinya
    const revealedCards = await this.prisma.card.findMany({
      where: { boardId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        votes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        column: {
          select: {
            id: true,
            name: true,
          },
        },
        actionItem: {
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
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const formattedCards = revealedCards.map((c: any) => ({
      id: c.id,
      boardId: c.boardId,
      columnId: c.columnId,
      columnType: c.column?.name ? c.column.name.toLowerCase() : null,
      columnName: c.column?.name || null,
      authorId: c.authorId,
      isOwner: c.authorId === userId,
      isAnonymous: Boolean(c.isAnonymous),
      isRevealed: true,
      content: c.content,
      groupId: c.groupId || null,
      groupTitle: c.groupTitle || null,
      createdAt: c.createdAt,
      author: c.author,
      votes: c.votes || [],
      votesCount: Array.isArray(c.votes) ? c.votes.length : 0,
      comments: c.comments || [],
      commentsCount: Array.isArray(c.comments) ? c.comments.length : 0,
      actionItem: c.actionItem || null,
    }));

    // 4. Broadcast via Pusher ke channel board-{boardId} dengan event board.revealed
    const channels = [
      `board-${boardId}`,
      `private-board-${boardId}`,
      `presence-board-${boardId}`,
    ];

    const payload = {
      boardId,
      isRevealed: true,
      revealedBy: userId,
      cardsCount: formattedCards.length,
      cards: formattedCards,
    };

    try {
      await this.pusher.trigger(channels, 'board.revealed', payload);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast board.revealed:`, err.message);
    }

    return {
      message: 'Semua card berhasil di-reveal',
      boardId,
      isRevealed: true,
      cardsCount: formattedCards.length,
      cards: formattedCards,
    };
  }

  /**
   * Helper: Periksa Keberadaan Board dan Otorisasi Fasilitator
   */
  private async getBoardWithFacilitatorCheck(userId: string, boardId: string) {
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

    const membership = board.workspace.members[0];
    const isFacilitator =
      board.workspace.ownerId === userId ||
      membership?.role === 'owner' ||
      membership?.role === 'facilitator' ||
      membership?.role === 'admin';

    if (!isFacilitator) {
      throw new ForbiddenException('Hanya fasilitator yang dapat mengelola mode presentasi');
    }

    return { board, membership };
  }

  /**
   * Helper: Mengambil Semua Card Terurut Berdasarkan Urutan Kolom & Waktu Pembuatan
   */
  private async getAllBoardCardsOrdered(boardId: string) {
    const columns = await this.prisma.boardColumn.findMany({
      where: { boardId },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, order: true },
    });

    const cards = await this.prisma.card.findMany({
      where: { boardId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        votes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
        actionItem: {
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
        },
      },
    });

    const columnOrderMap = new Map(columns.map((c) => [c.id, c.order]));
    cards.sort((a, b) => {
      const orderA = columnOrderMap.get(a.columnId) ?? 999;
      const orderB = columnOrderMap.get(b.columnId) ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return cards.map((c: any) => ({
      id: c.id,
      boardId: c.boardId,
      columnId: c.columnId,
      columnType: c.column?.name ? c.column.name.toLowerCase() : null,
      columnName: c.column?.name || null,
      authorId: c.authorId,
      isAnonymous: Boolean(c.isAnonymous),
      isRevealed: Boolean(c.isRevealed),
      content: c.content,
      groupId: c.groupId || null,
      groupTitle: c.groupTitle || null,
      createdAt: c.createdAt,
      author: c.author,
      votes: c.votes || [],
      votesCount: Array.isArray(c.votes) ? c.votes.length : 0,
      comments: c.comments || [],
      commentsCount: Array.isArray(c.comments) ? c.comments.length : 0,
      actionItem: c.actionItem || null,
    }));
  }

  /**
   * Mengaktifkan Mode Presentasi (Hanya Fasilitator)
   * POST /api/boards/:id/presentation/start
   */
  async startPresentation(userId: string, boardId: string, cardId?: string) {
    const { board } = await this.getBoardWithFacilitatorCheck(userId, boardId);

    const allCards = await this.getAllBoardCardsOrdered(boardId);
    if (allCards.length === 0) {
      throw new BadRequestException('Tidak ada card pada board ini untuk dipresentasikan');
    }

    let selectedIndex = 0;
    if (cardId) {
      const foundIdx = allCards.findIndex((c) => c.id === cardId);
      if (foundIdx !== -1) {
        selectedIndex = foundIdx;
      }
    }

    const currentCard = allCards[selectedIndex];

    const updatedBoard = await this.prisma.board.update({
      where: { id: boardId },
      data: {
        presentationMode: true,
        presentationCurrentCardId: currentCard.id,
      },
    });

    const payload = {
      boardId,
      presentationMode: true,
      presentationCurrentCardId: currentCard.id,
      currentCardId: currentCard.id,
      card: currentCard,
      currentIndex: selectedIndex,
      totalCards: allCards.length,
      isFirst: selectedIndex === 0,
      isLast: selectedIndex === allCards.length - 1,
      startedBy: userId,
    };

    const channels = [
      `board-${boardId}`,
      `private-board-${boardId}`,
      `presence-board-${boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'presentation.started', payload);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast presentation.started:`, err.message);
    }

    return {
      message: 'Mode presentasi berhasil diaktifkan',
      board: updatedBoard,
      ...payload,
    };
  }

  /**
   * Berpindah ke Card Berikutnya dalam Mode Presentasi (Hanya Fasilitator)
   * POST /api/boards/:id/presentation/next
   */
  async nextPresentationCard(userId: string, boardId: string) {
    const { board } = await this.getBoardWithFacilitatorCheck(userId, boardId);

    if (!board.presentationMode) {
      throw new BadRequestException('Mode presentasi belum diaktifkan');
    }

    const allCards = await this.getAllBoardCardsOrdered(boardId);
    if (allCards.length === 0) {
      throw new BadRequestException('Tidak ada card pada board');
    }

    const currentIdx = allCards.findIndex((c) => c.id === board.presentationCurrentCardId);
    const nextIdx = currentIdx === -1 ? 0 : Math.min(currentIdx + 1, allCards.length - 1);
    const nextCard = allCards[nextIdx];

    const updatedBoard = await this.prisma.board.update({
      where: { id: boardId },
      data: {
        presentationCurrentCardId: nextCard.id,
      },
    });

    const payload = {
      boardId,
      presentationMode: true,
      presentationCurrentCardId: nextCard.id,
      currentCardId: nextCard.id,
      card: nextCard,
      currentIndex: nextIdx,
      totalCards: allCards.length,
      isFirst: nextIdx === 0,
      isLast: nextIdx === allCards.length - 1,
      direction: 'next',
    };

    const channels = [
      `board-${boardId}`,
      `private-board-${boardId}`,
      `presence-board-${boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'presentation.card.changed', payload);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast presentation.card.changed:`, err.message);
    }

    return {
      message: 'Navigasi ke card berikutnya berhasil',
      board: updatedBoard,
      ...payload,
    };
  }

  /**
   * Berpindah ke Card Sebelumnya dalam Mode Presentasi (Hanya Fasilitator)
   * POST /api/boards/:id/presentation/prev
   */
  async prevPresentationCard(userId: string, boardId: string) {
    const { board } = await this.getBoardWithFacilitatorCheck(userId, boardId);

    if (!board.presentationMode) {
      throw new BadRequestException('Mode presentasi belum diaktifkan');
    }

    const allCards = await this.getAllBoardCardsOrdered(boardId);
    if (allCards.length === 0) {
      throw new BadRequestException('Tidak ada card pada board');
    }

    const currentIdx = allCards.findIndex((c) => c.id === board.presentationCurrentCardId);
    const prevIdx = currentIdx === -1 ? 0 : Math.max(currentIdx - 1, 0);
    const prevCard = allCards[prevIdx];

    const updatedBoard = await this.prisma.board.update({
      where: { id: boardId },
      data: {
        presentationCurrentCardId: prevCard.id,
      },
    });

    const payload = {
      boardId,
      presentationMode: true,
      presentationCurrentCardId: prevCard.id,
      currentCardId: prevCard.id,
      card: prevCard,
      currentIndex: prevIdx,
      totalCards: allCards.length,
      isFirst: prevIdx === 0,
      isLast: prevIdx === allCards.length - 1,
      direction: 'prev',
    };

    const channels = [
      `board-${boardId}`,
      `private-board-${boardId}`,
      `presence-board-${boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'presentation.card.changed', payload);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast presentation.card.changed:`, err.message);
    }

    return {
      message: 'Navigasi ke card sebelumnya berhasil',
      board: updatedBoard,
      ...payload,
    };
  }

  /**
   * Menghentikan Mode Presentasi (Hanya Fasilitator)
   * POST /api/boards/:id/presentation/stop
   */
  async stopPresentation(userId: string, boardId: string) {
    const { board } = await this.getBoardWithFacilitatorCheck(userId, boardId);

    const updatedBoard = await this.prisma.board.update({
      where: { id: boardId },
      data: {
        presentationMode: false,
        presentationCurrentCardId: null,
      },
    });

    const payload = {
      boardId,
      presentationMode: false,
      presentationCurrentCardId: null,
      currentCardId: null,
      stoppedBy: userId,
    };

    const channels = [
      `board-${boardId}`,
      `private-board-${boardId}`,
      `presence-board-${boardId}`,
    ];

    try {
      await this.pusher.trigger(channels, 'presentation.stopped', payload);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast presentation.stopped:`, err.message);
    }

    return {
      message: 'Mode presentasi berhasil dihentikan',
      board: updatedBoard,
      ...payload,
    };
  }
}
