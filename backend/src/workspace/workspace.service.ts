import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
                status: true,
                isRevealed: true,
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

  /**
   * Menghapus Workspace (Hanya Pembuat/Owner)
   */
  async deleteWorkspace(userId: string, workspaceId: string) {
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

    const member = workspace.members[0];
    const isOwner = workspace.ownerId === userId || (member && member.role === 'owner');

    if (!isOwner) {
      throw new ForbiddenException('Hanya owner workspace yang dapat menghapus workspace ini');
    }

    await this.prisma.$transaction([
      this.prisma.workspaceInvite.deleteMany({ where: { workspaceId } }),
      this.prisma.workspaceMember.deleteMany({ where: { workspaceId } }),
      this.prisma.card.deleteMany({ where: { board: { workspaceId } } }),
      this.prisma.boardColumn.deleteMany({ where: { board: { workspaceId } } }),
      this.prisma.board.deleteMany({ where: { workspaceId } }),
      this.prisma.workspace.delete({ where: { id: workspaceId } }),
    ]);

    return {
      message: 'Workspace berhasil dihapus',
    };
  }

  /**
   * Mengubah Informasi Workspace (Hanya Owner)
   */
  async updateWorkspace(userId: string, workspaceId: string, updateData: { name?: string }) {
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

    const member = workspace.members[0];
    const isOwner = workspace.ownerId === userId || (member && member.role === 'owner');

    if (!isOwner) {
      throw new ForbiddenException('Hanya owner workspace yang dapat mengubah informasi workspace');
    }

    const updatedWorkspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(updateData.name ? { name: updateData.name.trim() } : {}),
      },
    });

    return {
      message: 'Workspace berhasil diperbarui',
      workspace: updatedWorkspace,
    };
  }

  /**
   * Mengambil Daftar Anggota Workspace
   */
  async getWorkspaceMembers(userId: string, workspaceId: string) {
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
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace tidak ditemukan');
    }

    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('Anda tidak memiliki akses ke workspace ini');
    }

    return workspace.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      name: m.user.name || m.user.email.split('@')[0],
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
    }));
  }

  /**
   * Mengubah Role Anggota Workspace (Promote ke Admin, Member, atau Transfer Owner)
   */
  async updateMemberRole(userId: string, workspaceId: string, targetUserId: string, newRole: string) {
    const validRoles = ['owner', 'admin', 'member'];
    const normalizedRole = (newRole || '').toLowerCase().trim();
    if (!validRoles.includes(normalizedRole)) {
      throw new BadRequestException('Role tidak valid. Pilihan: owner, admin, member');
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace tidak ditemukan');
    }

    // Cek hak akses pemohon (requester)
    const requesterMember = workspace.members.find((m) => m.userId === userId);
    if (!requesterMember) {
      throw new ForbiddenException('Anda bukan anggota workspace ini');
    }

    const isRequesterOwner = workspace.ownerId === userId || requesterMember.role === 'owner';
    const isRequesterAdmin = requesterMember.role === 'admin';

    if (!isRequesterOwner && !isRequesterAdmin) {
      throw new ForbiddenException('Hanya owner atau admin yang dapat mengubah role anggota');
    }

    // Cek target anggota
    const targetMember = workspace.members.find(
      (m) => m.userId === targetUserId || m.id === targetUserId,
    );
    if (!targetMember) {
      throw new NotFoundException('Anggota tidak ditemukan di workspace ini');
    }

    // Role sudah sama
    if (targetMember.role === normalizedRole) {
      return { message: `Role anggota sudah ${normalizedRole}`, role: normalizedRole };
    }

    // Batasan untuk Admin: tidak bisa ubah owner/admin lain dan tidak bisa angkat jadi owner
    if (!isRequesterOwner) {
      if (targetMember.role === 'owner' || targetMember.userId === workspace.ownerId) {
        throw new ForbiddenException('Admin tidak dapat mengubah role owner');
      }
      if (targetMember.role === 'admin') {
        throw new ForbiddenException('Admin tidak dapat mengubah role sesama admin');
      }
      if (normalizedRole === 'owner') {
        throw new ForbiddenException('Hanya owner yang dapat mentransfer kepemilikan workspace');
      }
    }

    // Jika transfer kepemilikan (jadikan owner)
    if (normalizedRole === 'owner') {
      await this.prisma.$transaction([
        this.prisma.workspace.update({
          where: { id: workspaceId },
          data: { ownerId: targetMember.userId },
        }),
        this.prisma.workspaceMember.update({
          where: { id: targetMember.id },
          data: { role: 'owner' },
        }),
        // Demote owner lama menjadi admin
        this.prisma.workspaceMember.updateMany({
          where: {
            workspaceId,
            userId,
          },
          data: { role: 'admin' },
        }),
      ]);

      return {
        message: 'Kepemilikan workspace berhasil dialihkan',
        role: 'owner',
      };
    }

    // Owner utama tidak boleh diturunkan role-nya tanpa transfer kepemilikan terlebih dahulu
    if (targetMember.role === 'owner' && targetMember.userId === workspace.ownerId) {
      throw new ForbiddenException('Owner utama tidak dapat diturunkan role-nya tanpa mentransfer kepemilikan terlebih dahulu');
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: targetMember.id },
      data: { role: normalizedRole },
    });

    return {
      message: `Role berhasil diubah menjadi ${normalizedRole}`,
      role: updated.role,
    };
  }

  /**
   * Mengeluarkan Anggota dari Workspace atau Keluar Sendiri
   */
  async removeMember(userId: string, workspaceId: string, targetUserId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace tidak ditemukan');
    }

    const requesterMember = workspace.members.find((m) => m.userId === userId);
    if (!requesterMember) {
      throw new ForbiddenException('Anda bukan anggota workspace ini');
    }

    const targetMember = workspace.members.find(
      (m) => m.userId === targetUserId || m.id === targetUserId,
    );
    if (!targetMember) {
      throw new NotFoundException('Anggota tidak ditemukan di workspace ini');
    }

    // Owner utama tidak bisa dikeluarkan
    if (targetMember.role === 'owner' || targetMember.userId === workspace.ownerId) {
      throw new ForbiddenException('Owner workspace tidak dapat dikeluarkan. Alihkan kepemilikan terlebih dahulu.');
    }

    const isSelfLeave = targetMember.userId === userId;
    const isRequesterOwner = workspace.ownerId === userId || requesterMember.role === 'owner';
    const isRequesterAdmin = requesterMember.role === 'admin';

    if (!isSelfLeave) {
      if (!isRequesterOwner && !isRequesterAdmin) {
        throw new ForbiddenException('Anda tidak memiliki izin untuk mengeluarkan anggota');
      }
      if (isRequesterAdmin && targetMember.role === 'admin') {
        throw new ForbiddenException('Admin tidak dapat mengeluarkan sesama admin');
      }
    }

    await this.prisma.workspaceMember.delete({
      where: { id: targetMember.id },
    });

    return {
      message: isSelfLeave
        ? 'Anda telah keluar dari workspace'
        : 'Anggota berhasil dikeluarkan dari workspace',
    };
  }
}

