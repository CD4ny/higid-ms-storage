import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { join } from 'path';
import { createReadStream, readdirSync, statSync } from 'fs';

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

  public async streamImage(name: string, request: Request, response: Response) {
    const userId = request['user']?.id;

    if (!userId) {
      throw new BadRequestException('Must provide user id');
    }

    const isValidImage = await this.isValidFile(name, userId, 'image');

    if (!isValidImage) {
      throw new NotFoundException('La imagen no existe');
    }

    // TODO: investigar como acceder a la carpeta uploads sin tener que hacer ../../
    const filePath = join(__dirname, '../../', `uploads/images/${name}`);

    return response.sendFile(filePath);
  }

  // public async streamVideo(name: string, response: Response, request: Request) {
  //   const userId = request['user']?.id;

  //   if (!userId) {
  //     throw new BadRequestException('Must provide user id');
  //   }

  //   const isValidVideo = await this.isValidFile(name, userId, 'video');

  //   if (!isValidVideo) {
  //     throw new HttpException('El video no existe', HttpStatus.NOT_FOUND);
  //   }

  //   const { range } = request.headers;

  //   if (!range) {
  //     throw new NotFoundException('range not found');
  //   }

  //   const path = `uploads/videos/${name}`;
  //   const videoSize = statSync(path).size;
  //   const chunksize = 1 * 1e6;
  //   const start = Number(range.replace(/\D/g, ''));
  //   const end = Math.min(start + chunksize, videoSize - 1);
  //   const contentLength = end - start + 1;

  //   const headers = {
  //     'Content-Range': `bytes ${start}-${end}/${videoSize}`,
  //     'Accept-Ranges': 'bytes',
  //     'Content-Length': contentLength,
  //     'Content-Type': 'video/mp4',
  //   };

  //   response.writeHead(206, headers);

  //   const stream = createReadStream(path, { start, end });

  //   stream.pipe(response);
  // }

  public async streamVideoWithToken(
    name: string,
    token: string,
    response: Response,
    request: Request,
  ) {
    if (!token) throw new BadRequestException('Must provide token');
    const userId = request['user']?.id;

    const isValidVideo = await this.isValidFile(name, userId, 'video');

    if (!isValidVideo) {
      throw new HttpException('El video no existe', HttpStatus.NOT_FOUND);
    }

    const { range } = request.headers;

    if (!range) {
      throw new NotFoundException('range not found');
    }

    const path = `uploads/videos/${name}`;
    const videoSize = statSync(path).size;
    const chunksize = 1 * 1e6;
    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + chunksize, videoSize - 1);
    const contentLength = end - start + 1;

    const headers = {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': 'video/mp4',
    };

    response.writeHead(206, headers);

    const stream = createReadStream(path, { start, end });

    stream.pipe(response);
  }

  private async isValidFile(
    name: string,
    owner: string,
    type: 'image' | 'video',
  ) {
    const file = await this.prisma.file.findFirst({
      where: {
        name,
        owner,
      },
    });

    if (!file) return false;

    let path = 'uploads/';

    switch (type) {
      case 'image':
        path += 'images';
        break;
      case 'video':
        path += 'videos';
        break;
    }

    const allFiles: Array<string> = readdirSync(path);

    return allFiles.includes(name);
  }
}
