import { Module } from '@nestjs/common';

import { FileService } from './file.service';
import { FileController } from './file.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [FileController],
  providers: [FileService, PrismaService],
})
export class FileModule {}
