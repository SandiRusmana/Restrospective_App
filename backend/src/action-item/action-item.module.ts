import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PusherModule } from '../pusher/pusher.module';
import { ActionItemController } from './action-item.controller';
import { ActionItemService } from './action-item.service';

@Module({
  imports: [PrismaModule, PusherModule],
  controllers: [ActionItemController],
  providers: [ActionItemService],
  exports: [ActionItemService],
})
export class ActionItemModule {}
