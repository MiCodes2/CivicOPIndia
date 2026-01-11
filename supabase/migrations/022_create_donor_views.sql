-- 022_create_donor_views.sql

-- View: donor_city_totals
-- Aggregated donor counts and total INR amount per city (address)
CREATE OR REPLACE VIEW donor_city_totals AS
SELECT
  address::text as city,
  COUNT(*)::int as donor_count,
  COALESCE(SUM(amount_in_inr), 0)::bigint as total_in_inr
FROM donors
GROUP BY address
ORDER BY total_in_inr DESC;

-- View: donor_totals
-- Overall donor metrics
CREATE OR REPLACE VIEW donor_totals AS
SELECT
  COUNT(*)::int as donor_count,
  COALESCE(SUM(amount_in_inr),0)::bigint as total_in_inr
FROM donors;
