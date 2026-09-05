import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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
    const { email, password, name } = registerDto;

    // Cek apakah email sudah terdaftar
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar. Silakan gunakan email lain.');
    }

    // Hashing password dengan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru ke database
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
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
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Cari user berdasarkan email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

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
   * Private Helper untuk Membuat Access Token JWT
   */
  private async generateToken(userId: string, email: string): Promise<string> {
    const payload = { sub: userId, email };
    return this.jwtService.signAsync(payload);
  }
}
