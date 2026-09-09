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
    const altServiceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

    const config: admin.AppOptions = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'basechanfunder',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'basechanfunder.firebasestorage.app'
    };

    try {
      // 1. Try root service-account.json
      if (require('fs').existsSync(serviceAccountPath)) {
        config.credential = admin.credential.cert(serviceAccountPath);
        Logger.log('🔑 Using root Service Account Key', 'Bootstrap');
      }
      // 2. Try server-local serviceAccountKey.json (Requirement specific)
      else if (require('fs').existsSync(altServiceAccountPath)) {
        config.credential = admin.credential.cert(altServiceAccountPath);
        Logger.log('🔑 Using server-local Service Account Key', 'Bootstrap');
      }
      else {
        Logger.warn('⚠️ No service account JSON found. Falling back to Application Default Credentials.', 'Bootstrap');
      }

      const app = admin.initializeApp(config);
      const defaultDbId = process.env.FIRESTORE_DATABASE_ID || 'basechanfunder';
      const { getFirestore } = require('firebase-admin/firestore');
      try {
        (app as any).firestore = function (databaseId?: string) {
          return getFirestore(app, databaseId || defaultDbId);
        };
        const origFirestore = admin.firestore;
        const firestoreFn = function (appOrDb?: any) {
          if (typeof appOrDb === 'string') {
            return getFirestore(admin.app(), appOrDb);
          }
          return getFirestore(appOrDb || admin.app(), defaultDbId);
        };
        Object.assign(firestoreFn, origFirestore);
        Object.defineProperty(admin, 'firestore', {
          value: firestoreFn,
          configurable: true,
          writable: true,
        });
      } catch (err: any) {
        Logger.warn(`Firestore default db routing skipped: ${err.message}`, 'Bootstrap');
      }

      Logger.log(`🔥 Firebase Admin initialized (Firestore DB: ${defaultDbId})`, 'Bootstrap');
    } catch (err: any) {
      if (err.message?.includes('invalid_rapt') || err.message?.includes('invalid_grant')) {
        Logger.error('❌ Firebase Auth Error: Your local session has expired.', 'Bootstrap');
        Logger.error('👉 SOLUTION: Run "gcloud auth application-default login" in your terminal.', 'Bootstrap');
      } else {
        Logger.error(`❌ Firebase Admin init failed: ${err.message}`, 'Bootstrap');
      }
    }
  }

  // Detect SSL Certificates for Local HTTPS Development
  const sslKeyPath = path.join(__dirname, '../key.pem');
  const sslCertPath = path.join(__dirname, '../cert.pem');
  let httpsOptions = null;

  if (require('fs').existsSync(sslKeyPath) && require('fs').existsSync(sslCertPath)) {
    httpsOptions = {
      key: require('fs').readFileSync(sslKeyPath),
      cert: require('fs').readFileSync(sslCertPath),
    };
    Logger.log('🛡️ SSL Certificates detected. Enabling HTTPS.', 'Bootstrap');
  }

  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  // Enable CORS for frontend development
  app.enableCors();

  // Set global prefix to match the fetch calls from frontend
  // app.setGlobalPrefix('api/v1');
  // Wait, looking at the controllers, some already have @Controller('api/v1/...')
  // and some have @Controller('api/v1').
  // Let's check AdminController again.

  // Triggering server reload to register new storage routes...
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Server running on http://0.0.0.0:${port}`, 'Bootstrap');
}
bootstrap();
