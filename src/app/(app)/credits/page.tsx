"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Transaction {
  id: string;
  amount: number;
  balance: number;
  type: string;
  description: string;
  createdAt: string;
}

interface CreditsData {
  balance: number;
  transactions: Transaction[];
}

const PACKS = [
  { label: "Starter", credits: 10, price: "$9", perCredit: "$0.90" },
  { label: "Growth", credits: 50, price: "$39", perCredit: "$0.78", popular: true },
  { label: "Scale", credits: 200, price: "$129", perCredit: "$0.65" },
];

export default function CreditsPage() {
  const [data, setData] = useState<CreditsData | null>(null);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Credits</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Each cluster generation costs 1 credit.
        </p>
      </div>

      {/* Balance */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current balance</p>
              <div className="flex items-end gap-2 mt-1">
                <span className={`text-5xl font-bold tabular-nums ${data?.balance === 0 ? "text-destructive" : ""}`}>
                  {data?.balance ?? "—"}
                </span>
                <span className="text-muted-foreground mb-1">credits</span>
              </div>
            </div>
            {data?.balance === 0 && (
              <Badge variant="destructive">Out of credits</Badge>
            )}
            {data !== null && data.balance > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Buy credits */}
      <Card>
        <CardHeader>
          <CardTitle>Buy Credits</CardTitle>
          <CardDescription>Credit purchasing is coming soon. Plans below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {PACKS.map((pack) => (
            <div
              key={pack.label}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                pack.popular ? "border-primary/50 bg-primary/5" : ""
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{pack.label}</p>
                  {pack.popular && (
                    <Badge variant="secondary" className="text-xs">Most popular</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {pack.credits} credits · {pack.perCredit} / credit
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{pack.price}</span>
                <Button size="sm" disabled>
                  Coming soon
                </Button>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            Need credits now?{" "}
            <a href="mailto:hi@clusteroptimizer.com" className="underline underline-offset-2 hover:text-foreground">
              Contact us
            </a>{" "}
            for early access.
          </p>
        </CardContent>
      </Card>

      {/* Transaction history */}
      {data && data.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.transactions.map((tx, i) => (
                <div key={tx.id} className={`flex items-center justify-between px-6 py-3 ${i === 0 ? "" : ""}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        tx.amount > 0 ? "text-green-600" : "text-foreground"
                      }`}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                      {tx.balance} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.transactions.length === 0 && (
        <>
          <Separator />
          <p className="text-sm text-muted-foreground text-center py-4">No transactions yet.</p>
        </>
      )}
    </div>
  );
}
