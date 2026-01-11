-- 021_seed_donors.sql (updated)
-- Insert 109 donor rows that sum to ₹700,000
-- Requirements implemented:
-- - Varied realistic Indian names from across states and some international names
-- - City only in address
-- - Emails and phone numbers hidden (NULL)
-- - Realistic created_at dates spread over the past ~2 years
-- - Final donor amount computed to make total exactly ₹700,000

BEGIN;

-- Remove any previous seed rows to make this idempotent for dev
DELETE FROM donors WHERE source = 'seed';

-- Create temporary arrays for names and cities so they are available across multiple statements
CREATE TEMP TABLE seed_names (a text[]);
INSERT INTO seed_names (a) VALUES (ARRAY[
  'Amit Sharma', 'Priya Singh', 'Ravi Kumar', 'Sangeeta Patel', 'Rahul Menon',
  'Anita Rao', 'Vikram Desai', 'Neha Choudhury', 'Arjun Reddy', 'Pooja Gupta',
  'Sanjay Thakur', 'Karan Verma', 'Meera Nair', 'Rakesh Yadav', 'Sunita Bose',
  'Deepak Naik', 'Farhan Khan', 'Aisha Sheikh', 'Sridhar Iyer', 'Maya Dsouza',
  'Ritu Kapoor', 'Gopal Das', 'Latha Menon', 'Vineet Joshi', 'Manoj Tiwari',
  'Rohit Sinha', 'Isha Malhotra', 'Anand Prakash', 'Pavan Kumar', 'Neelam Singh',
  'Harish Kumar', 'Shreya Rao', 'Abhishek Sharma', 'Iqbal Hussain', 'Dinesh Kumar',
  'Kavita Reddy', 'Zoya Khan', 'Anupam Bose', 'Lakshmi Pillai', 'Sajid Khan',
  -- a few international names
  'John Smith', 'Emma Johnson', 'Liu Wei', 'Carlos Gomez', 'Aisha Ahmed'
]);

CREATE TEMP TABLE seed_cities (c text[]);
INSERT INTO seed_cities (c) VALUES (ARRAY[
  'Mumbai','Delhi','Bengaluru','Chennai','Kolkata','Lucknow','Patna','Jaipur','Kochi','Bhubaneswar',
  'Gandhinagar','Hyderabad','Thiruvananthapuram','Panaji','Srinagar','Leh','Guwahati','Shimla','Dehradun','Madurai',
  'Agra','Indore','Pune','Surat','Vadodara','Nagpur','Visakhapatnam','Varanasi','Raipur','Ranchi','Chandigarh',
  'Imphal','Itanagar','Kohima','Gangtok','Aizawl','Thane','Noida','London','New York','Dubai','Singapore'
]);

-- Group 1: 60 small donors (₹500 - ₹2,000)
INSERT INTO donors (name, email, phone, address, amount, currency, amount_in_inr, source, created_at)
SELECT
  (SELECT a[((g-1) % array_length(a,1)) + 1] FROM seed_names) as name,
  NULL as email,
  NULL as phone,
  (SELECT c[((g-1) % array_length(c,1)) + 1] FROM seed_cities) as address,
  (amt)::numeric as amount,
  'INR'::varchar as currency,
  amt::bigint as amount_in_inr,
  'seed'::text as source,
  now() - (((g*3) % 720) || ' days')::interval as created_at
FROM generate_series(1,60) as g
CROSS JOIN LATERAL (
  SELECT (floor((500 + ((g * 83) % 1500)) / 50)::int * 50) as amt
) as a; 

-- Group 2: 30 medium donors (₹2,000 - ₹5,000)
INSERT INTO donors (name, email, phone, address, amount, currency, amount_in_inr, source, created_at)
SELECT
  (SELECT a[((90+g-1) % array_length(a,1)) + 1] FROM seed_names) as name,
  NULL, NULL,
  (SELECT c[((90+g-1) % array_length(c,1)) + 1] FROM seed_cities) as address,
  (amt)::numeric as amount,
  'INR', amt::bigint, 'seed', now() - (((90+g)*4) % 720 || ' days')::interval
FROM generate_series(1,30) as g
CROSS JOIN LATERAL (
  SELECT (floor((2000 + ((g * 97) % 3000)) / 100)::int * 100) as amt
) as a; 

-- Group 3: 14 larger donors (₹5,000 - ₹20,000)
INSERT INTO donors (name, email, phone, address, amount, currency, amount_in_inr, source, created_at)
SELECT
  (SELECT a[((120+g-1) % array_length(a,1)) + 1] FROM seed_names) as name,
  NULL, NULL,
  (SELECT c[((120+g-1) % array_length(c,1)) + 1] FROM seed_cities) as address,
  (amt)::numeric as amount,
  'INR', amt::bigint, 'seed', now() - (((120+g)*7) % 720 || ' days')::interval
FROM generate_series(1,14) as g
CROSS JOIN LATERAL (
  SELECT (floor((5000 + ((g * 137) % 15000)) / 100)::int * 100) as amt
) as a; 

-- Group 4: 4 major donors (~₹40k - ₹60k)
INSERT INTO donors (name, email, phone, address, amount, currency, amount_in_inr, source, created_at)
SELECT
  (SELECT a[((140+g-1) % array_length(a,1)) + 1] FROM seed_names) as name,
  NULL, NULL,
  (SELECT c[((140+g-1) % array_length(c,1)) + 1] FROM seed_cities) as address,
  (amt)::numeric as amount,
  'INR', amt::bigint, 'seed', now() - (((140+g)*11) % 720 || ' days')::interval
FROM generate_series(1,4) as g
CROSS JOIN LATERAL (
  SELECT (floor((40000 + ((g * 311) % 20001)) / 1000)::int * 1000) as amt
) as a; 

-- Final donor: compute remainder so total is exactly 700,000
INSERT INTO donors (name, email, phone, address, amount, currency, amount_in_inr, source, created_at)
SELECT
  'Major Supporter' as name,
  NULL as email,
  NULL as phone,
  'Mumbai' as address,
  remainder::numeric as amount,
  'INR' as currency,
  remainder::bigint as amount_in_inr,
  'seed' as source,
  now() - '2 days'::interval as created_at
FROM (
  SELECT (700000 - COALESCE(SUM(amount_in_inr),0)) as remainder FROM donors WHERE source = 'seed'
) t
WHERE (700000 - COALESCE((SELECT SUM(amount_in_inr) FROM donors WHERE source='seed'),0)) > 0;

COMMIT;

-- Verify totals (optional):
-- select count(*) as donors, sum(amount_in_inr) as total_inr from donors where source='seed'; -- should be 109 and 700000

