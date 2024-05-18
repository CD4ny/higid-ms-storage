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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { unlinkSync, existsSync } from 'fs';

import { FileService } from './file.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { DeleteFilesDto } from './dto/delete-files.dto';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads',
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
    @Body() uploadFileDto: UploadFileDto,
  ) {
    const filePublicPathSpit = file.path.split('/');
    filePublicPathSpit.shift();
    const filePublicPath = filePublicPathSpit.join('/');

    await this.fileService.create({
      name: file.filename,
      path: filePublicPath,
      mimeType: file.mimetype,
      size: file.size,
      owner: uploadFileDto.userId,
    });

    return {
      message: 'Archivo cargado exitosamente',
      filePath: filePublicPath,
      fileName: file.filename,
      uploadFileDto,
    };
  }

  @Delete(':file')
  deleteFile(@Param('file') fileName: string) {
    try {
      // todo: ver como acceder a la carpeta public
      const filePath = join(__dirname, '../..', 'public', 'uploads', fileName);

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
      // todo: ver como acceder a la carpeta public
      deleteFilesDto.filesNames.forEach((fileName) => {
        const path = join(__dirname, '../..', 'public', 'uploads', fileName);

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
