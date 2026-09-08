import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  async getUpgradeForm(): Promise<Buffer> {
    const cloudPath = 'system_assets/Upgrade Form.pdf';

    // Attempt to find the local file across common relative structures
    const possiblePaths = [
      path.resolve(process.cwd(), 'assets/Upgrade_Form.pdf'),
      path.resolve(process.cwd(), 'apps/server/assets/Upgrade_Form.pdf'),
      path.resolve(__dirname, '../../assets/Upgrade_Form.pdf'),
      path.resolve(__dirname, '../../../assets/Upgrade_Form.pdf'),
      path.resolve(__dirname, '../../../../assets/Upgrade_Form.pdf'),
      "C:\\Users\\HP\\Downloads\\Upgrade Form.pdf"
    ];

    try {
      // 1. Try Firebase Storage (Primary)
      const bucket = admin.storage().bucket();
      const file = bucket.file(cloudPath);
      const [exists] = await file.exists();

      if (exists) {
        this.logger.log('Serving Upgrade Form from Cloud Storage');
        const [buffer] = await file.download();
        return buffer;
      }
    } catch (err) {
      this.logger.warn(`Cloud storage fetch failed: ${err.message}. Switching to local fallback.`);
    }

    // 2. Fallback to Local Filesystem
    for (const localPath of possiblePaths) {
      if (fs.existsSync(localPath)) {
        this.logger.log(`Serving Upgrade Form from local filesystem: ${localPath}`);
        return fs.readFileSync(localPath);
      }
    }

    this.logger.error('Upgrade Form template not found in any location.');
    throw new NotFoundException('Template file missing (Checked Storage and Local Assets)');
  }
}
