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
*   **Dynamic FX Buffering**: Automatically calculates a **10% safety margin** over the official OANDA exchange rates to insulate applicants against sudden devaluations of local currencies (e.g., NGN to GBP).
*   **Anomaly Detection**: Uses statistical baseline analysis to flag "parked money"—unusually large deposits that lack verified sources, which are a common trigger for UKVI suspicion.

### 2. Multi-Channel Data Ingestion Pipeline
To provide a real-time view of financial health, Basechanfunder ingests data from diverse sources via a **NestJS Microservice**:
*   **Open Banking**: Direct API integration with Mono and Okra for automated, read-only transaction fetching.
*   **SMS Agent**: A native Android background service that parses bank alert messages, enabling instant balance updates even when APIs are unavailable.
*   **MBS Verification**: Integration with the **MyBankStatement (MBS)** portal to authenticate official bank eStatements and perform forensic PDF inspection (detecting font mismatches or metadata tampering).

### 3. Governance & Audit Ecosystem
The platform provides tailored interfaces for every stakeholder in the visa process:
*   **Applicant Mobile App (Flutter)**: A user-centric dashboard showing the "Maturity Timeline" (e.g., Day 19 of 28), target gauges, and document upload prompts.
*   **Staff Audit Console (React)**: A glassmorphic internal portal for compliance officers to review flagged anomalies and verify "Deed of Gift" documents.
*   **Admin Governance Portal (React)**: A high-level system for managing global rules, FX rate providers, and vault security status.

---

## 🏗️ Monorepo Directory Layout

```text
Basechanfunder/
├── apps/
│   ├── mobile/             # Flutter Cross-Platform Mobile App (Status, Banks, Documents)
│   ├── web-staff/          # React + TS Staff Audit Console (Glassmorphic UI)
│   └── web-admin/          # React + TS Admin Governance Portal
├── services/
│   ├── pof-engine/         # Go Microservice (28-Day Matrix, FX Buffer, Anomaly Ratio)
│   └── ingestion/          # NestJS Microservice (Open Banking, MBS PDF OCR, SMS)
├── deploy/
│   ├── migrations/         # PostgreSQL DDL Scripts
│   ├── kong/               # Kong API Gateway Manifest
│   └── vault/              # HashiCorp Vault Setup Scripts
├── docker-compose.yml      # Local Stack (PostgreSQL 16, Redis 7, Vault, Redpanda)
├── ARCHITECTURE.md         # Master Architectural Blueprint
└── README.md               # Master Documentation
```

## 🛠 Tech Stack

| Domain | Technology |
| :---- | :---- |
| **Mobile App** | Flutter (Dart) & Native Kotlin (Android Background Service) |
| **Web Portals** | React.js, TypeScript, Tailwind CSS |
| **Backend Runtime** | Go (Matrix Math) & Node.js (NestJS microservices) |
| **API Gateway** | Kong Gateway / Envoy Proxy |
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

### 2. Run Go PoF Matrix Engine
```bash
cd services/pof-engine
go run main.go
```

### 3. Run NestJS Ingestion Microservice
```bash
cd services/ingestion
npm install && npm run start:dev
```

### 4. Run Staff Audit Console (Web)
```bash
cd apps/web-staff
npm install && npm run dev
```

### 5. Run Flutter Mobile App
```bash
cd apps/mobile
flutter run
```

---

## 📜 License & Compliance

© 2026 Basechanfunder. Compliant with UKVI Home Office Appendix Finance regulations & ISO 27001 data protection standards.
