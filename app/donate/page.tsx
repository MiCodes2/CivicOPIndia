import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart } from "lucide-react";

export default function DonatePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Support Our Mission</h1>
          <p className="mt-2 text-muted-foreground">
            Your contribution helps us fight for transparency and accountability
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Make a Donation</CardTitle>
            <CardDescription>
              Razorpay integration will be configured here
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount (₹)
              </label>
              <Input
                id="amount"
                type="number"
                placeholder="500"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Your Name (Optional)
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Anonymous"
              />
            </div>
            <Button className="w-full" size="lg">
              Proceed to Payment
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Secure payment powered by Razorpay • UPI, Cards, Netbanking accepted
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
