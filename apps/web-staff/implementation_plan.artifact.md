# Implementation Plan - SMS & USSD Ingestion Migration

This plan replaces the Mono Open Banking integration with a purely local SMS and USSD ingestion engine, providing a more accessible and trust-guaranteed approach for student bank verification.

## Proposed Changes

### [Trust & Configuration]
- **Remove Mono SDK**: Completely eliminate `@mono.co/connect.js` and all associated initialization logic from the web app.
- **Update Environment**: Clear Mono-related keys from the environment configuration.

### [Web App: Student Dashboards]
#### [MODIFY] [StudentLightDashboard.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/StudentLightDashboard.tsx) & [StudentMobileFirstDashboard.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/StudentMobileFirstDashboard.tsx)
- **Simplify Connection Modal**: Replace the dual-tab Mono/Manual modal with a single "Connect Source" form:
  - **Fields**: Bank Selection, Account Number, Account Type.
  - **Action**: "Save & Sync".
- **Instant SMS Scan**: Upon "Save & Sync", trigger the native Android bridge to scan for the selected bank's latest alert.
- **Card UI Updates**:
  - Add green `[ ✓ Verified ]` shield badge for accounts matching SMS masks.
  - Show subtle `Account not verified` footer note for non-matching masks.
  - Display `SMS Received: [Time]` on each bank card.

#### [NEW] [SmsIngestionService.ts](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/services/SmsIngestionService.ts)
- Implement regex patterns for major Nigerian banks (UBA, GTBank, Access, Zenith, FirstBank, Kuda).
- Implement `verifyMatch` logic (comparing last 4 digits of entered account number vs. SMS mask).

### [Android App: SMS Ingestion]
#### [MODIFY] [UbaSmsReceiver.kt](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/mobile-android/app/src/main/java/app/basechan_funder/UbaSmsReceiver.kt) -> Rename to `BankSmsReceiver.kt`
- Expand parsing logic to handle multiple bank sender IDs and formats.
- Post parsed JSON payload (`accountMask`, `balanceNgn`, `bankName`, `source: "SMS_INGESTION"`, `timestamp`) to backend `/v1/accounts/sms-sync`.
- Ensure it continues to push updates to the web view via `updateSmsBalance`.

### [Backend: Ingestion Ledger]
#### [MODIFY] [ingestion.service.ts](file:///C:/Users/HP/Documents/CODING/Basechanfunder/services/ingestion/src/ingestion/ingestion.service.ts)
- Implement endpoint `/api/v1/accounts/sms-sync` to receive and commit balance updates to the primary ledger.

## Verification Plan
1. **Connect Flow**: Link a UBA account manually with number `...4921`.
2. **Scan Trigger**: Verify "Save & Sync" triggers the Android SMS scan.
3. **Verification Logic**:
   - Mock an SMS with `Acct 201****4921` and verify the card shows the green badge.
   - Mock an SMS with `Acct 201****0000` and verify it updates the balance but shows "Account not verified".
4. **USSD Interaction**: Tap USSD button and confirm it opens the dialer with the correct code.

## Environment & Build Stability

### [FIX] Vite Dependency Optimization
- Resolve `504 (Outdated Optimize Dep)` for `sonner` by clearing the Vite cache.
- Ensure the dev server performs a fresh pre-optimization of dependencies.
