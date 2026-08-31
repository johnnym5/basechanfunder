# Basechanfunder Monorepo

Basechanfunder is an enterprise-grade UKVI 28-day Proof of Funds (PoF) compliance, financial tracking, and verification platform.

## 🏗️ Workspace Layout

- `apps/mobile`: Flutter cross-platform mobile application
- `apps/web-staff`: React + TypeScript + Tailwind CSS Staff Audit Console
- `apps/web-admin`: React + TypeScript Admin Governance Console
- `services/pof-engine`: Go microservice for 28-day UKVI matrix math & FX anomaly evaluation
- `services/ingestion`: NestJS microservice for Open Banking, MBS, & SMS webhooks
- `deploy/`: Infrastructure configuration, Docker Compose, Kong Gateway, and PostgreSQL migrations

## 🚀 Quick Start

```bash
# Start local infrastructure stack (PostgreSQL, Redis, Vault, Redpanda)
docker-compose up -d
```
