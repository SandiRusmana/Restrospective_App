import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PusherModule } from '../pusher/pusher.module';
import { TimerController } from './timer.controller';
import { TimerService } from './timer.service';

@Module({
  imports: [PrismaModule, PusherModule],
  controllers: [TimerController],
  providers: [TimerService],
  exports: [TimerService],
})
export class TimerModule {}
