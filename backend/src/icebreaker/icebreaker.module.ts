import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PusherModule } from '../pusher/pusher.module';
import { IcebreakerController } from './icebreaker.controller';
import { IcebreakerService } from './icebreaker.service';

@Module({
  imports: [PrismaModule, PusherModule],
  controllers: [IcebreakerController],
  providers: [IcebreakerService],
  exports: [IcebreakerService],
})
export class IcebreakerModule {}
