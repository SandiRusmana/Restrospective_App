import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registrasi User Baru
   */
  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase().trim();
    const { password, name } = registerDto;

    // Cek apakah email sudah terdaftar
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar. Silakan gunakan email lain.');
    }

    // Hashing password dengan bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Simpan user baru ke database
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name ? name.trim() : null,
      },
    });

    // Generate JWT access token
    const token = await this.generateToken(user.id, user.email);

    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'Registrasi berhasil',
      accessToken: token,
      user: userWithoutPassword,
    };
  }

  /**
   * Login User
   */
  async login(loginDto: LoginDto, clientIp: string = '127.0.0.1') {
    const email = loginDto.email.toLowerCase().trim();
    const { password } = loginDto;

    // Cari user berdasarkan email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      LoginThrottlerGuard.recordFailure(clientIp, email);
      throw new UnauthorizedException('Email atau password salah');
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      LoginThrottlerGuard.recordFailure(clientIp, email);
      throw new UnauthorizedException('Email atau password salah');
    }

    // Reset failed attempts on success
    LoginThrottlerGuard.resetSuccess(clientIp, email);

    // Generate JWT access token
    const token = await this.generateToken(user.id, user.email);

    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'Login berhasil',
      accessToken: token,
      user: userWithoutPassword,
    };
  }

  /**
   * Logout User (Pesan konfirmasi logout)
   */
  async logout() {
    return {
      message: 'Logout berhasil. Silakan hapus token dari sisi client.',
    };
  }

  /**
   * Ambil Profil User Aktif (Me)
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update Profil User (Nama, Avatar)
   */
  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Validasi atau Buat User Baru dari Google OAuth
   */
  async validateOrCreateGoogleUser(profile: {
    googleId: string;
    email: string | null;
    name?: string;
    avatarUrl?: string | null;
  }) {
    if (!profile.email) {
      throw new UnauthorizedException('Akun Google tidak memiliki alamat email yang valid');
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.googleId }, { email: profile.email }],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name || null,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl || null,
        },
      });
    } else {
      // Update googleId atau avatar jika belum ada
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl || user.avatarUrl,
          name: user.name || profile.name || null,
        },
      });
    }

    const token = await this.generateToken(user.id, user.email);
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken: token,
      user: userWithoutPassword,
    };
  }

  /**
   * Login atau Inisialisasi Akun Demo (1-Click Live Demo)
   */
  async loginDemo() {
    const email = 'demo@retronerve.com';
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash('DemoRetroNerve2026!', 10);
      user = await this.prisma.user.create({
        data: {
          email,
          name: 'Tamu Demo (Afrizal)',
          password: hashedPassword,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
      });
    }

    // Pastikan user memiliki minimal 1 workspace
    let member = await this.prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    });

    let workspaceId = member?.workspaceId;

    if (!workspaceId) {
      const ws = await this.prisma.workspace.create({
        data: {
          name: 'Demo Workspace',
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'owner',
            },
          },
        },
      });
      workspaceId = ws.id;
    }

    // Pastikan workspace memiliki minimal 1 board demo
    let board = await this.prisma.board.findFirst({
      where: { workspaceId },
      include: { columns: true },
    });

    if (!board) {
      board = await this.prisma.board.create({
        data: {
          workspaceId,
          name: 'Sprint 10 Retrospective (Demo)',
          template: 'start-stop-continue',
          isAnonymous: false,
          isRevealed: true,
          voteLimit: 5,
          columns: {
            create: [
              { name: 'What went well (Continue)', order: 1 },
              { name: 'What could be improved (Stop)', order: 2 },
              { name: 'New ideas & experiments (Start)', order: 3 },
            ],
          },
        },
        include: { columns: true },
      });

      // Tambahkan beberapa contoh kartu agar board langsung hidup dan interaktif
      const cols = board.columns;
      if (cols.length >= 3) {
        // Kolom 1 (Continue)
        await this.prisma.card.create({
          data: {
            boardId: board.id,
            columnId: cols[0].id,
            authorId: user.id,
            content: 'Daily standup selalu tepat waktu dan fokus pada blocker penting 👍',
            isRevealed: true,
          },
        });
        await this.prisma.card.create({
          data: {
            boardId: board.id,
            columnId: cols[0].id,
            authorId: user.id,
            content: 'Komunikasi antar tim FE dan BE sangat lancar selama sprint ini 🚀',
            isRevealed: true,
          },
        });

        // Kolom 2 (Stop)
        await this.prisma.card.create({
          data: {
            boardId: board.id,
            columnId: cols[1].id,
            authorId: user.id,
            content: 'Deploy fitur baru mendekati jam pulang kantor tanpa review staging',
            isRevealed: true,
          },
        });

        // Kolom 3 (Start)
        const cardAction = await this.prisma.card.create({
          data: {
            boardId: board.id,
            columnId: cols[2].id,
            authorId: user.id,
            content: 'Mulai buat automated checklist sebelum release ke production',
            isRevealed: true,
          },
        });

        // Buat 1 contoh Action Item dengan Due Date aktif
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);
        await this.prisma.actionItem.create({
          data: {
            cardId: cardAction.id,
            boardId: board.id,
            assigneeId: user.id,
            title: 'Buat automated checklist release production',
            status: 'IN_PROGRESS',
            dueDate,
          },
        });
      }
    }

    const token = await this.generateToken(user.id, user.email);
    const { password: _, ...userWithoutPassword } = user;

    return {
      message: 'Login demo berhasil',
      accessToken: token,
      user: userWithoutPassword,
      boardId: board.id,
      workspaceId,
    };
  }

  /**
   * Private Helper untuk Membuat Access Token JWT
   */
  private async generateToken(userId: string, email: string): Promise<string> {
    const payload = { sub: userId, email };
    return this.jwtService.signAsync(payload);
  }
}
