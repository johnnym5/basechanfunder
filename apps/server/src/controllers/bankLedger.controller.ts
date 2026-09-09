import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

@Controller('api/v1/accounts')
export class BankLedgerController {
  private readonly logger = new Logger(BankLedgerController.name);
  private get db() {
    return getFirestore(admin.app(), 'basechanfunder');
  }

  @Post('sms-sync')
  @HttpCode(HttpStatus.OK)
  async syncSmsBalance(@Body() body: { userId: string, balance: number, accountMask: string, timestamp: number }) {
    const { userId, balance, accountMask, timestamp } = body;

    if (!userId || balance === undefined || !accountMask) {
      return { status: 'ERROR', message: 'Missing required sync fields' };
    }

    this.logger.log(`AUTHORITATIVE SPLIT SYNC for user ${userId}: Raw Bal ₦${balance.toLocaleString()}`);

    try {
      const userRef = this.db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) throw new Error('User not found');

      const userData = userDoc.data() || {};
      const approvedCapital = Number(userData.approvedCapitalNgn || userData.topUpAmountNgn || 0);

      // 1. Calculate Authoritative Split
      const personalBal = Math.max(0, balance - approvedCapital);
      const topUpBal = approvedCapital;

      const batch = this.db.batch();

      // 2. Find and update the specific personal account
      const accountsSnap = await this.db.collection('financial_accounts')
        .where('userId', '==', userId)
        .get();

      let matchedAccId = '';
      for (const doc of accountsSnap.docs) {
        const data = doc.data();
        if (doc.id.startsWith('TOPUP_')) continue;
        if (data.connectionMethod === 'TOP_UP') continue;

        // Match by last 4 digits
        if (data.accountNumberMasked?.endsWith(accountMask)) {
          matchedAccId = doc.id;
          batch.set(doc.ref, {
            accountBalanceNgn: personalBal,
            balanceNgn: personalBal,
            balanceGbp: personalBal / 1945.50,
            lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'VERIFIED',
            isVerified: true,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          break;
        }
      }

      // 3. Update Top-Up Card if it exists and is active
      const topUpCardRef = this.db.collection('financial_accounts').doc(`TOPUP_${userId}`);
      const topUpCard = await topUpCardRef.get();
      if (topUpCard.exists && topUpCard.data()?.status === 'VERIFIED') {
        batch.set(topUpCardRef, {
          balanceNgn: topUpBal,
          accountBalanceNgn: topUpBal,
          balanceGbp: topUpBal / 1945.50,
          lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // 4. Update Root User Document (Total Consolidated)
      const totalEquity = personalBal + topUpBal;
      batch.set(userRef, {
        totalEquityNgn: totalEquity,
        consolidatedBalanceNgn: totalEquity,
        gbpEquivalent: totalEquity / 1945.50,
        isSyncing: false,
        lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await batch.commit();

      return {
        status: 'SUCCESS',
        personalBal,
        topUpBal,
        totalEquity,
        matchedAccId
      };
    } catch (error: any) {
      this.logger.error(`SMS Sync Split Error: ${error.message}`);
      return { status: 'ERROR', message: error.message };
    }
  }
}
