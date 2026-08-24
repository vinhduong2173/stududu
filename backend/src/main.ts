import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, raw, urlencoded } from 'express';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  // bodyParser: false — tự đăng ký để nới giới hạn 100kb mặc định
  // (ảnh đại diện gửi dạng data URL đã nén ~vài trăm KB)
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // SRS §7.3 — webhook thanh toán cần raw body để verify chữ ký cổng.
  // Phải đăng ký TRƯỚC bộ parse JSON chung, nếu không body đã bị parse mất.
  app.use('/webhooks', raw({ type: 'application/json', limit: '1mb' }));

  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ limit: '2mb', extended: true }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://localhost:3002'],
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
// Server restarted with join approvals, notifications & member reporting



