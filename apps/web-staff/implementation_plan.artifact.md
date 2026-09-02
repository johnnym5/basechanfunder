# Implement Admin Approval Workflow and Remove Simulation Engine

This plan covers removing the Simulation Engine from Admin mode and implementing a new student approval system where new sign-ups must be approved by an Admin before accessing their dashboard.

## User Review Required

> [!IMPORTANT]
> - New students will see a "Waiting for Approval" screen until an Admin approves them.
> - Admins will be notified of new users via the "Unauthenticated" card on the dashboard.
> - The Simulation Engine (Impersonation) is being completely removed.

## Proposed Changes

### [Authentication & Context]

#### [MODIFY] [AuthContext.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/context/AuthContext.tsx)
- Update `AppUser` interface to include `isApproved: boolean`.
- Default `isApproved` to `true` for Admins/Counselors and `false` for new Students.

#### [MODIFY] [AuthPage.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/pages/AuthPage.tsx)
- Ensure new student profiles are created with `isApproved: false`.

---

### [Portal & Layout]

#### [MODIFY] [MasterAppPortal.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/MasterAppPortal.tsx)
- Remove all "Simulation Engine" logic, state, and UI (RoleSimulationBar, simulatedRole, etc.).
- Implement conditional rendering for Students: If `!appUser.isApproved`, show the "Waiting for Approval" screen instead of the dashboard.

#### [DELETE] [RoleSimulationBar.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/RoleSimulationBar.tsx)
- Remove the simulation bar component as it's no longer needed.

---

### [Admin Dashboard]

#### [MODIFY] [Dashboard.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/Dashboard.tsx)
- Rename the "Risky" card to **"Unauthenticated"**.
- Update the card logic to filter for students where `isApproved === false`.
- Add an "Approve User" action button in the Student Info sidebar for unapproved users.
- Add real-time notification (amber pulse) when a new unapproved user is detected.

## Verification Plan

### Manual Verification
1. Sign up as a new student and verify the "Waiting for Approval" screen appears.
2. Log in as an Admin and verify the "Unauthenticated" card shows the new user.
3. Click "Approve User" in the Admin dashboard and verify the student can then access their dashboard.
4. Verify the Profile FAB no longer contains simulation options.
