import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, address, amount, currency, txId, source, metadata } = body;
    if (!amount || !currency) {
      return NextResponse.json({ error: 'missing amount or currency' }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Convert USD to INR using a fixed rate (configurable via env)
    const USD_TO_INR = parseFloat(process.env.NEXT_PUBLIC_USD_TO_INR || '83');
    let amount_in_inr = 0;
    if (currency.toUpperCase() === 'USD') {
      amount_in_inr = Math.round(parseFloat(amount) * USD_TO_INR);
    } else {
      // assume amount provided is already INR
      amount_in_inr = Math.round(parseFloat(amount));
    }

    const insertPayload: any = {
      name: name || 'Anonymous',
      email: email || null,
      phone: phone || null,
      address: address || null,
      amount: parseFloat(amount) || 0,
      currency: currency || 'USD',
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
