import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;

  constructor() {
    // In production, this would come from an environment variable or config service
    const apiKey = process.env.RESEND_API_KEY || 're_123456789';
    this.resend = new Resend(apiKey);
  }

  private getGlassmorphicTemplate(content: string, title: string) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            margin: 0;
            padding: 40px 20px;
            font-family: 'Inter', -apple-system, sans-serif;
            color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .logo {
            margin-bottom: 30px;
            font-weight: 900;
            letter-spacing: -0.05em;
            font-size: 24px;
            color: #3b82f6;
            text-transform: uppercase;
          }
          .title {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 20px;
            line-height: 1.2;
            color: #ffffff;
          }
          .content {
            font-size: 16px;
            line-height: 1.6;
            color: #cbd5e1;
            margin-bottom: 30px;
          }
          .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #64748b;
            text-align: center;
          }
          .btn {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Basechanfunder</div>
          <div class="title">${title}</div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Basechanfunder Compliance Engine. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendTopUpApprovedEmail(userEmail: string, userName: string, amount: number) {
    const title = 'Wallet Top-Up Approved';
    const content = `
      Hi ${userName},<br><br>
      Good news! Your wallet top-up of <b>₦${amount.toLocaleString()}</b> has been successfully verified and credited to your account.
      <br><br>
      <a href="https://app.basechanfunder.com" class="btn">View Dashboard</a>
    `;
    return this.sendEmail(userEmail, title, content);
  }

  async sendCapitalEncroachmentAlert(userEmail: string, userName: string, requiredFloor: number, currentBalance: number) {
    const title = '⚠️ URGENT: Capital Encroachment Alert';
    const content = `
      Hi ${userName},<br><br>
      Our compliance engine has detected that your account balance has dropped below the required capital floor.
      <br><br>
      <b>Required Floor:</b> ₦${requiredFloor.toLocaleString()}<br>
      <b>Current Balance:</b> ₦${currentBalance.toLocaleString()}<br><br>
      Please top up your account immediately to maintain your compliance status and prevent timer pause.
    `;
    return this.sendEmail(userEmail, title, content);
  }

  async sendHoldingMilestoneEmail(userEmail: string, userName: string, dayCount: number) {
    const title = `Milestone Reached: Day ${dayCount}`;
    const content = `
      Hi ${userName},<br><br>
      Congratulations! You have successfully maintained your account balance for <b>${dayCount} days</b>.
      <br><br>
      ${dayCount === 28 ? 'Your Proof of Funds certificate is now being generated.' : 'Keep it up to reach your 28-day milestone!'}
    `;
    return this.sendEmail(userEmail, title, content);
  }

  async sendPofCertificateReadyEmail(userEmail: string, userName: string) {
    const title = 'PoF Certificate Ready';
    const content = `
      Hi ${userName},<br><br>
      Your Proof of Funds certificate is ready and available for download.
      <br><br>
      <a href="https://app.basechanfunder.com/certificates" class="btn">Download Certificate</a>
    `;
    return this.sendEmail(userEmail, title, content);
  }

  async sendStaleAccountWarningEmail(userEmail: string, userName: string) {
    const title = 'Inactivity Warning';
    const content = `
      Hi ${userName},<br><br>
      We haven't seen a balance update for your linked accounts in over 48 hours. Please ensure your SMS synchronization app is active to maintain compliance.
    `;
    return this.sendEmail(userEmail, title, content);
  }

  private async sendEmail(to: string, title: string, content: string) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Basechanfunder <alerts@basechanfunder.com>',
        to: [to],
        subject: title,
        html: this.getGlassmorphicTemplate(content, title),
      });

      if (error) {
        this.logger.error(`Resend error: ${JSON.stringify(error)}`);
        return { success: false, error };
      }

      this.logger.log(`Email sent successfully: ${data?.id}`);
      return { success: true, id: data?.id };
    } catch (err) {
      this.logger.error(`Failed to send email: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
