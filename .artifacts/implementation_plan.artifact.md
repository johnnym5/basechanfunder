# Implementation Plan: Admin Timer, 7-Day Warning, and Expired UI

This plan covers the implementation of the POF expiration engine, including admin controls, student warnings, and the locked expired state.

## Proposed Changes

### 1. Data Model Updates
Update the student record creation to include the new timer fields.

#### [MODIFY] [AddStudentModal.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/AddStudentModal.tsx)
- Initialize `expirationDate: null`, `timerCustomMessage: null`, and `isTimerActive: false` in both `handleAddRegistered` and `handleManualSubmit`.

---

### 2. Admin Timer Control
Ensure the Admin can set expiration dates and custom messages.

#### [MODIFY] [AdminTimerModal.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/AdminTimerModal.tsx)
- Verify `handleSave` correctly persists `expirationDate`, `timerCustomMessage`, and `isTimerActive`. (Existing implementation looks mostly correct, will ensure it aligns with requirements).

---

### 3. Student Dashboard Expiration Engine
Implement the warning banner, expiry modal, and locked overlay.

#### [MODIFY] [StudentLightDashboard.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/StudentLightDashboard.tsx)
- **7-Day Warning Banner**: Enhance the existing amber banner with a "Add More Time / Request Extension" action.
- **Expired State**:
    - Add a bold "EXPIRED" overlay that covers the entire screen when `isExpired` is true.
    - Implement a specific `ExpiredModal` to display the `timerCustomMessage` set by the Admin.
    - Ensure the dashboard is greased out and non-interactive.

---

## Verification Plan

### Automated Tests
- Not applicable for this UI-heavy task (manual verification preferred).

### Manual Verification
1. **Initial State**: Create a new student and verify no timer is active in the Student view.
2. **7-Day Warning**: In Admin view, set an expiration date 5 days in the future. Log in as the student and verify the amber warning banner appears.
3. **Expired State**: In Admin view, set an expiration date in the past. Log in as the student and verify:
    - The dashboard is grayscale and non-interactive.
    - A bold "EXPIRED" overlay is visible.
    - A modal pops up with the custom message from the Admin.
