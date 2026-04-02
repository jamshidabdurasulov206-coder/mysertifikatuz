-- Base schema: creates all core tables if they don't exist.
-- This migration bootstraps a fresh database so incremental migrations can run.

-- 1) users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  email_verified BOOLEAN DEFAULT false,
  verify_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) subjects
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) tests
CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  price INTEGER DEFAULT 10000,
  time_limit_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) questions
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'multiple',
  options JSONB,
  correct_option INTEGER,
  correct_answer_text TEXT,
  difficulty_level NUMERIC DEFAULT 1.0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) attempts
CREATE TABLE IF NOT EXISTS attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  answers JSONB,
  score NUMERIC,
  final_score NUMERIC,
  subject_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  is_reviewed BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  written_scores JSONB,
  final_theta_score NUMERIC,
  z_score NUMERIC,
  t_score NUMERIC,
  standard_ball NUMERIC,
  level VARCHAR(50),
  raw_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) orders (Payme integration)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255),
  payme_time BIGINT,
  state INTEGER DEFAULT 0,
  cancel_time BIGINT,
  reason INTEGER,
  amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7) manual_payments
CREATE TABLE IF NOT EXISTS manual_payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER REFERENCES tests(id) ON DELETE SET NULL,
  amount NUMERIC DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'UZS',
  status VARCHAR(20) DEFAULT 'pending',
  receipt_url TEXT,
  comment TEXT,
  approver_id INTEGER REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8) test_sessions
CREATE TABLE IF NOT EXISTS test_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT false
);

-- 9) support_messages
CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10) audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
