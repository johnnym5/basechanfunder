import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend development
  app.enableCors();

  // Set global prefix to match the fetch calls from frontend
  // app.setGlobalPrefix('api/v1');
  // Wait, looking at the controllers, some already have @Controller('api/v1/...')
  // and some have @Controller('api/v1').
  // Let's check AdminController again.

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Server running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
