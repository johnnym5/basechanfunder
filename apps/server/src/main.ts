import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function bootstrap() {
  // Load environment variables from root .env
  const rootDir = path.join(__dirname, '../../../');
  dotenv.config({ path: path.join(rootDir, '.env') });

  // Initialize Firebase Admin once
  if (!admin.apps.length) {
    const serviceAccountPath = path.join(rootDir, 'service-account.json');

    const config: admin.AppOptions = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'basechanfunder',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'basechanfunder.firebasestorage.app'
    };

    try {
      // Prefer explicit service account file for local dev and production stability
      if (require('fs').existsSync(serviceAccountPath)) {
        config.credential = admin.credential.cert(serviceAccountPath);
        Logger.log('🔑 Using explicit Service Account Key', 'Bootstrap');
      } else {
        Logger.warn('⚠️ No service-account.json found. Falling back to Application Default Credentials.', 'Bootstrap');
      }

      admin.initializeApp(config);
      Logger.log('🔥 Firebase Admin initialized', 'Bootstrap');
    } catch (err: any) {
      Logger.error(`❌ Firebase Admin init failed: ${err.message}`, 'Bootstrap');
    }
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
