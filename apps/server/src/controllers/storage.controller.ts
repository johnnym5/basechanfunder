import { Controller, Get, Post, Body, Query, Delete, HttpCode, HttpStatus, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../services/storage.service';

@Controller('api/v1/admin/storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Get('metrics')
  async getMetrics() {
    return this.storageService.getStorageMetrics();
  }

  @Get('list')
  async listItems(@Query('prefix') prefix: string) {
    return this.storageService.listItems(prefix || '');
  }

  @Post('batch-delete')
  @HttpCode(HttpStatus.OK)
  async batchDelete(@Body() body: { paths: string[] }) {
    return this.storageService.batchDelete(body.paths);
  }

  @Get('url')
  async getSignedUrl(@Query('path') path: string) {
    return this.storageService.getSignedUrl(path);
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(@UploadedFiles() files: any[], @Body('prefix') prefix: string) {
    return this.storageService.uploadFiles(files, prefix || '');
  }
}
