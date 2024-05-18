import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
      // eslint-disable-next-line no-console
      console.info('Database connected');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Database connection failed: \n', error.message);
    }
  }
}
