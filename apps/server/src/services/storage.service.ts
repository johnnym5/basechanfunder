import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly STORAGE_LIMIT_BYTES = 1073741824; // 1 GB

  private get bucket() {
    return admin.storage().bucket();
  }

  async getStorageMetrics() {
    try {
      const [files] = await this.bucket.getFiles();
      let usedBytes = 0;

      files.forEach(file => {
        const size = file.metadata.size;
        usedBytes += typeof size === 'string' ? parseInt(size) : (Number(size) || 0);
      });

      const usagePercentage = (usedBytes / this.STORAGE_LIMIT_BYTES) * 100;

      return {
        usedBytes,
        limitBytes: this.STORAGE_LIMIT_BYTES,
        usagePercentage: Math.round(usagePercentage * 100) / 100
      };
    } catch (err: any) {
      this.logger.error('Failed to calculate storage metrics:', err);
      throw err;
    }
  }

  async listItems(prefix: string = '') {
    try {
      const [files, , apiResponse] = await this.bucket.getFiles({
        prefix,
        delimiter: '/'
      });

      const folders = ((apiResponse as any).prefixes || []).map((p: string) => ({
        name: p.split('/').slice(-2, -1)[0] + '/',
        path: p,
        type: 'folder'
      }));

      const fileItems = files.map(file => {
        const size = file.metadata.size;
        return {
          name: file.name.split('/').pop(),
          path: file.name,
          size: typeof size === 'string' ? parseInt(size) : (Number(size) || 0),
          type: file.metadata.contentType || 'application/octet-stream',
          updated: file.metadata.updated,
          isImage: (file.metadata.contentType || '').startsWith('image/')
        };
      }).filter(f => f.name !== ''); // Filter out the directory itself if it matches prefix

      return {
        folders,
        files: fileItems
      };
    } catch (err: any) {
      this.logger.error(`Failed to list items for prefix "${prefix}":`, err);
      throw err;
    }
  }

  async batchDelete(paths: string[]) {
    try {
      await Promise.all(paths.map(path => this.bucket.file(path).delete()));
      return { success: true, deletedCount: paths.length };
    } catch (err: any) {
      this.logger.error('Batch delete failed:', err);
      throw err;
    }
  }

  async getSignedUrl(path: string) {
    try {
      const [url] = await this.bucket.file(path).getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 // 1 hour
      });
      return { url };
    } catch (err: any) {
      this.logger.error(`Failed to generate signed URL for "${path}":`, err);
      throw err;
    }
  }

  async uploadFiles(files: any[], prefix: string) {
    try {
      const results = await Promise.all(files.map(async (file) => {
        const destination = prefix + file.originalname;
        await this.bucket.file(destination).save(file.buffer, {
          contentType: file.mimetype,
          resumable: false
        });
        return { name: file.originalname, path: destination };
      }));
      return { success: true, files: results };
    } catch (err: any) {
      this.logger.error('Upload failed:', err);
      throw err;
    }
  }
}
