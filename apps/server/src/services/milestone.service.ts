import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as admin from 'firebase-admin';
import { EmailService } from './emailService';

@Injectable()
export class MilestoneService {
  private readonly logger = new Logger(MilestoneService.name);
  private readonly db = admin.firestore();

  constructor(private readonly emailService: EmailService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyMilestones() {
    this.logger.log('Starting daily milestone evaluation...');

    const now = new Date();

    // Query users with an active holding start date
    const usersSnapshot = await this.db.collection('users')
      .where('holdingStartDate', '!=', null)
      .get();

    this.logger.log(`Evaluating ${usersSnapshot.size} active users...`);

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const holdingStart = userData.holdingStartDate.toDate();
      const diffTime = Math.abs(now.getTime() - holdingStart.getTime());
      const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // We only send emails at specific milestones
      if ([1, 14, 28].includes(daysElapsed)) {
        this.logger.log(`User ${doc.id} reached Day ${daysElapsed} milestone.`);

        await this.emailService.sendHoldingMilestoneEmail(
          userData.email,
          userData.displayName || 'Student',
          daysElapsed
        );

        if (daysElapsed === 28) {
          // Trigger PoF generation logic here in the future
          await this.emailService.sendPofCertificateReadyEmail(
            userData.email,
            userData.displayName || 'Student'
          );
        }
      }
    }

    this.logger.log('Daily milestone evaluation complete.');
  }
}
