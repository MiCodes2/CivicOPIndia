#!/usr/bin/env node
// Verify donor aggregates: compare donor_totals vs sums over donor_daily_totals, donor_city_totals, and raw donors table
// Usage: npx dotenv -e .env.local -- node scripts/verify_donor_aggregates.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

(async function run() {
  try {
    const results = [];

    // Get canonical totals from view
    const { data: totalsData, error: totalsError } = await supabase.from('donor_totals').select('*').maybeSingle();
    if (totalsError) throw totalsError;
    if (!totalsData) {
      console.error('donor_totals view returned no data');
      process.exit(2);
    }
    const canonicalDonorCount = Number(totalsData.donor_count || 0);
    const canonicalTotalInr = Number(totalsData.total_in_inr || 0);

    // Sum over donor_daily_totals
    const { data: daily, error: dailyError } = await supabase.from('donor_daily_totals').select('day, donor_count, total_in_inr');
    if (dailyError) throw dailyError;
    const dailySumDonorCount = daily.reduce((s, r) => s + Number(r.donor_count || 0), 0);
    const dailySumTotalInr = daily.reduce((s, r) => s + Number(r.total_in_inr || 0), 0);

    results.push({
      check: 'daily_totals sum',
      donors: { expected: canonicalDonorCount, actual: dailySumDonorCount, diff: dailySumDonorCount - canonicalDonorCount },
      amount: { expected: canonicalTotalInr, actual: dailySumTotalInr, diff: dailySumTotalInr - canonicalTotalInr }
    });

    // Sum over donor_city_totals
    const { data: cities, error: citiesError } = await supabase.from('donor_city_totals').select('city, donor_count, total_in_inr');
    if (citiesError) throw citiesError;
    const citySumDonorCount = cities.reduce((s, r) => s + Number(r.donor_count || 0), 0);
    const citySumTotalInr = cities.reduce((s, r) => s + Number(r.total_in_inr || 0), 0);

    results.push({
      check: 'city_totals sum',
      donors: { expected: canonicalDonorCount, actual: citySumDonorCount, diff: citySumDonorCount - canonicalDonorCount },
      amount: { expected: canonicalTotalInr, actual: citySumTotalInr, diff: citySumTotalInr - canonicalTotalInr }
    });

    // Raw donors table totals (note: this fetches all donor rows; OK for small demo datasets)
    const { data: raw, error: rawQErr } = await supabase.from('donors').select('id, amount_in_inr');
    if (rawQErr) throw rawQErr;
    const rawSumDonorCount = raw.length;
    const rawSumTotalInr = raw.reduce((s, r) => s + Number(r.amount_in_inr || 0), 0);

    results.push({
      check: 'raw donors sum',
      donors: { expected: canonicalDonorCount, actual: rawSumDonorCount, diff: rawSumDonorCount - canonicalDonorCount },
      amount: { expected: canonicalTotalInr, actual: rawSumTotalInr, diff: rawSumTotalInr - canonicalTotalInr }
    });

    // Print report
    console.log('\nDonor aggregates verification report \n');
    console.log(`Canonical (donor_totals): donors=${canonicalDonorCount}, amount=₹${canonicalTotalInr.toLocaleString()}\n`);

    let failed = false;
    results.forEach(r => {
      const donorsMatch = r.donors.diff === 0;
      const amountMatch = r.amount.diff === 0;
      if (!donorsMatch || !amountMatch) failed = true;

      console.log(`Check: ${r.check}`);
      console.log(`  Donors: expected=${r.donors.expected}, actual=${r.donors.actual}, diff=${r.donors.diff}`);
      console.log(`  Amount: expected=₹${r.amount.expected.toLocaleString()}, actual=₹${r.amount.actual.toLocaleString()}, diff=₹${r.amount.diff.toLocaleString()}`);
      console.log('');
    });

    if (failed) {
      console.error('Verification FAILED: mismatches found.');
      process.exit(3);
    } else {
      console.log('Verification OK: all checks passed ✅');
      process.exit(0);
    }
  } catch (e) {
    console.error('Error during verification:', e);
    process.exit(1);
  }
})();
