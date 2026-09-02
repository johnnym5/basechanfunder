# Implementation Plan - Dual-Channel Financial Ingestion Engine

This plan covers the implementation of the Mono Open Banking integration and the Android SMS Ingestion channel for automated financial ledger updates.

## Proposed Changes

### [Backend: Ingestion Service]

#### [NEW] [mono.service.ts](file:///C:/Users/HP/Documents/CODING/Basechanfunder/services/ingestion/src/ingestion/mono.service.ts)
- Implement `MonoService` with `fetchMonoBalance(monoAccountId)` to call Mono API.
- Implement `handleMonoWebhookEvent(payload)` to process `mono.events.account_updated`.

#### [MODIFY] [ingestion.service.ts](file:///C:/Users/HP/Documents/CODING/Basechanfunder/services/ingestion/src/ingestion/ingestion.service.ts)
- Add `processSMSSync(payload)` with harmonizer logic.
- Implement timestamp check: only update if incoming `timestamp > current.lastSyncedAt`.

#### [MODIFY] [ingestion.controller.ts](file:///C:/Users/HP/Documents/CODING/Basechanfunder/services/ingestion/src/ingestion/ingestion.controller.ts)
- Add POST endpoint `/api/v1/accounts/sms-sync` to receive SMS payloads from the Android app.
- Add POST endpoint `/api/v1/ingestion/mono-webhook` to receive webhooks from Mono.

---

### [Mobile: Android App]

#### [NEW] [UbaSmsReceiver.kt](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/native-android/app/src/main/java/com/basechanfunder/app/receivers/UbaSmsReceiver.kt)
- Create a `BroadcastReceiver` to listen for `SMS_RECEIVED`.
- Implement regex parsing for UBA SMS (Account mask and Available Balance).
- Post the parsed data to the backend `/api/v1/accounts/sms-sync`.

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/native-android/app/src/main/xml/AndroidManifest.xml)
- Register `UbaSmsReceiver` with the appropriate intent filter.
- Add `RECEIVE_SMS` permission.

## Verification Plan

### Manual Verification
1. **Mono API Test**: Use a mock/test Mono account ID to verify `fetchMonoBalance` returns correct data and updates the database.
2. **SMS Ingestion Test**:
   - Run the Android app in an emulator.
   - Use ADB to simulate a UBA SMS:
     `adb emu sms send UBA "Credit: Acct 201****4921 Amt: NGN 200,000.00 Date: 02-Sep-2026 Avail Bal: NGN 18,650,000.00"`
   - Check the backend logs/database to confirm the balance is updated to 18,650,000.00.
3. **Harmonizer Test**:
   - Send an older SMS (previous timestamp) and verify the balance is NOT updated.
   - Send a newer update and verify the balance IS updated.
