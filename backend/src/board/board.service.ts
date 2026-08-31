<<<<<<< HEAD
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';

const DEFAULT_COLUMNS = [
  { name: 'What Went Well', order: 1 },
  { name: 'What Could Be Improved', order: 2 },
  { name: 'Action Items', order: 3 },
=======
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PusherService } from '../pusher/pusher.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateCardDto } from './dto/create-card.dto';

// Kolom default untuk template "went-well / went-wrong / action-items"
const DEFAULT_COLUMNS = [
  { name: 'WHAT WENT WELL', order: 0 },
  { name: 'WHAT WENT WRONG', order: 1 },
  { name: 'ACTION ITEMS', order: 2 },
>>>>>>> 3e52db1 (fitur template)
];

@Injectable()
export class BoardService {
<<<<<<< HEAD
  constructor(private prisma: PrismaService) {}

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
      throw new ForbiddenException('Anda bukan anggota dari workspace ini');
    }

    return membership;
  }

  /**
   * Membuat Board Baru dalam Workspace
   */
  async createBoard(userId: string, workspaceId: string, createBoardDto: CreateBoardDto) {
    // 1. Pastikan user adalah anggota workspace
    await this.checkWorkspaceMembership(userId, workspaceId);

    const { name, template = 'start-stop-continue', isAnonymous = false, voteLimit } = createBoardDto;

    // 2. Buat Board dan Kolom-Kolom Default
    const board = await this.prisma.board.create({
      data: {
        name,
        workspaceId,
        template,
        isAnonymous,
        voteLimit,
=======
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
  ) {}

  /**
   * Helper: Pastikan user adalah anggota workspace
   */
  private async assertMember(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
    if (!member)
      throw new ForbiddenException('Anda tidak memiliki akses ke workspace ini');
    return member;
  }

  /**
   * Membuat board baru di dalam workspace tertentu
   */
  async createBoard(
    userId: string,
    workspaceId: string,
    createBoardDto: CreateBoardDto,
  ) {
    // Pastikan user adalah anggota workspace
    await this.assertMember(userId, workspaceId);

    const board = await this.prisma.board.create({
      data: {
        name: createBoardDto.name,
        workspaceId,
        template: createBoardDto.template ?? 'went-well-wrong-action',
        isAnonymous: createBoardDto.isAnonymous ?? false,
        voteLimit: createBoardDto.voteLimit ?? null,
>>>>>>> 3e52db1 (fitur template)
        columns: {
          create: DEFAULT_COLUMNS,
        },
      },
      include: {
<<<<<<< HEAD
        columns: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return {
      message: 'Board berhasil dibuat',
      board,
    };
  }

  /**
   * Mengambil Semua Board di Workspace Tertentu
   */
  async getWorkspaceBoards(userId: string, workspaceId: string) {
    // 1. Pastikan user adalah anggota workspace
    await this.checkWorkspaceMembership(userId, workspaceId);

    // 2. Ambil daftar board
    const boards = await this.prisma.board.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: {
            cards: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return boards.map((b) => ({
      id: b.id,
      name: b.name,
      template: b.template,
      isAnonymous: b.isAnonymous,
      voteLimit: b.voteLimit,
      workspaceId: b.workspaceId,
      cardsCount: b._count.cards,
      createdAt: b.createdAt,
    }));
  }

  /**
   * Mengambil Detail Board Berdasarkan ID
   */
  async getBoardById(userId: string, boardId: string) {
    // 1. Cari Board
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: {
            order: 'asc',
          },
          include: {
            cards: {
              include: {
                author: {
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
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board tidak ditemukan');
    }

    // 2. Cek apakah user adalah anggota dari workspace tempat board berada
    await this.checkWorkspaceMembership(userId, board.workspaceId);

    return board;
  }
=======
        columns: { orderBy: { order: 'asc' } },
        cards: true,
      },
    });

    await this.pusher.trigger(`workspace-${workspaceId}`, 'board:created', {
      board,
    });

    return board;
  }

  /**
   * Mengambil semua board dalam suatu workspace (beserta kolom dan kartu)
   */
  async getBoardsByWorkspace(userId: string, workspaceId: string) {
    await this.assertMember(userId, workspaceId);

    return this.prisma.board.findMany({
      where: { workspaceId },
      include: {
        columns: { orderBy: { order: 'asc' } },
        cards: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { cards: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mengambil detail satu board beserta kolom dan kartu
   */
  async getBoardById(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        columns: { orderBy: { order: 'asc' } },
        cards: {
          include: {
            author: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!board) throw new NotFoundException('Board tidak ditemukan');

    // Pastikan user anggota workspace
    const isMember = board.workspace.members.some((m) => m.userId === userId);
    if (!isMember)
      throw new ForbiddenException('Anda tidak memiliki akses ke board ini');

    return board;
  }

  /**
   * Menghapus board (hanya owner workspace)
   */
  async deleteBoard(userId: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { workspace: true },
    });

    if (!board) throw new NotFoundException('Board tidak ditemukan');

    const isOwner = board.workspace.ownerId === userId;
    if (!isOwner)
      throw new ForbiddenException(
        'Hanya owner workspace yang dapat menghapus board',
      );

    await this.prisma.$transaction([
      this.prisma.card.deleteMany({ where: { boardId } }),
      this.prisma.boardColumn.deleteMany({ where: { boardId } }),
      this.prisma.board.delete({ where: { id: boardId } }),
    ]);

    await this.pusher.trigger(
      `workspace-${board.workspaceId}`,
      'board:deleted',
      { boardId },
    );

    return { message: 'Board berhasil dihapus' };
  }

  // ─────────────────── Card Endpoints ───────────────────

  /**
   * Menambahkan kartu ke dalam kolom board
   */
  async createCard(userId: string, boardId: string, dto: CreateCardDto) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { workspace: { include: { members: true } } },
    });

    if (!board) throw new NotFoundException('Board tidak ditemukan');

    const isMember = board.workspace.members.some((m) => m.userId === userId);
    if (!isMember)
      throw new ForbiddenException('Anda tidak memiliki akses ke board ini');

    // Pastikan kolom ada dan milik board ini
    const column = await this.prisma.boardColumn.findFirst({
      where: { id: dto.columnId, boardId },
    });
    if (!column) throw new NotFoundException('Kolom tidak ditemukan');

    const card = await this.prisma.card.create({
      data: {
        boardId,
        columnId: dto.columnId,
        authorId: userId,
        content: dto.content,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        column: true,
      },
    });

    // Kirim event realtime ke semua anggota board
    await this.pusher.trigger(`board-${boardId}`, 'card:created', { card });

    return card;
  }

  /**
   * Menghapus kartu dari board
   */
  async deleteCard(userId: string, boardId: string, cardId: string) {
    const card = await this.prisma.card.findFirst({
      where: { id: cardId, boardId },
      include: {
        board: {
          include: {
            workspace: { include: { members: true } },
          },
        },
      },
    });

    if (!card) throw new NotFoundException('Kartu tidak ditemukan');

    // Hanya penulis kartu atau owner workspace yang bisa hapus
    const isAuthor = card.authorId === userId;
    const isOwner = card.board.workspace.ownerId === userId;

    if (!isAuthor && !isOwner)
      throw new ForbiddenException(
        'Anda tidak memiliki izin untuk menghapus kartu ini',
      );

    await this.prisma.card.delete({ where: { id: cardId } });

    await this.pusher.trigger(`board-${boardId}`, 'card:deleted', {
      cardId,
      columnId: card.columnId,
    });

    return { message: 'Kartu berhasil dihapus' };
  }
>>>>>>> 3e52db1 (fitur template)
}
