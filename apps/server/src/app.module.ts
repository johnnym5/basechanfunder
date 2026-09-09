import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationController } from './controllers/notification.controller';
import { AdminController } from './controllers/admin.controller';
import { TopUpController } from './controllers/topup.controller';
import { AuthController } from './controllers/auth.controller';
import { MandateController } from './controllers/mandate.controller';
import { LedgerController } from './controllers/ledger.controller';
import { BankLedgerController } from './controllers/bankLedger.controller';
import { StorageController } from './controllers/storage.controller';
import { NotificationService } from './services/notificationService';
import { EmailService } from './services/emailService';
import { MilestoneService } from './services/milestone.service';
import { PdfStampingService } from './services/pdfStampingService';
import { PdfCompilerService } from './services/pdfCompilerService';
import { MandateSyncService } from './services/mandateSync.service';
import { TemplateService } from './services/templateService';
import { StorageService } from './services/storage.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  controllers: [
    NotificationController,
    AdminController,
    TopUpController,
    AuthController,
    MandateController,
    LedgerController,
    BankLedgerController,
    StorageController
  ],
  providers: [
    NotificationService,
    EmailService,
    MilestoneService,
    PdfStampingService,
    PdfCompilerService,
    MandateSyncService,
    TemplateService,
    StorageService
  ],
})
export class AppModule {}
