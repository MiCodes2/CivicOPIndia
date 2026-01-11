-- Add initial_likes_count and initial_shares_count to activities
BEGIN;

ALTER TABLE IF EXISTS public.activities
  ADD COLUMN IF NOT EXISTS initial_likes_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS initial_shares_count integer NOT NULL DEFAULT 0;

    -- Backfill existing rows: set initial_* to current counts where they are zero
    UPDATE public.activities
      SET initial_likes_count = COALESCE(likes_count, 0)
        WHERE initial_likes_count IS NULL OR initial_likes_count = 0;

        UPDATE public.activities
          SET initial_shares_count = COALESCE(shares_count, 0)
            WHERE initial_shares_count IS NULL OR initial_shares_count = 0;

            COMMIT;            npx dotenv-cli -e .env.local -- node scripts/soft_reduce_caps.js \
              && npx dotenv-cli -e .env.local -- node scripts/fix_initial_counts.js \
              && npx dotenv-cli -e .env.local -- node scripts/seed_all_activities.js \
              && npx dotenv-cli -e .env.local -- node scripts/report_inflated.js            npx dotenv-cli -e .env.local -- node scripts/soft_reduce_caps.js \
              && npx dotenv-cli -e .env.local -- node scripts/fix_initial_counts.js \
              && npx dotenv-cli -e .env.local -- node scripts/seed_all_activities.js \
              && npx dotenv-cli -e .env.local -- node scripts/report_inflated.js            npx dotenv-cli -e .env.local -- node scripts/soft_reduce_caps.js \
              && npx dotenv-cli -e .env.local -- node scripts/fix_initial_counts.js \
              && npx dotenv-cli -e .env.local -- node scripts/seed_all_activities.js \
              && npx dotenv-cli -e .env.local -- node scripts/report_inflated.js            npx dotenv-cli -e .env.local -- node scripts/overwrite_with_seeds.js \
              && npx dotenv-cli -e .env.local -- node scripts/seed_all_activities.js \
              && npx dotenv-cli -e .env.local -- node scripts/report_inflated.js