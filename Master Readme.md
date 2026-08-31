# **Basechanfunder — Proof of Funds (POF) Verification & Liquidity Compliance Platform**

**Basechanfunder** is an enterprise-grade automated Proof of Funds (POF) tracking, financial verification, and compliance management platform designed for international students, skilled workers, and immigrants originating from Nigeria and high-risk financial corridors.

The platform continuously monitors liquid balances, validates holding periods against strict embassy regulatory criteria (UKVI, IRCC, German Foreign Office, USCIS), detects unverified lump-sum deposits ("funds parking"), and provides verifiable source-of-funds documentation tools.

## **🚀 Key Features**

* **Dynamic Regulatory Matrix**: Dynamic evaluation of statutory minimum balances against foreign exchange rates (OANDA) with built-in volatility buffers.  
* **Continuous Holding Engine**: Real-time mathematical verification of unbroken holding windows (e.g., UKVI 28-day uninterrupted rule).  
* **Multi-Channel Financial Ingestion**:  
  * **Open Banking Aggregation**: Direct API linkage via Mono and Okra.  
  * **Native Client SMS Ingestion**: Foreground/background Android SMS alert parsing for instant transaction logging.  
  * **MyBankStatement (MBS) Verification**: Protocol integration for official eStatement authentication and ticket validation.  
* **Anomaly & Anti-Funds Parking Detection**: Algorithmic flag generation for unverified credit entries exceeding historic baseline standard deviations.  
* **Forensic Document Inspection**: Automated checks on uploaded eStatements for layer editing, metadata manipulation, and font mismatching.  
* **Multi-Portal Ecosystem**: Custom interfaces for Visa Applicants (Mobile App), Compliance Officers (Staff Web Console), and System Operations (Admin Governance Console).

## **🛠 Tech Stack Summary**

| Domain | Technology |
| :---- | :---- |
| **Mobile App** | Flutter (Dart) & Native Kotlin (Android Background Service) |
| **Web Portals** | React.js, TypeScript, Tailwind CSS |
| **Backend Runtime** | Go (High-concurrency mathematical matrix calculations) & Node.js (NestJS microservices) |
| **API Gateway** | Kong Gateway / Envoy Proxy (OAuth2, mTLS, TLS 1.3) |
| **Event Streaming** | Apache Kafka |
| **Database & Cache** | PostgreSQL 16+ (Row-Level Security, JSONB) & Redis Cluster |
| **Secrets & Storage** | HashiCorp Vault & AWS S3 (AES-256 Encrypted) |

## **📂 Project Documentation Structure**

* [ARCHITECTURE.md](http://docs.google.com/ARCHITECTURE.md) — Infrastructure topology, microservice architecture, security, and PostgreSQL schemas.  
* [COMPLIANCE\_ENGINE.md](http://docs.google.com/COMPLIANCE_ENGINE.md) — Mathematical formulas, state machine logic, and country-specific statutory rules.  
* [INGESTION\_SPECIFICATION.md](http://docs.google.com/INGESTION_SPECIFICATION.md) — Open Banking webhooks, Android Kotlin SMS regex specification, and MBS ticket protocols.  
* [TASK\_ROADMAP.md](http://docs.google.com/TASK_ROADMAP.md) — Step-by-step feature execution matrix for AI agents and developer workflows.