import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const PORT = process.env.PORT || 5003;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Todo - Add the whitelist of the allowed origins
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // This will remove any additional properties that are not defined in the DTO
      exceptionFactory: (errors) => {
        // eslint-disable-next-line no-console
        console.error('Validation errors:', JSON.stringify(errors));
        return new BadRequestException(errors);
      },
    }),
  );

  await app.listen(PORT);
}

bootstrap().then(() => {
  // eslint-disable-next-line no-console
  console.log('Application is up and running on port', PORT);
});
