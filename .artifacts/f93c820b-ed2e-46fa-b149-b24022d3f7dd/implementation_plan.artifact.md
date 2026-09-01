# Implement Interactive Admin Portal UI in `apps/web-admin`

This task involves building a fully functional front-end prototype for the Basechanfunder Admin Portal. The goal is to provide a rich, interactive UI that allows administrators to manage user assignments, modify regulatory rules, and monitor system telemetry using local mock state.

## User Review Required

> [!IMPORTANT]
> The implementation uses local React state to simulate backend functionality. This is intended for UI/UX prototyping and will need to be connected to the NestJS backend in a future task.

## Proposed Changes

### web-admin Component Layer

#### [MODIFY] [AdminDashboard.tsx](file:///C:/Users/HP/Documents/CODING/Basechanfunder/apps/web-admin/src/components/AdminDashboard.tsx)
- Rewrite the component to include three interactive tabs: **User Assignments**, **Dynamic Rules**, and **Bridge Telemetry**.
- Implement a search-enabled student table with status badges (`COMPLIANT`, `AT_RISK`, `MATURED`).
- Add a "Reassign Counselor" glassmorphic modal for dynamic assignment updates.
- Create country-specific rule cards with an interactive FX Volatility Slider (1-15%).
- Design a telemetry dashboard with live-style indicators for external service nodes.
- Style with a deep dark theme (`bg-slate-950`), subtle borders, and glassmorphic effects.

## Verification Plan

### Manual Verification
1. Navigate to `apps/web-admin`.
2. Run `npm install` and `npm run dev`.
3. Open the browser to the local dev server.
4. **Test Assignments**: Search for students in the table, click "Reassign Counselor", select a new counselor, and verify the table updates.
5. **Test Rules**: Navigate to the Rules tab, adjust the FX Volatility Slider, and observe the live percentage feedback.
6. **Test Telemetry**: Switch to the Telemetry tab and verify the status indicators and latency metrics are displayed.
