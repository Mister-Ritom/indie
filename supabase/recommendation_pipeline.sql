-- =============================================================================
-- RECOMMENDATION PIPELINE MIGRATION
-- Written against the exact live schema. Safe to run once.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ---------------------------------------------------------------------------
-- 1. Add missing columns to existing tables
-- ---------------------------------------------------------------------------

-- pins: ai_labels (multi-label content fingerprint, written by process-pin)
ALTER TABLE pins ADD COLUMN IF NOT EXISTS ai_labels JSONB DEFAULT NULL;

-- pins: updated_at
ALTER TABLE pins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Interaction tables: flag for batch scoring job (NOT real-time triggers)
ALTER TABLE likes     ADD COLUMN IF NOT EXISTS processed_for_scores BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE saves     ADD COLUMN IF NOT EXISTS processed_for_scores BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE comments  ADD COLUMN IF NOT EXISTS processed_for_scores BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE follows   ADD COLUMN IF NOT EXISTS processed_for_scores BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pin_views ADD COLUMN IF NOT EXISTS processed_for_scores BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------------------------------------------------------------------------
-- 2. Create user_interest_scores
-- Stores the per-user per-label taste profile, populated by the batch job.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_interest_scores (
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label      TEXT        NOT NULL,
  score      FLOAT       NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, label)
);

ALTER TABLE user_interest_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own interest scores" ON user_interest_scores;
CREATE POLICY "Users can read own interest scores"
  ON user_interest_scores FOR SELECT
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

-- Partial indexes on unprocessed rows — tiny and hot, very cheap to scan
CREATE INDEX IF NOT EXISTS idx_likes_unprocessed
  ON likes (processed_for_scores) WHERE processed_for_scores = FALSE;

CREATE INDEX IF NOT EXISTS idx_saves_unprocessed
  ON saves (processed_for_scores) WHERE processed_for_scores = FALSE;

CREATE INDEX IF NOT EXISTS idx_comments_unprocessed
  ON comments (processed_for_scores) WHERE processed_for_scores = FALSE;

CREATE INDEX IF NOT EXISTS idx_pin_views_unprocessed
  ON pin_views (processed_for_scores) WHERE processed_for_scores = FALSE;

-- Taste vector lookup in the feed RPC
CREATE INDEX IF NOT EXISTS idx_user_interest_scores_lookup
  ON user_interest_scores (user_id, label);

-- GIN index for JSONB label scanning on pins
CREATE INDEX IF NOT EXISTS idx_pins_ai_labels
  ON pins USING GIN (ai_labels jsonb_path_ops);

-- ---------------------------------------------------------------------------
-- 4. Batch scoring function
-- Runs every 30 min via pg_cron. NOT a trigger — never fires per row.
-- Cost: one write batch per cron tick regardless of interaction volume.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_user_interest_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  WITH unprocessed AS (
    SELECT user_id, pin_id, 2.0 AS weight FROM likes     WHERE processed_for_scores = FALSE
    UNION ALL
    SELECT user_id, pin_id, 3.0 AS weight FROM saves     WHERE processed_for_scores = FALSE
    UNION ALL
    SELECT user_id, pin_id, 2.5 AS weight FROM comments  WHERE processed_for_scores = FALSE
    UNION ALL
    SELECT user_id, pin_id, 0.5 AS weight FROM pin_views WHERE processed_for_scores = FALSE
  ),
  label_deltas AS (
    SELECT
      u.user_id,
      (label_el->>'label')                        AS label,
      SUM(u.weight * (label_el->>'score')::float) AS delta
    FROM unprocessed u
    JOIN pins p ON p.id = u.pin_id AND p.ai_labels IS NOT NULL
    CROSS JOIN LATERAL jsonb_array_elements(p.ai_labels) AS label_el
    GROUP BY u.user_id, label_el->>'label'
  )
  INSERT INTO user_interest_scores (user_id, label, score, updated_at)
  SELECT user_id, label, delta, NOW()
  FROM label_deltas
  ON CONFLICT (user_id, label)
  DO UPDATE SET
    score      = LEAST(user_interest_scores.score + EXCLUDED.score, 500),
    updated_at = NOW();

  -- Bulk-mark processed (one UPDATE per table, not per row)
  UPDATE likes     SET processed_for_scores = TRUE WHERE processed_for_scores = FALSE;
  UPDATE saves     SET processed_for_scores = TRUE WHERE processed_for_scores = FALSE;
  UPDATE comments  SET processed_for_scores = TRUE WHERE processed_for_scores = FALSE;
  UPDATE pin_views SET processed_for_scores = TRUE WHERE processed_for_scores = FALSE;

  RAISE LOG 'update_user_interest_scores: completed at %', NOW();
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. pg_cron schedule — every 30 minutes
-- Safe to re-run: cron.schedule upserts by job name.
-- ---------------------------------------------------------------------------
SELECT cron.schedule(
  'refresh-user-interest-scores',
  '*/30 * * * *',
  'SELECT update_user_interest_scores()'
);

-- ---------------------------------------------------------------------------
-- 6. Improved get_feed_pins RPC
-- Drop the old single-signal version, replace with multi-signal dot product.
-- Same name + same input signature — no client changes needed.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_feed_pins(UUID, INT, INT);

CREATE OR REPLACE FUNCTION get_feed_pins(
  viewer_id   UUID,
  page_limit  INT,
  page_offset INT
)
RETURNS TABLE (id UUID, score FLOAT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH
    user_taste AS (
      SELECT label, LEAST(user_interest_scores.score, 500) AS score
      FROM user_interest_scores
      WHERE user_id = viewer_id
    ),
    pin_pop AS (
      SELECT pin_id,
        COUNT(*) FILTER (WHERE src = 'l') * 1.0
        + COUNT(*) FILTER (WHERE src = 's') * 1.5 AS popularity
      FROM (
        SELECT pin_id, 'l' AS src FROM likes
        UNION ALL
        SELECT pin_id, 's' AS src FROM saves
      ) e
      GROUP BY pin_id
    )
  SELECT
    p.id,
    (
      -- Dot product: user taste vector × pin label vector
      COALESCE((
        SELECT SUM(ut.score * (el->>'score')::float)
        FROM jsonb_array_elements(p.ai_labels) el
        JOIN user_taste ut ON ut.label = el->>'label'
      ), 0.1)

      -- Onboarding interest fallback (keeps new users' feeds relevant)
      + COALESCE(ui.weight, 0) * 0.5

      -- Followed-creator boost
      + CASE WHEN f.follower_id IS NOT NULL THEN 2.0 ELSE 0.0 END

      -- Global popularity (small weight to avoid rich-get-richer)
      + COALESCE(pp.popularity, 0) * 0.03
    )
    -- Log-curve recency decay
    / GREATEST(LN(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0 + 2), 0.1)
    AS score

  FROM pins p
  LEFT JOIN user_interests ui ON ui.interest_id = p.interest_id
                              AND ui.user_id = viewer_id
  LEFT JOIN follows f         ON f.follower_id = viewer_id
                              AND f.following_id = p.user_id
  LEFT JOIN pin_pop pp        ON pp.pin_id = p.id

  WHERE p.user_id != viewer_id
  ORDER BY score DESC
  LIMIT page_limit OFFSET page_offset;
END;
$$;
