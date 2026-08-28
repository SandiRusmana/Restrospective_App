import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';

const DEFAULT_COLUMNS = [
  { name: 'What Went Well', order: 1 },
  { name: 'What Could Be Improved', order: 2 },
  { name: 'Action Items', order: 3 },
];

@Injectable()
export class BoardService {
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
        columns: {
          create: DEFAULT_COLUMNS,
        },
      },
      include: {
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
}
