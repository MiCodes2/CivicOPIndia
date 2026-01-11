"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PayPalDonate from '@/components/PayPalDonate';
import { Heart } from 'lucide-react';

export default function DonationForm() {
  const donationTiers = [
    { amount: 500, label: 'Supporter' },
    { amount: 2000, label: 'Advocate' },
    { amount: 5000, label: 'Champion' },
    { amount: 10000, label: 'Leader' },
  ];

  const [selectedAmount, setSelectedAmount] = useState<number>(donationTiers[0].amount);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [paypalAmount, setPaypalAmount] = useState<string>('10.00');

  const amountToPay = () => {
    const parsed = parseFloat(customAmount || '0');
    return parsed > 0 ? Math.round(parsed) : selectedAmount; // rupees (integer)
  };

  const getPayPalAmount = () => {
    const a = amountToPay();
    // PayPal expects a decimal string with two places
    return (a).toFixed(2);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Make a Donation</CardTitle>
          <CardDescription className="text-base">Secure payment powered by PayPal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Amount</label>
            <div className="grid grid-cols-2 gap-2">
              {donationTiers.map((tier) => (
                <Button
                  key={tier.amount}
                  variant={tier.amount === selectedAmount ? 'default' : 'outline'}
                  className="h-auto flex-col py-3"
                  onClick={() => {
                    setSelectedAmount(tier.amount);
                    setCustomAmount('');
                  }}
                >
                  <span className="text-lg font-bold">₹{tier.amount}</span>
                  <span className="text-xs text-muted-foreground">{tier.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Or Enter Custom Amount (₹)
            </label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              min="1"
              className="text-lg"
              value={customAmount}
              onChange={(e: any) => setCustomAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Your Name (Optional)
            </label>
            <Input id="name" type="text" placeholder="Anonymous Donor" value={name} onChange={(e: any) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email (For Receipt)</label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e: any) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Phone (Optional)</label>
              <Input id="phone" type="tel" placeholder="+91xxxxxxxxxx" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">Address (Optional)</label>
            <Input id="address" type="text" placeholder="City, State, Country" value={address} onChange={(e: any) => setAddress(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label htmlFor="paypal_amount" className="text-sm font-medium">PayPal Amount (USD)</label>
            <Input
              id="paypal_amount"
              type="number"
              placeholder="10.00"
              min="1"
              step="0.01"
              className="text-lg"
              value={paypalAmount}
              onChange={(e: any) => setPaypalAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Payments are processed in USD via PayPal (default amount: $10).</p>

            <div className="mt-4">
              <PayPalDonate
                amount={paypalAmount || '10.00'}
                currency="USD"
                name={name}
                email={email}
                phone={phone}
                address={address}
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">Your support helps sustain independent civic initiatives and public-interest projects.</p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">🔒 Secure payment • UPI, Cards, Netbanking, Wallets accepted</p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Why Your Support Matters</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-sm">Enable citizens to hold power accountable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sm">Fund critical RTI requests and legal battles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sm">Organize protests and awareness campaigns</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sm">Provide free legal support to affected citizens</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sm">Build a transparent democracy for future generations</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
