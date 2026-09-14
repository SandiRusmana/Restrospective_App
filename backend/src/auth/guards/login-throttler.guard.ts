import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

@Injectable()
export class LoginThrottlerGuard implements CanActivate {
  private static attemptsMap = new Map<string, AttemptRecord>();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 menit
  private static readonly LOCK_MS = 15 * 60 * 1000; // Kunci 15 menit

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIp(request);
    const email = request.body?.email ? String(request.body.email).toLowerCase().trim() : '';

    const keysToCheck = [
      `ip_${ip}`,
      ...(email ? [`acc_${email}`] : []),
    ];

    const now = Date.now();

    for (const key of keysToCheck) {
      const record = LoginThrottlerGuard.attemptsMap.get(key);
      if (record && record.lockedUntil && record.lockedUntil > now) {
        const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Terlalu banyak percobaan login yang gagal. Akun/IP Anda ditahan sementara demi keamanan. Silakan coba lagi dalam ${remainingMinutes} menit.`,
            error: 'Too Many Requests',
            remainingMinutes,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return true;
  }

  /**
   * Catat upaya login gagal
   */
  static recordFailure(ip: string, email?: string) {
    const now = Date.now();
    const keys = [
      `ip_${ip}`,
      ...(email ? [`acc_${email.toLowerCase().trim()}`] : []),
    ];

    for (const key of keys) {
      const record = this.attemptsMap.get(key);
      if (!record || now - record.firstAttemptAt > this.WINDOW_MS) {
        this.attemptsMap.set(key, {
          count: 1,
          firstAttemptAt: now,
        });
      } else {
        record.count += 1;
        if (record.count >= this.MAX_ATTEMPTS) {
          record.lockedUntil = now + this.LOCK_MS;
        }
      }
    }
  }

  /**
   * Reset hitungan saat login berhasil
   */
  static resetSuccess(ip: string, email?: string) {
    this.attemptsMap.delete(`ip_${ip}`);
    if (email) {
      this.attemptsMap.delete(`acc_${email.toLowerCase().trim()}`);
    }
  }

  private getClientIp(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.ip ||
      req.connection?.remoteAddress ||
      '127.0.0.1'
    );
  }
}
