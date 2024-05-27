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
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response as IResponse, Request } from 'express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { unlinkSync, existsSync } from 'fs';

import { FileService } from './file.service';
import { DeleteFilesDto } from './dto/delete-files.dto';
import { AuthGuard } from 'src/auth.guard';

import {
  generateRandomFileName,
  getFileLocationByName,
  getFilePathByName,
} from 'src/utils/files';
import axios from 'axios';

@Controller()
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private jwtService: JwtService,
  ) {}

  // @Get('video/:name')
  // @UseGuards(AuthGuard)
  // async streamVideo(
  //   @Param('name') name: string,
  //   @Response() response: IResponse,
  //   @Req() request: Request,
  // ) {
  //   await this.fileService.streamVideo(name, response, request);
  // }

  @Get('video/:name/:token')
  async streamVideoWithTokenParam(
    @Param('token') token: string,
    @Param('name') name: string,
    @Response() response: IResponse,
    @Req() request: Request,
  ) {
    try {
      const res = await axios.get(`${process.env.API_GATEWAY}/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!token || res.status != 200) {
        throw new UnauthorizedException();
      }

      request['user'] = res.data;
    } catch (error) {
      if (error.name === 'TokenExpiredError') throw new ForbiddenException();
      throw new UnauthorizedException();
    }

    await this.fileService.streamVideoWithToken(name, token, response, request);
  }

  @Get('image/:name')
  @UseGuards(AuthGuard)
  async streamImage(
    @Param('name') name: string,
    @Req() request: Request,
    @Response() response: IResponse,
  ) {
    await this.fileService.streamImage(name, request, response);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_, file, cb) => {
          cb(null, getFileLocationByName(file.originalname));
        },
        filename: function (_, file, cb) {
          cb(null, generateRandomFileName(file.originalname));
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

    const path = getFilePathByName(file.filename);
    await this.fileService.create({
      name: file.filename,
      path,
      mimeType: file.mimetype,
      size: file.size,
      owner: req['user']?.id,
    });

    return {
      message: 'Archivo cargado exitosamente',
      data: { ...data, filePath: path },
    };
  }

  @Delete(':file')
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
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
