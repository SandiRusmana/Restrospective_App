import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VoteService } from './vote.service';

@UseGuards(JwtAuthGuard)
@Controller('cards/:id/vote')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  /**
   * Menambahkan vote pada card
   * Route: POST /api/cards/:id/vote
   */
  @Post()
  async vote(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
  ) {
    return this.voteService.vote(userId, cardId);
  }

  /**
   * Menghapus vote pada card (Unvote)
   * Route: DELETE /api/cards/:id/vote
   */
  @Delete()
  async unvote(
    @GetUser('id') userId: string,
    @Param('id') cardId: string,
  ) {
    return this.voteService.unvote(userId, cardId);
  }
}
