# 🛡️ Basechanfunder Master Portal — Enterprise Compliance & POF Governance

**Basechanfunder** is a high-integrity financial compliance ecosystem engineered to automate **Proof of Funds (POF)** verification for international visa applicants. The platform solves the critical challenge of maintaining continuous bank balances required by global regulatory bodies (UKVI, IRCC, USCIS) through automated monitoring, mathematical validation, and risk orchestration.

---

## 🚀 Core Engine Capabilities

*   **Continuous Statutory Monitoring**: Real-time tracking of the **28-Day Uninterrupted Rule**, providing instant maturity alerts and risk-breach notifications.
*   **Hybrid Financial Ingestion**: 
    *   **Native SMS Ingestion**: On-device Kotlin-based parsing of encrypted bank alerts for UBA, GTB, Zenith, and Parallex.
    *   **Regulatory Ledger**: Real-time Firestore document store that synchronizes balances across mobile and desktop web environments.
*   **Branded Document Assembly**: A server-side pipeline that stamps student data onto official bank mandate templates and compiles identity proofs into multi-page regulatory packages.
*   **Dynamic Risk Orchestration**: Platform-wide configuration of FX volatility buffers, global pricing caps, and study-destination parameters.
*   **Privacy-First Governance**: Automated hourly purge of support conversations (24h window) and cascading hard-deletion of archived user data (7d grace period).

---

## 🛠 Technology Stack

| Domain | Technology |
| :--- | :--- |
| **Monorepo Management** | NPM Workspaces |
| **Frontend / Portals** | React.js, Vite, Tailwind CSS, Framer Motion |
| **Mobile Foundation** | Native Android (Kotlin) + Capacitor Bridge |
| **API & Service Layer** | NestJS (TypeScript) |
| **Data & Real-time Persistence** | Firebase Firestore |
| **Identity & Access (RBAC)** | Firebase Auth (Google OAuth2 Integration) |
| **Secure Document Vault** | Firebase Storage |
| **Push Orchestration** | FCM + Capacitor Push Notifications |
| **PDF Engineering** | PDF-Lib (Server-Side Stamping & Assembly) |

---

## 🏗 System Topology

```text
E6 Elixir Root/
├── apps/
│   ├── web-staff/          # Unified Portal: Students, Counselors, and Auditing
│   ├── web-admin/          # Governance Dashboard: Global Parameters & Roster
│   ├── server/             # NestJS API: PDF Compiler, Purge Engine, and Auth Sync
│   └── mobile-android/     # Native Wrapper: Background SMS Parser & WebKit Bridge
├── .artifacts/             # Technical Implementation Plans & Compliance Research
└── package.json            # Workspace Configuration & Global Dependencies
```

---

## 📂 Documentation & Reference

*   [ARCHITECTURE.md](file:///C:/Users/HP/Documents/CODING/Basechanfunder/ARCHITECTURE.md) — Detailed system topology, JS Bridge specifications, and data flow diagrams.
*   [README.md](file:///C:/Users/HP/Documents/CODING/Basechanfunder/README.md) — General project overview and local development setup instructions.

---

© 2026 E6 Elixir. High-Stakes Compliance Engineering.
