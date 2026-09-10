import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IcebreakerGameType, IcebreakerService } from './icebreaker.service';

@UseGuards(JwtAuthGuard)
@Controller('boards/:id/icebreaker')
export class IcebreakerController {
  constructor(private readonly icebreakerService: IcebreakerService) {}

  /**
   * Memulai Game Icebreaker (Fasilitator)
   * POST /api/boards/:id/icebreaker/start
   */
  @Post('start')
  async startIcebreaker(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
    @Body() body: { gameType: IcebreakerGameType; totalQuestions?: number },
  ) {
    const gameType = body?.gameType || 'fakta-hoaks';
    const totalQuestions = body?.totalQuestions || 5;
    return this.icebreakerService.startIcebreaker(userId, boardId, gameType, totalQuestions);
  }

  /**
   * Submit Vote / Pilihan Peserta
   * POST /api/boards/:id/icebreaker/vote
   */
  @Post('vote')
  async submitVote(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
    @Body() body: { optionId: string },
  ) {
    return this.icebreakerService.submitVote(userId, boardId, body.optionId);
  }

  /**
   * Buka Kunci Jawaban / Reveal (Fasilitator)
   * POST /api/boards/:id/icebreaker/reveal
   */
  @Post('reveal')
  async revealAnswer(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.icebreakerService.revealAnswer(userId, boardId);
  }

  /**
   * Skip Pertanyaan / Ronde (Fasilitator)
   * POST /api/boards/:id/icebreaker/skip
   */
  @Post('skip')
  async skipIcebreaker(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.icebreakerService.skipIcebreaker(userId, boardId);
  }

  /**
   * Mengakhiri Game Icebreaker (Fasilitator)
   * POST /api/boards/:id/icebreaker/end
   */
  @Post('end')
  async endIcebreaker(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.icebreakerService.endIcebreaker(userId, boardId);
  }

  /**
   * Cek Status / State Game Icebreaker Saat Ini
   * GET /api/boards/:id/icebreaker/state
   */
  @Get('state')
  async getIcebreakerState(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.icebreakerService.getIcebreakerState(userId, boardId);
  }
}
