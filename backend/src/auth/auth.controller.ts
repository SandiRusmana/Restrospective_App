import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout() {
    return this.authService.logout();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@GetUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  /**
   * Endpoint: GET /api/auth/google
   * Membuka halaman login Google OAuth
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Di-handle secara otomatis oleh Passport Google Strategy
  }

  /**
   * Endpoint: GET /api/auth/google/callback
   * Menangani redirect kembali dari Google dan meneruskan JWT ke Frontend
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const token = req.user?.accessToken;

    if (!token) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    return res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  }
}

