-- 20260401_add_rasch_fields_to_attempts.sql
-- Rasch modeli uchun kerakli ustunlar qo'shish

ALTER TABLE attempts
ADD COLUMN IF NOT EXISTS z_score numeric,
ADD COLUMN IF NOT EXISTS t_score numeric,
ADD COLUMN IF NOT EXISTS standard_ball numeric,
ADD COLUMN IF NOT EXISTS level varchar(10);
