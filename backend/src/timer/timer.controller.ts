import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateDurationDto } from './dto/update-duration.dto';
import { TimerService } from './timer.service';

@UseGuards(JwtAuthGuard)
@Controller('boards/:id/timer')
export class TimerController {
  constructor(private readonly timerService: TimerService) {}

  /**
   * Endpoint: GET /api/boards/:id/timer
   * Mengambil status timer terkini untuk board tertentu
   */
  @Get()
  async getTimer(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.timerService.getTimer(userId, boardId);
  }

  /**
   * Endpoint: POST /api/boards/:id/timer/start
   * Memulai atau melanjutkan timer
   */
  @Post('start')
  async startTimer(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.timerService.startTimer(userId, boardId);
  }

  /**
   * Endpoint: POST /api/boards/:id/timer/pause
   * Menjeda timer yang sedang berjalan
   */
  @Post('pause')
  async pauseTimer(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.timerService.pauseTimer(userId, boardId);
  }

  /**
   * Endpoint: POST /api/boards/:id/timer/reset
   * Mereset timer ke durasi awal
   */
  @Post('reset')
  async resetTimer(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.timerService.resetTimer(userId, boardId);
  }

  /**
   * Endpoint: PATCH /api/boards/:id/timer/duration
   * Mengubah durasi timer (preset 1m, 3m, 5m, 10m, 15m, 20m, dll)
   */
  @Patch('duration')
  async updateDuration(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
    @Body() updateDurationDto: UpdateDurationDto,
  ) {
    return this.timerService.updateDuration(userId, boardId, updateDurationDto);
  }
}
