import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.CLIENT,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });
  app.use(cookieParser());
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
