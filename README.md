# 🛡️ Basechanfunder — Automated UKVI Proof of Funds Platform

![Basechanfunder Logo](apps/web-staff/public/logo.svg)

## 📖 What this App is About
**Basechanfunder** is mission-critical financial infrastructure designed to bridge the gap between international visa applicants and the stringent financial requirements of global immigration authorities. 

Specifically focused on the **UKVI (UK Visas & Immigration) 28-Day Rule**, the platform solves the high-stakes problem of visa rejections caused by financial oversight. For many students and skilled workers, a single day where their balance drops below the required threshold—or an unexplained cash deposit—results in an automatic rejection, leading to lost tuition fees, delayed careers, and significant emotional distress. Basechanfunder automates the vigilance required to maintain compliance, providing a "safety net" for the applicant's financial journey.

## 📝 Brief Summary
Basechanfunder is an enterprise-grade, automated **Proof of Funds (PoF) compliance and verification platform**. It continuously monitors applicant bank balances across multiple channels (Open Banking, SMS, eStatements), mathematically validates 28-day continuous holding rules, and applies dynamic FX volatility buffers to ensure applicants always meet the statutory GBP requirements regardless of local currency fluctuations.

## 🔍 Detailed Summary

Basechanfunder is a sophisticated multi-service ecosystem built to handle the complexities of cross-border financial verification. Its architecture is divided into three primary pillars:

### 1. The Compliance & Mathematical Engine
At the heart of the platform is a high-concurrency **Go-based PoF Matrix Engine**. This engine performs:
*   **Rolling 28-Day Validation**: Iteratively scans daily closing balances to find the absolute lowest point in the required window.
*   **Dynamic FX Buffering**: Automatically calculates a **customizable safety margin** (default 10%) over official exchange rates to insulate applicants against sudden devaluations of local currencies.
*   **Multi-Currency Support**: Native support for **15+ major global currencies** (USD, EUR, GHS, CAD, etc.), with per-student overrides for specialized visa routes.

### 2. Multi-Channel Data Ingestion Pipeline
To provide a real-time view of financial health, Basechanfunder ingests data from diverse sources:
*   **Open Banking**: Direct API integration with Mono for automated, read-only transaction fetching.
*   **Native SMS Sync Engine**: A high-priority Android service that intercepts banking alerts (e.g., UBA) and extracts balances in real-time, even when APIs are offline.
*   **USSD Fallback**: Integrated USSD check prompts for banks with restricted digital access.

### 3. Virtual Sub-Ledger & Capital Governance
The platform introduces an innovative **Virtual Sub-Ledger** system to manage complex funding structures:
*   **Equity vs. Org Capital**: Distinguishes between a student's personal funds and organization top-up capital within a single account.
*   **Debit Waterfall Alerting**: Automatically flags compliance breaches if organization-contributed capital is encroached upon by withdrawals.
*   **Real-Time Push Alerts**: Interactive FCM (Firebase Cloud Messaging) notifications with deep-linking to transaction statements.

---

## 🏗️ Monorepo Directory Layout

```text
Basechanfunder/
├── apps/
│   ├── mobile-android/     # Hybrid Kotlin App + WebView (Native SMS/Push Bridge)
│   ├── web-staff/          # React + TS Staff Audit Console & Student Dashboard
│   └── web-admin/          # React + TS Admin Governance Portal
├── services/
│   ├── pof-engine/         # Go Microservice (28-Day Matrix, FX Buffer, Anomaly Ratio)
│   └── ingestion/          # NestJS Microservice (Open Banking, SMS Webhooks)
├── deploy/
│   ├── migrations/         # PostgreSQL DDL Scripts
│   └── kong/               # Kong API Gateway Manifest
├── ARCHITECTURE.md         # Master Architectural Blueprint
└── README.md               # Master Documentation
```

## 🛠 Tech Stack

| Domain | Technology |
| :---- | :---- |
| **Mobile App** | Native Kotlin (API 34) & React Hybrid WebView |
| **Web Portals** | React.js, TypeScript, Tailwind CSS |
| **Backend Runtime** | Go (Matrix Math) & Node.js (NestJS microservices) |
| **Cloud Messaging** | Firebase FCM (Android Push + Web Push) |
| **Event Streaming** | Apache Kafka / Redpanda |
| **Database & Cache** | PostgreSQL 16+ & Redis Cluster |
| **Security** | HashiCorp Vault (AES-256-GCM) & TLS 1.3 |

---

## 🚀 Quick Start Guide

### 1. Local Infrastructure Stack
Ensure **Docker Desktop** is running, then execute:
```bash
docker compose up -d
```

### 2. Build & Deploy Web Dashboard
```bash
cd apps/web-staff
npm install && npm run build
```

### 3. Build Android Mobile APK
Synchronize web assets and compile the native bridge:
```bash
# Copy web assets to Android project
cp -r apps/web-staff/dist/* apps/mobile-android/app/src/main/assets/
# Build APK
cd apps/mobile-android
./gradlew assembleDebug
```

---

## 📜 License & Compliance

© 2026 Basechanfunder. Compliant with UKVI Home Office Appendix Finance regulations & ISO 27001 data protection standards.
