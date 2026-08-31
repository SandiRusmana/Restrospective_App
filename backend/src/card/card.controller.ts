import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';

@UseGuards(JwtAuthGuard)
@Controller('boards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post(':id/cards')
  async createCard(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
    @Body() createCardDto: CreateCardDto,
  ) {
    return this.cardService.createCard(userId, boardId, createCardDto);
  }

  @Get(':id/cards')
  async getBoardCards(
    @GetUser('id') userId: string,
    @Param('id') boardId: string,
  ) {
    return this.cardService.getBoardCards(userId, boardId);
  }
}
