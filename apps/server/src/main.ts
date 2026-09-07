import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function bootstrap() {
  // Load environment variables from root .env
  dotenv.config({ path: path.join(__dirname, '../../../.env') });

  // Initialize Firebase Admin once
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'basechanfunder',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'basechanfunder.firebasestorage.app'
    });
    Logger.log('🔥 Firebase Admin initialized', 'Bootstrap');
  }

  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend development
  app.enableCors();

  // Set global prefix to match the fetch calls from frontend
  // app.setGlobalPrefix('api/v1');
  // Wait, looking at the controllers, some already have @Controller('api/v1/...')
  // and some have @Controller('api/v1').
  // Let's check AdminController again.

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Server running on http://0.0.0.0:${port}`, 'Bootstrap');
}
bootstrap();
