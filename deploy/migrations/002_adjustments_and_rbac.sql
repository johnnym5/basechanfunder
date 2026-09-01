-- Basechanfunder Funding & Timeline Adjustment Hub + RBAC Migration
-- Migration 002: Adjustments and RBAC Schema Setup

-- 1. Extend user_role enum to support COUNSELOR if not already present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('APPLICANT', 'STAFF_AUDITOR', 'ADMIN_GOVERNANCE', 'COUNSELOR');
    ELSE
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'COUNSELOR';
    END IF;
END $$;

-- 2. Create Enums for Adjustments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adjustment_type') THEN
        CREATE TYPE adjustment_type AS ENUM (
            'FUNDING_TARGET',
            'TIMELINE_EXTENSION',
            'FX_BUFFER_OVERRIDE',
            'DOCUMENT_AMENDMENT'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adjustment_status') THEN
        CREATE TYPE adjustment_status AS ENUM (
            'PENDING',
            'UNDER_REVIEW',
            'APPROVED',
            'REJECTED',
            'CANCELLED'
        );
    END IF;
END $$;

-- 3. Student-Counselor Mapping Table (RBAC Scoping)
CREATE TABLE IF NOT EXISTS student_counselor_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    counselor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_counselor_student_mapping UNIQUE (counselor_id, student_id)
);

-- 4. Adjustment Requests Table (24-Hour Grace Period & Governance)
CREATE TABLE IF NOT EXISTS adjustment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counselor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    request_type adjustment_type NOT NULL,
    current_value NUMERIC(15, 2),
    requested_value NUMERIC(15, 2),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    reason TEXT NOT NULL,
    supporting_document_url VARCHAR(512),
    status adjustment_status NOT NULL DEFAULT 'PENDING',
    grace_period_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Performance & Scoping Indexes
CREATE INDEX IF NOT EXISTS idx_student_counselor_counselor_id ON student_counselor_mappings(counselor_id);
CREATE INDEX IF NOT EXISTS idx_student_counselor_student_id ON student_counselor_mappings(student_id);
CREATE INDEX IF NOT EXISTS idx_student_counselor_active ON student_counselor_mappings(is_active);

CREATE INDEX IF NOT EXISTS idx_adjustment_requests_student_id ON adjustment_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_requests_counselor_id ON adjustment_requests(counselor_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_requests_status ON adjustment_requests(status);
CREATE INDEX IF NOT EXISTS idx_adjustment_requests_grace_period ON adjustment_requests(grace_period_expires_at);
CREATE INDEX IF NOT EXISTS idx_adjustment_requests_created_at ON adjustment_requests(created_at);
