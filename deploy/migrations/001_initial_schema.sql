-- Basechanfunder Core Database Schema
-- Migration 001: Task 1.1 Initial Schema setup

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Definitions
CREATE TYPE user_role AS ENUM ('APPLICANT', 'STAFF_AUDITOR', 'ADMIN_GOVERNANCE');
CREATE TYPE account_type AS ENUM ('OPEN_BANKING', 'MANUAL_STATEMENT', 'SMS_WEBHOOK');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VALIDATED', 'FLAGGED', 'REJECTED');
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'APPLICANT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial Accounts
CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_name VARCHAR(255) NOT NULL,
    account_number_hash VARCHAR(255) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GBP',
    type account_type NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily Balances (28-day Matrix Engine input)
CREATE TABLE daily_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
    balance_date DATE NOT NULL,
    closing_balance NUMERIC(15, 2) NOT NULL,
    gbp_equivalent NUMERIC(15, 2) NOT NULL,
    fx_rate_used NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_account_date UNIQUE (account_id, balance_date)
);

-- Proof of Funds Evaluations
CREATE TABLE pof_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_amount_gbp NUMERIC(15, 2) NOT NULL,
    min_28day_balance_gbp NUMERIC(15, 2) NOT NULL,
    required_fx_buffer_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    status verification_status NOT NULL DEFAULT 'PENDING',
    risk_level risk_level NOT NULL DEFAULT 'LOW',
    anomaly_ratio NUMERIC(5, 4) DEFAULT 0.0000,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Compliance Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance & Lookup Indexes
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_financial_accounts_user_id ON financial_accounts(user_id);
CREATE INDEX idx_daily_balances_account_date ON daily_balances(account_id, balance_date);
CREATE INDEX idx_pof_evaluations_user_status ON pof_evaluations(user_id, status);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
