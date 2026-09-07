# Hard User Deletion & Status Lifecycle Refactor

Replace soft purge with a full cascading hard deletion and refactor user statuses to better reflect the onboarding journey.

## User Review Required

> [!IMPORTANT]
> The deletion process is **permanent**. It will destroy the Firebase Authentication record, all Firestore data (including subcollections), and all uploaded files in Storage. There is no "Restore" button for this action.

## Proposed Changes

### [Backend] apps/server [COMPLETED]

Implemented a comprehensive deletion endpoint that handles all Firebase services.

#### [MODIFY] [admin.controller.ts](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/server/src/controllers/admin.controller.ts) [DONE]
- Implemented `deleteUser` method with non-blocking cascading deletion.
- **Auth**: Wrapped `admin.auth().deleteUser(uid)` in try/catch to handle IAM errors.
- **Firestore**: Recursive deletion of `/users/{uid}` and top-level matches in `financial_accounts`, `pof_evaluations`, etc.
- **Storage**: Deleted files under `student_documents/`, `mandate_packages/`, etc.
- **Audit Logs**: Cleanup logs matching the `studentId`.

### [Frontend] apps/web-staff [COMPLETED]

Updated terminology, refactored status logic, and wired up the new deletion endpoint.

#### [NEW] [userStatusService.ts](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/services/userStatusService.ts) [DONE]
- Centralized status resolution logic.

#### [MODIFY] [Dashboard.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/Dashboard.tsx) [DONE]
- Updated `ComplianceStatus` type and `StatusBadge` visuals.
- Refactored student merging and filtering to respect `PENDING_ONBOARDING` state.
- Updated `handleDeleteProfile` to use the new cascading endpoint.
- Renamed "Purge" to "Delete" project-wide.

#### [MODIFY] [StaffQueue.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/StaffQueue.tsx) [DONE]
- Integrated `resolveUserStatus`.

#### [MODIFY] [StudentActionModal.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/StudentActionModal.tsx) [DONE]
- Updated terminology and deletion call.

## Verification Plan

### Manual Verification
1. **Status Lifecycle**:
    - Sign up a new user. Verify `INCOMPLETE ONBOARDING` status.
    - Submit wizard. Verify `PENDING VERIFICATION` or `CLEARED`.
    - Verify `IDENTIFICATION FAILED` only on explicit failure flag.
2. **Hard Deletion**:
    - Click **Delete** on a student.
    - Verify toast messages and instant row removal.
    - Confirm full data wipe in Firebase Console (Auth, Firestore, Storage).
