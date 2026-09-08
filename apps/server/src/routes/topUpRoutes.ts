import { Router } from 'express';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export const topUpRouter = Router();

topUpRouter.post('/request', async (req, res) => {
  try {
    const { userId, topUpAmountNgn, serviceFeeNgn, paymentReference, accountNumber } = req.body;

    if (!userId || !topUpAmountNgn || !paymentReference) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const db = getFirestore(admin.app(), 'basechanfunder');
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    // Initialize base document if missing
    if (!userDoc.exists) {
      await userRef.set({
        uid: userId,
        createdAt: new Date().toISOString(),
        onboardingStatus: 'INCOMPLETE',
        setupCompleted: false,
      }, { merge: true });
    }

    const requestId = `TOPUP_${Date.now()}`;

    // 1. Create Top-Up Claim Record
    await db.collection('topup_requests').doc(requestId).set({
      requestId,
      userId,
      topUpAmountNgn: Number(topUpAmountNgn),
      serviceFeeNgn: Number(serviceFeeNgn),
      paymentReference,
      accountNumber: accountNumber || '',
      status: 'PENDING_ADMIN_VERIFICATION',
      createdAt: new Date().toISOString(),
    });

    // 2. Safely Update Root User Record via Merge
    await userRef.set({
      status: 'TOPUP_PENDING',           // Primary status required by Admin Table filters
      topUpStatus: 'REQUEST_PENDING',    // Secondary top-up status flag
      hasPendingTopUp: true,             // Fast boolean index for queries
      setupCompleted: true,              // Guarantees visibility past setup-gated roster filters
      isApproved: true,
      activeTopUpRequestId: requestId,
      lastTopUpRequestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return res.status(200).json({
      success: true,
      message: 'Top-up request recorded successfully',
      requestId,
    });
  } catch (err: any) {
    console.error('[TOPUP_SUBMIT_ERROR]', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});
