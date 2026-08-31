import { Module } from '@nestjs/common';
<<<<<<< HEAD
=======
import { PrismaModule } from '../prisma/prisma.module';
import { PusherModule } from '../pusher/pusher.module';
>>>>>>> 3e52db1 (fitur template)
import { BoardController } from './board.controller';
import { BoardService } from './board.service';

@Module({
<<<<<<< HEAD
=======
  imports: [PrismaModule, PusherModule],
>>>>>>> 3e52db1 (fitur template)
  controllers: [BoardController],
  providers: [BoardService],
  exports: [BoardService],
})
export class BoardModule {}
