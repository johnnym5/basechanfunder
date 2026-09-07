import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class MandateSyncService {
  private readonly logger = new Logger(MandateSyncService.name);

  private get db() {
    return admin.firestore();
  }

  async syncMandateToProfile(userId: string) {
    this.logger.log(`Syncing mandate data for user ${userId}`);

    try {
      // 1. Fetch all submissions for this user
      const submissionsSnap = await this.db
        .collection('users')
        .doc(userId)
        .collection('submitted_documents')
        .get();

      const submissions: Record<string, any> = {};
      submissionsSnap.docs.forEach(doc => {
        submissions[doc.id] = doc.data();
      });

      // 2. Map Stage 1 & 2 fields
      const surname = submissions['surname']?.value || '';
      const firstName = submissions['first_name']?.value || '';
      const otherName = submissions['other_name']?.value || '';
      const telephone = submissions['telephone_number']?.value || '';
      const bvn = submissions['signatory_bvn']?.value || '';
      const photoURL = submissions['passport_photo']?.value || '';

      const accountName = submissions['account_name']?.value || '';
      const accountNumber = submissions['account_number']?.value || '';
      const mandateRule = submissions['mandate_auth_rule']?.value || '';
      const idType = submissions['id_type']?.value || '';
      const idNumber = submissions['id_number']?.value || '';

      // 3. Update User Root Document
      const userUpdate: any = {};
      if (surname || firstName) {
        userUpdate.displayName = `${surname} ${firstName} ${otherName}`.trim();
      }
      if (telephone) userUpdate.phoneNumber = telephone;
      if (photoURL) userUpdate.photoURL = photoURL;
      if (bvn) userUpdate.bvn = bvn;

      userUpdate.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      if (Object.keys(userUpdate).length > 1) {
        await this.db.collection('users').doc(userId).update(userUpdate);
      }

      // 4. Update Dedicated Parallex Account Document
      const parallexRef = this.db
        .collection('users')
        .doc(userId)
        .collection('financial_accounts')
        .doc('parallex');

      const parallexUpdate: any = {
        bankName: 'Parallex Bank',
        provider: 'MANDATE_SYSTEM',
        status: 'ACTIVE',
        verificationStatus: 'MANDATE_PENDING_REVIEW',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (accountName) parallexUpdate.accountName = accountName;
      if (accountNumber) {
        parallexUpdate.accountNumber = accountNumber;
        parallexUpdate.accountNumberMasked = `•••• ${accountNumber.slice(-4)}`;
      }
      if (mandateRule) parallexUpdate.mandateType = mandateRule;
      if (idType) parallexUpdate.idType = idType;
      if (idNumber) parallexUpdate.idNumber = idNumber;

      await parallexRef.set(parallexUpdate, { merge: true });

      return { success: true };
    } catch (error) {
      this.logger.error(`Sync failed for ${userId}: ${error.message}`);
      throw error;
    }
  }
}
