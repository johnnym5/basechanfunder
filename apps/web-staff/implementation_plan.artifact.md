# Connect Admin Settings to Live App Logic

This plan outlines the steps to make the "System Parameters" in the Admin Console active, allowing them to control the FX rates, buffers, and holding periods across the entire application in real-time.

## User Review Required

> [!IMPORTANT]
> - All dashboard calculations (converted balances, compliance statuses) will now depend on these settings.
> - Changing the "Min. Holding Period" will immediately affect how "Almost Done" and "Maturity" badges are calculated for all students.
> - A `system_config` collection will be created in your Firestore database.

## Proposed Changes

### [Database & Configuration]

#### [NEW] `system_config/global` (Firestore Document)
- Store the following parameters:
  - `fxRate`: Current NGN/GBP rate.
  - `fxBuffer`: The safety percentage (e.g., 10.5%).
  - `holdingDays`: Mandatory continuous period (e.g., 28).
  - `anomalyThreshold`: R-Ratio for deposit flags.
  - `gracePeriodHours`: Time window for top-up responses.

### [Admin Console]

#### [MODIFY] [SettingsConsole.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/SettingsConsole.tsx)
- Implement `useEffect` to fetch current global settings on mount.
- Update `handleSave` to write the local state back to Firestore `system_config/global`.
- Add feedback toast for successful updates.

### [Dashboards & Logic]

#### [MODIFY] [Dashboard.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/Dashboard.tsx)
- Replace hardcoded `LIVE_FX_RATE` and holding period logic with values fetched from `system_config`.
- Listen for real-time changes to the config so the admin view stays in sync.

#### [MODIFY] [StudentLightDashboard.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/StudentLightDashboard.tsx)
- Fetch and use `fxRate` and `fxBuffer` for all balance conversions.
- Update maturity progress calculation based on the dynamic `holdingDays`.

#### [MODIFY] [StudentMobileFirstDashboard.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-staff/src/components/StudentMobileFirstDashboard.tsx)
- Synchronize mobile-specific conversion and timer logic with the global configuration.

## Verification Plan

### Manual Verification
1.  **Admin Update:** Change the FX Buffer to 15% and Save.
2.  **Student Verification:** Open a Student Dashboard and verify that the "Target Met" status and progress bar reflect the new 15% safety requirement.
3.  **Real-time Check:** Change the Min Holding Period from 28 to 30 days and verify that maturity counters update instantly without a page refresh.
