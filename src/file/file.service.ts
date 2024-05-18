import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';
import { CreateFileDto } from './dto/create-file.dto';

@Injectable()
export class FileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFileDto: CreateFileDto) {
    return await this.prisma.file.create({
      data: createFileDto,
    });
  }
}
