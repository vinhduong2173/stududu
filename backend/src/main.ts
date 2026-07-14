import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  // bodyParser: false — tự đăng ký để nới giới hạn 100kb mặc định
  // (ảnh đại diện gửi dạng data URL đã nén ~vài trăm KB)
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ limit: '2mb', extended: true }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // loại field lạ khỏi payload
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
