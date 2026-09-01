import { Global, Module } from '@nestjs/common';
import { PusherService } from './pusher.service';
import { PusherController } from './pusher.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [PusherController],
  providers: [PusherService],
  exports: [PusherService],
})
export class PusherModule {}
