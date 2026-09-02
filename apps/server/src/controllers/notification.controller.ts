import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationService } from '../services/notificationService';

@Controller('api/v1/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('register-device')
  @HttpCode(HttpStatus.OK)
  async registerDevice(
    @Body() body: { userId: string; deviceToken: string; platform: 'ANDROID' | 'IOS' | 'WEB' }
  ) {
    return this.notificationService.registerDevice(body.userId, body.deviceToken, body.platform);
  }

  // Debug/Internal endpoint to trigger notifications
  @Post('test-send')
  @HttpCode(HttpStatus.OK)
  async testSend(
    @Body() body: { userId: string; title: string; body: string; data?: any }
  ) {
    return this.notificationService.sendInteractiveNotification(body.userId, {
      title: body.title,
      body: body.body,
      data: body.data
    });
  }
}
