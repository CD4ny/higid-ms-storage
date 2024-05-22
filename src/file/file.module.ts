import { Module } from '@nestjs/common';

import { FileService } from './file.service';
import { FileController } from './file.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthGuard } from 'src/auth.guard';

@Module({
  controllers: [FileController],
  providers: [FileService, PrismaService, AuthGuard],
})
export class FileModule {}
