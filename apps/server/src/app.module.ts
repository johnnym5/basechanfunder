import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationController } from './controllers/notification.controller';
import { AdminController } from './controllers/admin.controller';
import { TopUpController } from './controllers/topup.controller';
import { AuthController } from './controllers/auth.controller';
import { NotificationService } from './services/notificationService';
import { EmailService } from './services/emailService';
import { MilestoneService } from './services/milestone.service';
import { PurgeService } from './services/purge.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationController, AdminController, TopUpController, AuthController],
  providers: [NotificationService, EmailService, MilestoneService, PurgeService],
})
export class AppModule {}
