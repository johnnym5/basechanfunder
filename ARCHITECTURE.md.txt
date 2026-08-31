Basechanfunder — Architectural Blueprint & System Topology

1. High-Level System Architecture
[ Mobile App (Flutter / Kotlin) ]  <--->  [ React Admin/Staff Portals ]│▼[ Kong API Gateway (TLS 1.3) ]│┌─────────────────────┼─────────────────────┐▼                     ▼                     ▼[ Auth / Identity ]   [ Financial Ingestion ]   [ POF Engine (Go) ](Keycloak)             (NestJS / APIs)        (Math Calculations)│                     │                     │└─────────────────────┼─────────────────────┘▼[ Apache Kafka Event Bus ]│┌───────────────────┴───────────────────┐▼                                       ▼[ PostgreSQL 16+ ]                       [ Redis Cluster ](Encrypted Ledger Data)                  (Rates & Session Caching)
---

## 2. Security & Data Protection Architecture

1. **Encryption Standards**:
   * **At Rest**: PostgreSQL database storage encrypted using AES-256-GCM. Sensitive JSONB payload columns encrypted via application-level keys managed in **HashiCorp Vault**.
   * **In Transit**: End-to-end TLS 1.3 enforced for all external endpoints. Internal microservice-to-microservice communication mandates Mutual TLS (mTLS).
2. **Device Hardware Signature**:
   * Mobile client SMS ingestion payloads are signed using **HMAC-SHA256** keys generated inside the Android Keystore / iOS Keychain.
3. **Regulatory Governance**:
   * Full compliance with Nigeria Data Protection Regulation (NDPR) and ISO 27001 standards.
   * Zero-Knowledge handling: Internet banking credentials and transaction PINs are never requested or stored; Open Banking vendor sandboxes (Mono/Okra) issue OAuth2 access tokens exclusively.

---

## 3. Database Schema (PostgreSQL DDL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    bvn_hash VARCHAR(64) NOT NULL,
    nin_hash VARCHAR(64),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Target Visa Applications Table
CREATE TABLE visa_applications (
    application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    destination_country VARCHAR(3) NOT NULL, -- CAN, GBR, DEU, USA
    visa_route VARCHAR(50) NOT NULL,         -- STUDENT, WORK, PR
    tuition_cost_foreign NUMERIC(12, 2) DEFAULT 0.00,
    living_cost_override NUMERIC(12, 2),
    target_submission_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Linked Financial Accounts
CREATE TABLE financial_accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    institution_code VARCHAR(20) NOT NULL,  -- GTB, ZENITH, ACCESS, UBA, etc.
    account_number_masked VARCHAR(20) NOT NULL,
    provider_type VARCHAR(20) NOT NULL,     -- MONO, OKRA, SMS, MBS
    access_token_encrypted TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated Daily Balances Ledger
CREATE TABLE daily_balances (
    balance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    aggregated_ngn_balance NUMERIC(15, 2) NOT NULL,
    converted_foreign_balance NUMERIC(15, 2) NOT NULL,
    target_ngn_threshold NUMERIC(15, 2) NOT NULL,
    is_above_threshold BOOLEAN NOT NULL,
    consecutive_compliant_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_daily_snapshot UNIQUE (user_id, snapshot_date)
);

-- Ingested Financial Ledger Transactions
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES financial_accounts(account_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    transaction_type VARCHAR(10) NOT NULL,  -- CREDIT, DEBIT
    amount NUMERIC(15, 2) NOT NULL,
    running_balance NUMERIC(15, 2) NOT NULL,
    dedup_hash VARCHAR(64) UNIQUE NOT NULL,
    ingestion_source VARCHAR(20) NOT NULL,  -- MONO, OKRA, SMS, MBS
    transaction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Anomalies & Source-of-Funds Proofs
CREATE TABLE transaction_anomalies (
    anomaly_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    anomaly_ratio NUMERIC(6, 2) NOT NULL,
    flag_reason VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING_DOCUMENTATION', -- PENDING_DOCUMENTATION, UNDER_REVIEW, APPROVED, REJECTED
    supporting_document_url TEXT,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
Code snippet
http://googleusercontent.com/immersive_entry_chip/2
```eof

http://googleusercontent.com/immersive_entry_chip/3

### Extracted Field Mapping
1. Group 1: Transaction Amount (`Numeric`)
2. Group 2: Masked Account Identifier (`String`)
3. Group 3: Post-transaction Available Balance (`Numeric`)

### Payload Security & HMAC Signing
The Android client serializes parsed SMS transactions into a JSON string and generates a cryptographic signature:

```json
{
  "sender": "GTBank",
  "amount": 250000.00,
  "account_mask": "******4912",
  "available_balance": 18450000.50,
  "timestamp": 1772370000,
  "nonce": "a8f3b9c2-81e0-4a87"
}
HMAC Generator: HMAC-SHA256(PayloadString, SecretKeyStoredInAndroidKeystore).2. Deduplication Pipeline ArchitectureBecause SMS alerts and Open Banking webhooks (Mono/Okra) may report the same transaction, incoming entries pass through a deduplication filter.$$\text{DedupHash} = \text{SHA256}\left(\text{AccountMask} + \text{TransactionAmount} + \left\lfloor \frac{\text{Timestamp}}{300} \right\rfloor \right)$$Windowing: Standardizes timestamps into 5-minute time blocks ($\lfloor \text{Timestamp} / 300 \rfloor$). If a hash match exists within PostgreSQL, the second ingestion entry is dropped as a duplicate.3. MyBankStatement (MBS) Verification SpecificationThe MyBankStatement (MBS) portal provides verified tickets containing official bank statements.Verification SequenceUser enters MBS Ticket Number and Passcode into the application.Basechanfunder backend transmits parameters to the MBS portal API gateway.Basechanfunder receives structured eStatement JSON and the digitally signed source eStatement PDF.Forensic PDF Inspection:Verify digital cryptographic signature of the issuing bank.Verify embedded fonts and check PDF layers for post-generation modifications (e.g., Photoshop or PDF editing layers).Cross-check total credits, debits, opening balance, and closing balance against ingested daily database records.