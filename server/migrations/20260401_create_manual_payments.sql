CREATE TABLE IF NOT EXISTS manual_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id INTEGER REFERENCES tests(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'UZS',
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
    receipt_url TEXT,
    comment TEXT,
    approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT manual_payments_status_check CHECK (status IN ('pending','approved','rejected'))
);

CREATE INDEX IF NOT EXISTS idx_manual_payments_user ON manual_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_test ON manual_payments(test_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON manual_payments(status);
