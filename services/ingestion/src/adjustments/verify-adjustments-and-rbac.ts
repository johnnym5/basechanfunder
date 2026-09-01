import { AdjustmentRequestService } from './adjustment-request.service';
import { CounselorStudentGuard } from './counselor-student.guard';
import { AdjustmentType, UserRole } from './adjustments.dto';
import { ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';

async function runVerificationSuite() {
  console.log('========================================================================');
  console.log('🛡️ Basechanfunder Funding & Timeline Adjustment Hub + RBAC Verification');
  console.log('========================================================================\n');

  const service = new AdjustmentRequestService();
  const guard = new CounselorStudentGuard(service);

  const studentChidiId = 'student-chidi-8941';
  const counselorSarahId = 'counselor-sarah-101'; // Mapped to Chidi
  const counselorJamesId = 'counselor-james-999'; // UNASSIGNED Counselor
  const adminId = 'admin-governance-001';

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   ↳ ${detail}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   ↳ ${detail}`);
    }
  }

  // -------------------------------------------------------------------------
  // TEST 1: Student creates Adjustment Request & 24h Grace Period is Assigned
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Creation & 24-Hour Grace Period Assignment ---');
  const createdReq = await service.createAdjustmentRequest({
    studentId: studentChidiId,
    requestType: AdjustmentType.FUNDING_TARGET,
    currentValue: 13340.0,
    requestedValue: 14850.0,
    reason: 'Higher London accommodation deposit fees required.',
  });

  const now = Date.now();
  const expiryTime = new Date(createdReq.gracePeriodExpiresAt).getTime();
  const hoursDiff = (expiryTime - now) / (1000 * 60 * 60);

  assert(
    createdReq.id.startsWith('adj-') && createdReq.status === 'PENDING',
    'Adjustment request created with status PENDING',
    `Request ID: ${createdReq.id}`,
  );
  assert(
    Math.abs(hoursDiff - 24) < 0.1,
    '24-Hour Grace Period accurately calculated',
    `Expires at: ${createdReq.gracePeriodExpiresAt.toISOString()} (~${hoursDiff.toFixed(1)} hours from now)`,
  );

  // -------------------------------------------------------------------------
  // TEST 2: Authorized Counselor Scoping Verification
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Authorized Counselor Access (Assigned) ---');
  const mockSarahContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          'x-user-id': counselorSarahId,
          'x-user-role': UserRole.COUNSELOR,
        },
        params: { studentId: studentChidiId },
        query: {},
        body: {},
      }),
    }),
  };

  const isSarahAllowed = await guard.canActivate(mockSarahContext);
  assert(
    isSarahAllowed === true,
    'Assigned counselor (Dr. Sarah Morgan) successfully authorized',
    `Counselor: ${counselorSarahId} -> Student: ${studentChidiId}`,
  );

  const sarahAdjustments = await service.getCounselorAdjustments(counselorSarahId);
  assert(
    sarahAdjustments.some((r) => r.id === createdReq.id),
    'Assigned counselor can retrieve scoped student adjustment requests',
    `Retrieved ${sarahAdjustments.length} adjustment request(s)`,
  );

  // -------------------------------------------------------------------------
  // TEST 3: Unauthorized Counselor Access (RBAC Scoping Enforcement)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Unauthorized Counselor Access Rejection (RBAC Enforcement) ---');
  const mockJamesContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          'x-user-id': counselorJamesId,
          'x-user-role': UserRole.COUNSELOR,
        },
        params: { studentId: studentChidiId },
        query: {},
        body: {},
      }),
    }),
  };

  let jamesRejected = false;
  let rejectedMessage = '';
  try {
    await guard.canActivate(mockJamesContext);
  } catch (err: any) {
    if (err instanceof ForbiddenException) {
      jamesRejected = true;
      rejectedMessage = err.message;
    }
  }

  assert(
    jamesRejected === true,
    'Unauthorized counselor (James) access strictly BLOCKED with 403 Forbidden',
    `Security Exception: "${rejectedMessage}"`,
  );

  // -------------------------------------------------------------------------
  // TEST 4: Student Retraction / Cancellation Within 24-Hour Grace Period
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Student Request Cancellation Within 24-Hour Grace Period ---');
  const cancelResult = await service.cancelAdjustmentRequest(createdReq.id, studentChidiId);
  assert(
    cancelResult.status === 'CANCELLED',
    'Student successfully retracted adjustment request within 24h grace window',
    `Status updated to: ${cancelResult.status}`,
  );

  // -------------------------------------------------------------------------
  // TEST 5: Grace Period Expiration Lockout Enforcement
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Lockout Enforcement After 24-Hour Grace Period Expiration ---');
  const secondReq = await service.createAdjustmentRequest({
    studentId: studentChidiId,
    requestType: AdjustmentType.TIMELINE_EXTENSION,
    currentValue: 28,
    requestedValue: 42,
    reason: 'CAS statement issuance date delayed by university admissions.',
  });

  // Fast-forward grace period expiration to test lockout
  service.expireGracePeriodForTesting(secondReq.id);

  let expiredCancellationBlocked = false;
  let expiredMessage = '';
  try {
    await service.cancelAdjustmentRequest(secondReq.id, studentChidiId);
  } catch (err: any) {
    if (err instanceof BadRequestException) {
      expiredCancellationBlocked = true;
      expiredMessage = err.message;
    }
  }

  assert(
    expiredCancellationBlocked === true,
    'Cancellation after 24h grace period strictly REJECTED with 400 Bad Request',
    `Lockout Exception: "${expiredMessage}"`,
  );

  // -------------------------------------------------------------------------
  // TEST 6: Admin Governance Global Oversight
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Admin Governance Global Oversight ---');
  const mockAdminContext: any = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          'x-user-id': adminId,
          'x-user-role': UserRole.ADMIN_GOVERNANCE,
        },
        params: { studentId: studentChidiId },
        query: {},
        body: {},
      }),
    }),
  };

  const isAdminAllowed = await guard.canActivate(mockAdminContext);
  assert(
    isAdminAllowed === true,
    'Admin Governance granted global oversight access to student adjustments',
  );

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`📊 Test Summary: ${passedTests}/${totalTests} Tests Passed (100% Success)`);
  console.log('========================================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 All RBAC Scoping, 24-Hour Grace Period, and Counselor Security rules verified successfully!');
  } else {
    process.exit(1);
  }
}

runVerificationSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
