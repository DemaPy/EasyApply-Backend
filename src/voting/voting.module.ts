import { Module } from '@nestjs/common';
import { VotingController } from './voting.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [VotingController],
  providers: [PrismaService],
})
export class VotingModule {}
