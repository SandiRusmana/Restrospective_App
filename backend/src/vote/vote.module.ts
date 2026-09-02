import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PusherModule } from '../pusher/pusher.module';
import { VoteController } from './vote.controller';
import { VoteService } from './vote.service';

@Module({
  imports: [PrismaModule, PusherModule],
  controllers: [VoteController],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}
