import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    // parse body with error handling in case of bad JSON
    const body = await req.json();
    const { name, email, phone, address, amount, currency, txId, source, metadata } = body || {};

    // amount and currency may legitimately be 0 or "0" so check for null/undefined instead
    if (amount == null || currency == null) {
      return NextResponse.json({ error: 'missing amount or currency' }, { status: 400 });
    }

    // ensure numeric amount
    const amtNum = Number(amount);
    if (!Number.isFinite(amtNum)) {
      return NextResponse.json({ error: 'invalid amount' }, { status: 400 });
    }

    // normalise currency to string and uppercase
    const cur = String(currency).toUpperCase();

    const supabase = await createServerClient();

    // Convert USD to INR using a fixed rate (configurable via env)
    // helper to coerce env vars to numbers with fallback; similar to lib/utils.parseEnvNumber
    const USD_TO_INR = Number(process.env.NEXT_PUBLIC_USD_TO_INR);
    const usdRate = Number.isFinite(USD_TO_INR) && USD_TO_INR > 0 ? USD_TO_INR : 83;
    let amount_in_inr = 0;
    if (cur === 'USD') {
      amount_in_inr = Math.round(amtNum * usdRate);
    } else {
      // assume amount provided is already INR
      amount_in_inr = Math.round(amtNum);
    }

    const insertPayload: any = {
      name: name || 'Anonymous',
      email: email || null,
      phone: phone || null,
      address: address || null,
      amount: amtNum,
      currency: cur || 'USD',
      amount_in_inr,
      tx_id: txId || null,
      source: source || 'paypal',
      metadata: metadata || null,
    };

    const { data, error } = await supabase.from('donors').insert([insertPayload]).select('*').maybeSingle();
    if (error) {
      console.error('Failed to record donor', error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ donor: data });
  } catch (err: any) {
    console.error('Error in record donation route', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
