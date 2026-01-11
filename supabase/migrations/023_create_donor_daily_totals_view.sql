-- 023_create_donor_daily_totals_view.sql

-- View: donor_daily_totals
-- Aggregated total INR amount per day
CREATE OR REPLACE VIEW donor_daily_totals AS
SELECT
  date_trunc('day', created_at)::date as day,
  COUNT(*)::int as donor_count,
  COALESCE(SUM(amount_in_inr), 0)::bigint as total_in_inr
FROM donors
GROUP BY date_trunc('day', created_at)
ORDER BY day ASC;
