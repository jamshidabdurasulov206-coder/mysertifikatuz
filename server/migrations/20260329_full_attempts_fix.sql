-- attempts jadvalini to'liq yangilash va tozalash
ALTER TABLE attempts
  ADD COLUMN IF NOT EXISTS is_reviewed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS written_scores JSONB,
  ADD COLUMN IF NOT EXISTS final_theta_score FLOAT;

-- Eski noto‘g‘ri qiymatlarni NULL qilib tozalash
UPDATE attempts SET is_reviewed = NULL WHERE is_reviewed = '' OR is_reviewed = '[]';
UPDATE attempts SET is_published = NULL WHERE is_published = '' OR is_published = '[]';

-- Ustun tipini majburan BOOLEAN qilib o'zgartirish
ALTER TABLE attempts ALTER COLUMN is_reviewed TYPE BOOLEAN USING (
  CASE
    WHEN is_reviewed = 't' OR is_reviewed = 'true' OR is_reviewed = '1' OR is_reviewed = '[v]' THEN true
    ELSE false
  END
);
ALTER TABLE attempts ALTER COLUMN is_reviewed SET DEFAULT false;

ALTER TABLE attempts ALTER COLUMN is_published TYPE BOOLEAN USING (
  CASE
    WHEN is_published = 't' OR is_published = 'true' OR is_published = '1' OR is_published = '[v]' THEN true
    ELSE false
  END
);
ALTER TABLE attempts ALTER COLUMN is_published SET DEFAULT false;

-- Barcha NULL qiymatlarni false qilib yangilash
UPDATE attempts SET is_reviewed = false WHERE is_reviewed IS NULL;
UPDATE attempts SET is_published = false WHERE is_published IS NULL;
