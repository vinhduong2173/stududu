import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
