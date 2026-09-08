import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

async function run() {
  dotenv.config({ path: path.join(__dirname, '../../../../.env') });

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  }

  const bucket = admin.storage().bucket();
  const localPath = "C:\\Users\\HP\\Downloads\\Upgrade Form.pdf";
  const remotePath = "system_assets/templates/Upgrade_Form.pdf";

  console.log(`Uploading ${localPath} to gs://${process.env.FIREBASE_STORAGE_BUCKET}/${remotePath}...`);

  if (!fs.existsSync(localPath)) {
    console.error("Local file not found!");
    process.exit(1);
  }

  try {
    await bucket.upload(localPath, {
      destination: remotePath,
      metadata: {
        contentType: 'application/pdf',
      },
    });
    console.log("✅ Upload successful!");
  } catch (err) {
    console.error("❌ Upload failed:", err);
  }
}

run();
