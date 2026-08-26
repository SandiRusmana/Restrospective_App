import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Membuat Workspace Baru & Otomatis Mendaftarkan Pembuat sebagai Owner
   */
  async createWorkspace(userId: string, createWorkspaceDto: CreateWorkspaceDto) {
    const { name } = createWorkspaceDto;

    // Buat workspace dan tambahkan pembuat sebagai WorkspaceMember (role: owner)
    const workspace = await this.prisma.workspace.create({
      data: {
        name,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Workspace berhasil dibuat',
      workspace,
    };
  }

  /**
   * Mengambil Semua Workspace Tempat User Terdaftar Sebagai Anggota
   */
  async getUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
            boards: {
              select: {
                id: true,
                name: true,
                template: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return memberships.map((membership) => ({
      ...membership.workspace,
      role: membership.role,
      joinedAt: membership.joinedAt,
    }));
  }

  /**
   * Mengambil Detail Workspace Berdasarkan ID (Dengan Pengecekan Membership)
   */
  async getWorkspaceById(userId: string, workspaceId: string) {
    // 1. Cek apakah workspace ada
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        boards: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace tidak ditemukan');
    }

    // 2. Cek apakah user adalah anggota workspace ini
    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Anda tidak memiliki akses ke workspace ini');
    }

    return workspace;
  }
}
