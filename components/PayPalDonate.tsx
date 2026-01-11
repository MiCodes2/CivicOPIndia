"use client";

import React, { useEffect, useRef, useState } from 'react';

type Props = { amount?: string; currency?: string };

export default function PayPalDonate({ amount = '10.00', currency = 'USD' }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const fallbackBusiness = process.env.NEXT_PUBLIC_PAYPAL_BUSINESS_EMAIL || '';
  const fallbackUrl = fallbackBusiness
    ? `https://www.paypal.com/donate?business=${encodeURIComponent(fallbackBusiness)}&currency_code=${currency}&amount=${amount}`
    : `https://www.paypal.com/donate`;

  useEffect(() => {
    let mounted = true;
    const scriptId = 'paypal-sdk';
    const clientId = 'AfBwj6FGBpVCgNNIV96r5iQ2p3ipb87Qe3BqWfD5lDkp7pO5CJgENCZsJlYagQwE_d1fuE6Lt_rNCDgN';

    const removeExistingScript = (existing: HTMLScriptElement) => {
      try {
        existing.remove();
        try { delete (window as any).paypal; } catch { (window as any).paypal = undefined; }
      } catch {}
    };

    const ensureScript = (tries = 3, timeoutMs = 15000) => {
      return new Promise<void>(async (resolve, reject) => {
        const existing = document.querySelector(`script#${scriptId}`) as HTMLScriptElement | null || document.querySelector(`script[src*="paypal.com/sdk/js"]`) as HTMLScriptElement | null;

        if (existing) {
          if (existing.src.includes(`client-id=${clientId}`) && existing.src.includes(`currency=${currency}`)) {
            if ((window as any).paypal) return resolve();
            const onLoad = () => resolve();
            const onError = () => reject('PayPal SDK failed to load');
            existing.addEventListener('load', onLoad, { once: true });
            existing.addEventListener('error', onError, { once: true });
            return;
          }
          removeExistingScript(existing);
        }

        const tryLoad = () => {
          return new Promise<void>((res, rej) => {
            const script = document.createElement('script');
            script.id = scriptId;
            // Use standard Checkout intent=capture (merchant flow). Easy to switch client-id to Live.
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture`;
            script.async = true;

            const safeRemove = () => {
              try {
                script.remove();
              } catch (e) {
                // ignore removal errors (some browsers or extensions may block it)
              }
            };

            const onLoad = () => { clearTimeout(timeout); res(); };
            const onError = () => {
              try {
                clearTimeout(timeout);
                safeRemove();
              } catch (e) {
                // ignore
              }
              rej('PayPal SDK failed to load');
            };

            script.addEventListener('load', onLoad, { once: true });
            script.addEventListener('error', onError, { once: true });

            const timeout = setTimeout(() => { try { safeRemove(); } catch {} ; rej('PayPal SDK load timed out'); }, timeoutMs);

            document.body.appendChild(script);
          });
        };

        for (let i = 0; i < tries; i++) {
          try {
            await tryLoad();
            return resolve();
          } catch (e) {
            if (i === tries - 1) return reject(e);
            await new Promise((r) => setTimeout(r, 800));
          }
        }
      });
    };

    const renderButtons = () => {
      const container = containerRef.current;
      if (!container || !(window as any).paypal) return;
      container.innerHTML = '';
      (window as any).paypal.Buttons({
        style: { label: 'pay' }, // standard Pay button (merchant flow)
        createOrder: function (data: any, actions: any) {
          return actions.order.create({
            purchase_units: [{
              amount: { value: amount, currency_code: currency },
              description: 'Support civic initiatives'
            }]
          });
        },
        onApprove: function (data: any, actions: any) {
          return actions.order.capture().then(function (details: any) {
            // show a nicer in-page success message instead of alert
            const txId = details.id || (details.purchase_units && details.purchase_units[0]?.payments?.captures?.[0]?.id) || '';
            const container = containerRef.current;
            if (container) {
              container.innerHTML = `<div style="padding:1rem;border:1px solid #d1d5db;border-radius:6px;background:#ecfdf5;color:#065f46;">
                <strong>Thank you!</strong> Payment completed.${txId ? ' Transaction ID: ' + txId : ''}
              </div>`;
            } else {
              alert('Thank you for supporting civic initiatives!');
            }
          });
        }
      }).render(container);
    };

    setError(null);
    ensureScript()
      .then(() => {
        if (!mounted) return;
        renderButtons();
      })
      .catch((err: any) => {
        const errMsg = typeof err === 'string' ? err : (err?.message || String(err));
        console.warn('PayPal SDK load error:', errMsg);
        if (!mounted) return;
        setError(errMsg + '. Please try disabling ad-blockers or click the direct PayPal link below.');
      });

    return () => {
      mounted = false;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [amount, currency, retryKey]);

  return (
    <div>
      <div className="mb-2 font-medium">Support Civic Initiatives</div>
      <div ref={containerRef} id="paypal-donate-button" />

      <p className="mt-3 text-sm text-muted-foreground">Voluntary contribution to support civic initiatives. This is not a tax-deductible donation.</p>

      {error && (
        <div className="mt-2 text-center text-sm text-red-600">
          <div className="font-medium">{error}</div>
          <div className="mt-1">Possible fixes: disable ad-blocker or privacy extensions, try a different browser, or click the direct PayPal link below.</div>
          <div className="mt-2">
            <a className="underline" href={fallbackUrl} target="_blank" rel="noreferrer">Donate via PayPal website</a>
          </div>
          <div className="mt-2">
            <button
              className="underline"
              onClick={() => {
                setError(null);
                setRetryKey((k) => k + 1);
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
