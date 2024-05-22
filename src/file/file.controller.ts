import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Delete,
  Param,
  HttpStatus,
  HttpException,
  Get,
  Response,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response as IResponse, Request } from 'express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { unlinkSync, existsSync } from 'fs';

import { FileService } from './file.service';
import { DeleteFilesDto } from './dto/delete-files.dto';
import { AuthGuard } from 'src/auth.guard';

@UseGuards(AuthGuard)
@Controller()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('video/:name')
  streamVideo(
    @Param('name') name: string,
    @Response() response: IResponse,
    @Req() request: Request,
  ) {
    this.fileService.streamVideo(name, response, request);
  }

  @Get('image/:name')
  async streamImage(
    @Param('name') name: string,
    @Req() request: Request,
    @Response() response: IResponse,
  ) {
    await this.fileService.streamImage(name, request, response);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/images',
        filename: function (req, file, cb) {
          const fieldNameSplit = file.originalname.split('.');
          const ext = fieldNameSplit.pop();
          const fieldName = fieldNameSplit.join('.');

          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, fieldName + '-' + uniqueSuffix + '.' + ext);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const data = req.body;
    if (!req['user']?.id)
      throw new HttpException('Must provide user id', HttpStatus.NOT_FOUND);

    if (!file) return { data };

    await this.fileService.create({
      name: file.filename,
      path: 'image/' + file.filename,
      mimeType: file.mimetype,
      size: file.size,
      owner: req['user']?.id,
    });

    return {
      message: 'Archivo cargado exitosamente',
      data: { ...data, filePath: 'image/' + file.filename },
    };
  }

  @Delete(':file')
  async deleteFile(@Param('file') fileName: string) {
    try {
      const filePath = join(__dirname, '../..', 'uploads', fileName);

      if (!existsSync(filePath)) {
        throw new HttpException('El archivo no existe', HttpStatus.NOT_FOUND);
      }

      unlinkSync(filePath);

      return {
        message: 'Archivo eliminado exitosamente',
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        'Error al eliminar el archivo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete()
  deleteFiles(@Body() deleteFilesDto: DeleteFilesDto) {
    try {
      deleteFilesDto.filesNames.forEach((fileName) => {
        const path = join(__dirname, '../..', 'uploads', fileName);

        if (existsSync(path)) {
          unlinkSync(path);
        }
      });

      return {
        message: 'Archivos eliminados exitosamente',
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        'Error al eliminar el archivo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
