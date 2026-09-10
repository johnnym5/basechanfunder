# 🏗️ E6 Elixir Architecture & System Design

E6 Elixir is a hybrid compliance platform that integrates native mobile device capabilities with a centralized cloud governance engine to automate Proof of Funds (PoF) verification.

---

## 1. System Topology

The platform is built on a **Monorepo Architecture** managed via NPM Workspaces, ensuring type safety and code sharing across web, mobile, and server environments.

### A. Client Layer
*   **Student/Staff Portal (`apps/web-staff`)**: A high-performance React (Vite) application utilizing **Glassmorphism** (Tailwind + Framer Motion) for a premium user experience. It serves both as the mobile app's core UI and the desktop auditing interface.
*   **Android Native Wrapper (`apps/mobile-android`)**: A Kotlin-based native container that hosts the web portal. It provides the **JS Bridge** (`AndroidBridge`) required for background SMS parsing and biometric authentication.
*   **Admin Governance (`apps/web-admin`)**: A specialized React dashboard for platform owners to configure global risk parameters and manage the counselor roster.

### B. Business Logic Layer (`apps/server`)
*   **NestJS API**: A scalable TypeScript backend that orchestrates regulatory workflows.
*   **PDF Stamping Engine**: Powered by `pdf-lib`, it handles real-time overlaying of student data onto official bank mandate templates.
*   **Assembly Pipeline**: A cascading document merger that compiles disparate identity proofs (Passports, Utility Bills, BVN slips) into a single, legally-compliant master regulatory package.
*   **Purge Engine**: A cron-based background service that enforces the 24-hour conversation window and 7-day data archival policy.

### C. Data & Infrastructure Layer (Firebase Ecosystem)
*   **Real-time Ledger (Firestore)**: A NoSQL document store for financial accounts, evaluations, and interactive notifications.
*   **Identity Governance (Firebase Auth)**: Manages multi-role access (STUDENT, COUNSELOR, ADMIN) with Google OAuth2 integration.
*   **Secure Vault (Firebase Storage)**: Encrypted storage for sensitive compliance documents and compiled PDF packages.
*   **Push Orchestration (FCM + Capacitor)**: Cross-platform notification delivery for top-up alerts and compliance breach warnings.

---

## 2. Key Technical Workflows

### 📥 The "Zero-Knowledge" SMS Ingestion
Unlike traditional aggregators, E6 Elixir does not store bank passwords.
1.  The Android Native wrapper intercepts encrypted SMS alerts from Nigerian banks (UBA, GTB, Zenith, etc.).
2.  A regex-based **Fuzzy Parser** extracts the available balance and account mask locally.
3.  **Atomic Multi-Device Sync**: The mobile app executes a `writeBatch()` to Firestore, updating both the specific bank record and the root user profile simultaneously.
4.  **Instant Desktop Reflection**: The Staff/Admin portal uses `onSnapshot` listeners to reactively update the PC dashboard within milliseconds of the mobile ingestion, killing the infinite sync loop.

### 📜 Automated Package Assembly
The platform automates the creation of the **Parallex Account Mandate**.
1.  Student completes a 5-stage onboarding wizard.
2.  The server overlays Stage 1 details onto the official PDF template.
3.  The student signs the "Wet Signature" form and re-uploads it.
4.  The **Compiler Engine** merges the signed form with verified identity docs into a finalized 6-page package.

---

## 3. Security Architecture

*   **Audit Logging**: Every administrative action (Balance overrides, Document approvals, Purge triggers) is recorded in an immutable `audit_logs` collection.
*   **Hard-Purge Automation**: To comply with data privacy laws, support conversations are auto-deleted every 24 hours. Archived users are permanently wiped from all storage buckets and databases after a 7-day grace period.
*   **Device Signature**: Push notification tokens are uniquely bound to verified mobile device IDs to prevent unauthorized session hijacking.

---

© 2026 E6 Elixir. High-Stakes Compliance Engineering.
