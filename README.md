# 🛡️ Basechanfunder — Automated UKVI Proof of Funds Platform

![Basechanfunder Logo](apps/web-staff/public/logo.svg)

**Basechanfunder** is an enterprise-grade, automated **UKVI (UK Visas & Immigration) 28-Day Proof of Funds (PoF) compliance, financial tracking, and verification platform**.

It eliminates visa rejection risks for international students, skilled workers, and visa applicants by mathematically validating 28-day continuous holding rules, insulating against exchange rate devaluation via dynamic FX volatility buffers, and detecting unverified cash deposit spikes ("parked money").

---

## 🎨 Google Stitch Integration

Designed using **Google Stitch** (Project ID: `11596664536176852252`) and integrated via **Stitch MCP Server**:
- **Radial Target Gauge**: Real-time GBP target calculations (£13,761) vs local currency balances (NGN).
- **28-Day Maturity Timeline**: Progress bar tracking 28 consecutive uninterrupted days (`Day 19 of 28 Days`).
- **Multi-Channel Ingestion Feed**: Status cards for Open Banking (GTBank API), SMS agents (Zenith Parser), and eStatement tickets (MBS).
- **Source of Funds Flag Alert**: Automatic flag triggering for unexplained cash deposits (₦3,500,000) with Deed of Gift upload.

---

## 🏗️ Monorepo Directory Layout

```
Basechanfunder/
├── apps/
│   ├── mobile/             # Flutter Cross-Platform Mobile App (Status, Banks, Documents, Support)
│   ├── web-staff/          # React 18 + TS + Tailwind Staff Audit Console (Glassmorphic UI, Light/Dark Mode)
│   └── web-admin/          # React 18 + TS + Tailwind Admin Governance Portal (System Rules & Vault Status)
├── services/
│   ├── pof-engine/         # Go Microservice (28-Day UKVI Matrix Engine, 10% FX Buffer, Anomaly Ratio)
│   └── ingestion/          # NestJS Microservice (Open Banking, MBS PDF OCR, SMS Webhooks)
├── deploy/
│   ├── migrations/         # PostgreSQL 001_initial_schema.sql DDL Script
│   ├── kong/               # Declarative Kong API Gateway Manifest (kong.yml)
│   └── vault/              # HashiCorp Vault Secrets Engine Setup Script (init-vault.sh)
├── .env.example & .env     # Pre-populated Firebase & Database Configurations
├── docker-compose.yml      # Local Stack (PostgreSQL 16, Redis 7, Vault 1.15, Redpanda Event Bus)
├── ARCHITECTURE.md         # Master Architectural Blueprint & System Topology
└── README.md               # Master Documentation
```

---

## ⚙️ Core Engines & Technical Specs

### 1. **Go PoF Matrix Calculation Engine (`services/pof-engine`)**
- **28-Day Rolling Window**: Iterates over daily closing balances across 28 consecutive days to find the absolute lowest balance in GBP.
- **FX Volatility Safety Buffer**: Applies a dynamic 10% safety buffer over target GBP requirements to insulate against currency drops prior to visa submission.
- **Anomaly Ratio Detector**: Calculates $R = \frac{\text{MaxBalance} - \text{MedianBalance}}{\text{MedianBalance}}$ to flag sudden cash injection spikes.

### 2. **NestJS Ingestion Pipeline (`services/ingestion`)**
- Ingests data from Open Banking APIs (Mono/Okra), Manual Bank Statements (MBS eStatement PDF forensic inspection), and signed SMS alerts.

### 3. **Infrastructure & Security**
- **PostgreSQL 16**: Relational storage with UUIDs, foreign key cascades, and immutable audit compliance logs.
- **Redis 7**: Caching layer for live OANDA FX spot rates and session tokens.
- **HashiCorp Vault**: AES-256-GCM encryption for PII fields and API credentials.
- **Kong API Gateway**: Centralized API proxy for `/api/v1/pof/*` and `/api/v1/ingestion/*`.

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
go test -v ./pkg/matrix/...
go run main.go
```

### 3. Run NestJS Ingestion Microservice
```bash
cd services/ingestion
npm install
npm run start:dev
```

### 4. Run Staff Audit Console (Web)
```bash
cd apps/web-staff
npm install
npm run dev
```
*Access locally at `http://localhost:3001`.*

### 5. Run Flutter Mobile App
```bash
cd apps/mobile
flutter run
```

---

## 🧪 Trial Sandbox Role Switcher

Both web portals feature an interactive **Trial Mode User Role Switcher** in the top right navigation bar:
- 👤 **Applicant (Normal User)**: `Chidi / Adebayo Ogunlesi` (`APP-8941`)
- 🛡️ **Staff Auditor**: `Julian Morgan` (`AUD-8842`)
- 🔑 **Admin Governance**: `Dr. Sarah Connor` (`ADM-0109`)

---

## 📜 License & Compliance

© 2026 Basechanfunder. Compliant with UKVI Home Office Appendix Finance regulations & ISO 27001 data protection standards.
