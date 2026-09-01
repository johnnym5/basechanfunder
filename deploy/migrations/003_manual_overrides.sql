-- Manual Ledger Adjustments Table
CREATE TABLE manual_ledger_adjustments (
    adjustment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    performed_by_user_id UUID NOT NULL REFERENCES users(user_id),
    adjustment_type VARCHAR(20) NOT NULL, -- 'BALANCE_DEPOSIT', 'BALANCE_DEDUCT', 'DAYS_ADD', 'DAYS_SET'
    amount_ngn NUMERIC(15, 2) DEFAULT 0.00,
    days_delta INTEGER DEFAULT 0,
    audit_reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for student history retrieval
CREATE INDEX idx_manual_adjustments_student ON manual_ledger_adjustments(student_id);
