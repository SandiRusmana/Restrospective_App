import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { CreateCardDto } from './dto/create-card.dto';
import { GroupCardDto } from './dto/group-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardService {
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
  ) { }

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
   * Menambahkan Card Baru Ke Dalam Kolom Board
   */
  async createCard(userId: string, boardId: string, createCardDto: CreateCardDto) {
    const { columnId, content } = createCardDto;

    // 1. Cek Otorisasi Akses User ke Board
    const board = await this.checkBoardAccess(userId, boardId);

    // 2. Pastikan kolom yang dituju benar-benar milik board ini (cocokkan via id UUID atau nama kolom)
    let column = await this.prisma.boardColumn.findFirst({
      where: {
        id: columnId,
        boardId: board.id,
      },
    });

    if (!column) {
      // Fallback 1: cocokkan dengan nama kolom (misal "Start", "Stop", "Continue")
      column = await this.prisma.boardColumn.findFirst({
        where: {
          boardId: board.id,
          name: {
            equals: columnId,
            mode: 'insensitive',
          },
        },
      });
    }

    if (!column) {
      // Fallback 2: cocokkan berdasarkan substring nama
      const cleanCol = columnId.replace(/[_-]/g, ' ').toLowerCase();
      const allColumns = await this.prisma.boardColumn.findMany({
        where: { boardId: board.id },
        orderBy: { order: 'asc' },
      });
      column =
        allColumns.find(
          (c) =>
            c.name.toLowerCase() === cleanCol ||
            c.name.toLowerCase().startsWith(cleanCol) ||
            cleanCol.startsWith(c.name.toLowerCase()),
        ) || null;
    }

    if (!column) {
      throw new NotFoundException('Kolom tidak ditemukan di dalam board ini');
    }

    // 3. Simpan Card ke Database
    // Mode anonymous pada kartu: jika dikirim spesifik oleh pengguna (per-person anonymous mode),
    // gunakan nilai tersebut. Jika tidak ditentukan, fallback ke board.isAnonymous.
    const isCardAnonymous =
      typeof createCardDto.isAnonymous === 'boolean'
        ? createCardDto.isAnonymous
        : Boolean(board.isAnonymous);

    const card = await this.prisma.card.create({
      data: {
        boardId: board.id,
        columnId: column.id,
        authorId: userId,
        content: content.trim(),
        isAnonymous: isCardAnonymous,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const cardResponse = {
      ...card,
      columnType: column.name.toLowerCase(),
      columnName: column.name,
      isAnonymous: isCardAnonymous,
      isOwner: true,
    };

    // 4. Trigger Realtime Broadcast via Pusher (Broadcast ke semua channel board)
    const channels = [
      `board-${boardId}`,
      `private-board-${boardId}`,
      `presence-board-${boardId}`,
    ];
    const cardToBroadcast = isCardAnonymous
      ? { ...cardResponse, author: null, isAnonymous: true }
      : { ...cardResponse, isAnonymous: false };
    try {
      await this.pusher.trigger(channels, 'card.created', cardToBroadcast);
    } catch (err) {
      console.warn(
        `[Pusher Warn] Gagal mengirim broadcast card.created ke channels ${channels.join(', ')}:`,
        err.message,
      );
    }

    return {
      message: 'Card berhasil dibuat',
      card: cardResponse,
    };
  }

  /**
   * Mengambil Semua Card Pada Suatu Board
   */
  async getBoardCards(userId: string, boardId: string) {
    // 1. Cek Otorisasi Akses User ke Board
    const board = await this.checkBoardAccess(userId, boardId);
    const membership = board.workspace.members[0];
    const isFacilitator =
      board.workspace.ownerId === userId ||
      membership?.role === 'owner' ||
      membership?.role === 'facilitator' ||
      membership?.role === 'admin';

    // 2. Ambil semua card pada board beserta relasi author, vote, dan comments
    const cards = await (this.prisma.card as any).findMany({
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
        column: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return cards.map((c: any) => {
      const isOwner = c.authorId === userId;
      // Kartu hanya disamarkan (anonim) jika kartu itu sendiri dibuat dalam mode anonymous (c.isAnonymous === true)
      // DAN jika pengguna yang melihat bukan pemilik kartu itu sendiri (!isOwner).
      // Kartu yang dibuat sebelum mode anonymous (c.isAnonymous === false) TETAP menampilkan nama dan identitas aslinya.
      const isCardAnonymous = Boolean(c.isAnonymous);
      const shouldHideAuthor = isCardAnonymous && !isOwner;

      return {
        id: c.id,
        boardId: c.boardId,
        columnId: c.columnId,
        columnType: c.column?.name ? c.column.name.toLowerCase() : null,
        columnName: c.column?.name || null,
        authorId: shouldHideAuthor ? null : c.authorId,
        isOwner,
        isAnonymous: isCardAnonymous,
        content: c.content,
        groupId: c.groupId || null,
        groupTitle: c.groupTitle || null,
        createdAt: c.createdAt,
        author: shouldHideAuthor ? null : c.author,
        votes: c.votes || [],
        votesCount: c._count?.votes || (Array.isArray(c.votes) ? c.votes.length : 0),
        hasVoted: Array.isArray(c.votes)
          ? c.votes.some((v: any) => v.userId === userId)
          : false,
        comments: c.comments || [],
        commentsCount: c._count?.comments || (Array.isArray(c.comments) ? c.comments.length : 0),
        actionItem: c.actionItem || null,
      };
    });
  }

  /**
   * Mengubah Isi atau Memindahkan Kolom Card
   */
  async updateCard(userId: string, cardId: string, updateCardDto: UpdateCardDto) {
    // 1. Cari Card
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card tidak ditemukan');
    }

    // 2. Validasi Akses User ke Board
    const board = await this.checkBoardAccess(userId, card.boardId);

    // Jika mengedit teks konten, pastikan user adalah pembuat card
    if (updateCardDto.content !== undefined && card.authorId !== userId) {
      throw new ForbiddenException('Anda hanya dapat mengubah teks catatan milik Anda sendiri');
    }

    // 3. Update Card di Database
    const updatedCard: any = await (this.prisma.card as any).update({
      where: { id: cardId },
      data: {
        ...(updateCardDto.content !== undefined ? { content: updateCardDto.content.trim() } : {}),
        ...(updateCardDto.columnId !== undefined ? { columnId: updateCardDto.columnId } : {}),
      },
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
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    const formattedCard = {
      id: updatedCard.id,
      boardId: updatedCard.boardId,
      columnId: updatedCard.columnId,
      authorId: updatedCard.authorId,
      content: updatedCard.content,
      groupId: updatedCard.groupId,
      groupTitle: (updatedCard as any).groupTitle || null,
      createdAt: updatedCard.createdAt,
      author: updatedCard.author,
      votes: updatedCard.votes,
      votesCount: updatedCard._count.votes,
      hasVoted: updatedCard.votes.some((v) => v.userId === userId),
      actionItem: (updatedCard as any).actionItem || null,
    };

    // 4. Trigger Realtime Broadcast via Pusher
    const channels = [
      `private-board-${card.boardId}`,
      `board-${card.boardId}`,
      `presence-board-${card.boardId}`,
    ];

    const cardToBroadcast = board.isAnonymous
      ? { ...formattedCard, author: null }
      : formattedCard;

    try {
      await this.pusher.trigger(channels, 'card.updated', cardToBroadcast);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast card.updated ke channels:`, err.message);
    }

    return {
      message: 'Card berhasil diperbarui',
      card: formattedCard,
    };
  }

  /**
   * Menghapus Card (Hanya Pembuat/Author Card)
   */
  async deleteCard(userId: string, cardId: string) {
    // 1. Cari Card
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card tidak ditemukan');
    }

    // 2. Ownership Check: Memastikan user adalah author dari card ini
    if (card.authorId !== userId) {
      throw new ForbiddenException('Anda hanya dapat menghapus card milik Anda sendiri');
    }

    // 3. Hapus Card dari Database
    await this.prisma.card.delete({
      where: { id: cardId },
    });

    // 4. Trigger Realtime Broadcast via Pusher
    const channels = [
      `board-${card.boardId}`,
      `private-board-${card.boardId}`,
      `presence-board-${card.boardId}`,
    ];
    try {
      await this.pusher.trigger(channels, 'card.deleted', {
        id: card.id,
        cardId: card.id,
        boardId: card.boardId,
        columnId: card.columnId,
      });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast card.deleted:`, err.message);
    }

    return {
      message: 'Card berhasil dihapus',
    };
  }

  /**
   * Mengatur Group/Cluster pada Card (Grouping Realtime)
   */
  async groupCard(userId: string, cardId: string, groupCardDto: GroupCardDto) {
    // 1. Cari Card
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Card tidak ditemukan');
    }

    // 2. Validasi Akses User ke Board
    const board = await this.checkBoardAccess(userId, card.boardId);

    const targetGroupId =
      groupCardDto.groupId !== undefined ? groupCardDto.groupId : card.groupId;

    // Jika ada update groupTitle dan card memiliki groupId, update seluruh card di group tersebut
    if (groupCardDto.groupTitle !== undefined && targetGroupId) {
      await (this.prisma.card as any).updateMany({
        where: { groupId: targetGroupId },
        data: {
          groupTitle: groupCardDto.groupTitle?.trim() || null,
        },
      });
    }

    // 3. Update groupId & groupTitle card di Database
    const updatedCard = await this.prisma.card.update({
      where: { id: cardId },
      data: {
        groupId: targetGroupId,
        ...(groupCardDto.groupTitle !== undefined
          ? { groupTitle: groupCardDto.groupTitle?.trim() || null }
          : {}),
      },
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
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    const formattedCard = {
      id: updatedCard.id,
      boardId: updatedCard.boardId,
      columnId: updatedCard.columnId,
      authorId: updatedCard.authorId,
      content: updatedCard.content,
      groupId: updatedCard.groupId,
      groupTitle: (updatedCard as any).groupTitle || null,
      createdAt: updatedCard.createdAt,
      author: updatedCard.author,
      votes: updatedCard.votes,
      votesCount: updatedCard._count.votes,
      hasVoted: updatedCard.votes.some((v) => v.userId === userId),
    };

    // 4. Broadcast realtime via Pusher ke channel board
    const channels = [
      `private-board-${card.boardId}`,
      `board-${card.boardId}`,
      `presence-board-${card.boardId}`,
    ];

    const cardToBroadcast = board.isAnonymous
      ? { ...formattedCard, author: null }
      : formattedCard;

    try {
      await this.pusher.trigger(channels, 'card.grouped', {
        cardId: formattedCard.id,
        boardId: formattedCard.boardId,
        columnId: formattedCard.columnId,
        groupId: formattedCard.groupId,
        groupTitle: formattedCard.groupTitle,
        updatedCard: cardToBroadcast,
      });
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal mengirim broadcast card.grouped:`, err.message);
    }

    return {
      message: 'Group card berhasil diperbarui',
      card: formattedCard,
    };
  }

  /**
   * Add Comment Realtime
   */
  async addComment(userId: string, cardId: string, commentText: string) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Card tidak ditemukan');

    await this.checkBoardAccess(userId, card.boardId);

    const commentData = {
      id: `comment_${Date.now()}`,
      cardId: card.id,
      boardId: card.boardId,
      authorId: userId,
      text: commentText,
      createdAt: new Date().toISOString(),
    };

    const channels = [`private-board-${card.boardId}`, `board-${card.boardId}`];
    try {
      await this.pusher.trigger(channels, 'comment.created', commentData);
    } catch (err) {
      console.warn(`[Pusher Warn] Gagal broadcast comment.created:`, err.message);
    }

    return { message: 'Komentar berhasil ditambahkan', comment: commentData };
  }
}
