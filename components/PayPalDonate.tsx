"use client";

import React, { useEffect, useRef, useState } from 'react';

type Props = { amount?: string; currency?: string; name?: string; email?: string; phone?: string; address?: string };

export default function PayPalDonate({ amount = '10.00', currency = 'USD', name, email, phone, address }: Props & { name?: string; email?: string; phone?: string; address?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

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
          return actions.order.capture().then(async function (details: any) {
            const txId = details.id || (details.purchase_units && details.purchase_units[0]?.payments?.captures?.[0]?.id) || '';

            // Record donor on server
            try {
              await fetch('/api/donations/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: name || null,
                  email: email || null,
                  phone: phone || null,
                  address: address || null,
                  amount: amount,
                  currency: currency,
                  txId: txId,
                  source: 'paypal',
                  metadata: details
                })
              });
            } catch (e) {
              // ignore recording failures for now, but log
              console.warn('Failed to record donor on server', e);
            }

            const container = containerRef.current;
            if (container) {
              container.innerHTML = `<div class="p-4 border rounded bg-primary/10 border-primary/20 text-primary">
                <strong>Thank you!</strong> Payment completed.${txId ? ' Transaction ID: ' + txId : ''}
              </div>`;
              // reload page after short delay so totals update
              setTimeout(() => { try { window.location.reload(); } catch (e) {} }, 900);
            } else {
              alert('Thank you for supporting civic initiatives!');
              try { window.location.reload(); } catch (e) {}
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
        setError(errMsg + '. Please try disabling ad-blockers or try a different browser.');
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
          <div className="mt-1">Possible fixes: disable ad-blocker or privacy extensions, or try a different browser.</div>
          <div className="mt-2">
            <div className="text-sm">Try disabling ad-blockers or privacy extensions, or try another browser.</div>
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
