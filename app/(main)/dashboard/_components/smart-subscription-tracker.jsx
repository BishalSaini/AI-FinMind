"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RepeatIcon, Bell, DollarSign, Calendar, Sparkles, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SmartSubscriptionTracker({ transactions = [] }) {
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    if (transactions.length > 0) {
      const detected = detectSubscriptions(transactions);
      setSubscriptions(detected);
    }
  }, [transactions]);

  const detectSubscriptions = (txns) => {
    // Group transactions by description/merchant
    const merchantGroups = {};
    
    txns.filter(t => t.type === 'EXPENSE').forEach(t => {
      const key = t.description?.toLowerCase() || t.category;
      if (!merchantGroups[key]) {
        merchantGroups[key] = [];
      }
      merchantGroups[key].push(t);
    });

    const recurringPayments = [];

    // Detect recurring patterns
    Object.entries(merchantGroups).forEach(([, txnList]) => {
      if (txnList.length < 2) return; // Need at least 2 transactions

      // Sort by date
      const sorted = txnList.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Check for consistent amounts
      const amounts = sorted.map(t => t.amount);
      const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const isConsistentAmount = amounts.every(amt => Math.abs(amt - avgAmount) < avgAmount * 0.1); // Within 10%

      if (!isConsistentAmount) return;

      // Calculate time differences between transactions
      const timeDiffs = [];
      for (let i = 1; i < sorted.length; i++) {
        const diff = (new Date(sorted[i].date) - new Date(sorted[i-1].date)) / (1000 * 60 * 60 * 24); // days
        timeDiffs.push(diff);
      }

      const avgInterval = timeDiffs.reduce((sum, d) => sum + d, 0) / timeDiffs.length;
      
      // Detect frequency pattern
      let frequency = 'Unknown';
      let nextPayment = null;
      let isActive = true;

      if (avgInterval >= 28 && avgInterval <= 32) {
        frequency = 'Monthly';
        nextPayment = new Date(sorted[sorted.length - 1].date);
        nextPayment.setDate(nextPayment.getDate() + 30);
      } else if (avgInterval >= 7 && avgInterval <= 8) {
        frequency = 'Weekly';
        nextPayment = new Date(sorted[sorted.length - 1].date);
        nextPayment.setDate(nextPayment.getDate() + 7);
      } else if (avgInterval >= 88 && avgInterval <= 95) {
        frequency = 'Quarterly';
        nextPayment = new Date(sorted[sorted.length - 1].date);
        nextPayment.setDate(nextPayment.getDate() + 90);
      } else if (avgInterval >= 360 && avgInterval <= 370) {
        frequency = 'Yearly';
        nextPayment = new Date(sorted[sorted.length - 1].date);
        nextPayment.setDate(nextPayment.getDate() + 365);
      }

      // Check if subscription is still active (last payment within expected interval)
      if (nextPayment) {
        const daysSinceLastPayment = (new Date() - new Date(sorted[sorted.length - 1].date)) / (1000 * 60 * 60 * 24);
        const expectedInterval = avgInterval;
        
        if (daysSinceLastPayment > expectedInterval * 1.5) {
          isActive = false; // Likely canceled
        }
      }

      if (frequency !== 'Unknown') {
        // Calculate annual cost
        let annualCost = 0;
        if (frequency === 'Monthly') annualCost = avgAmount * 12;
        else if (frequency === 'Weekly') annualCost = avgAmount * 52;
        else if (frequency === 'Quarterly') annualCost = avgAmount * 4;
        else if (frequency === 'Yearly') annualCost = avgAmount;

        recurringPayments.push({
          merchant: sorted[0].description || sorted[0].category,
          amount: avgAmount,
          frequency,
          nextPayment,
          lastPayment: sorted[sorted.length - 1].date,
          count: sorted.length,
          annualCost,
          isActive,
          category: sorted[0].category,
          transactions: sorted
        });
      }
    });

    // Sort by amount (highest first)
    return recurringPayments.sort((a, b) => b.annualCost - a.annualCost);
  };

  const getDaysUntilPayment = (date) => {
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  const totalMonthlySubscriptions = subscriptions
    .filter(s => s.isActive)
    .reduce((sum, s) => {
      if (s.frequency === 'Monthly') return sum + s.amount;
      if (s.frequency === 'Weekly') return sum + (s.amount * 4.33);
      if (s.frequency === 'Quarterly') return sum + (s.amount / 3);
      if (s.frequency === 'Yearly') return sum + (s.amount / 12);
      return sum;
    }, 0);

  const totalAnnualCost = subscriptions
    .filter(s => s.isActive)
    .reduce((sum, s) => sum + s.annualCost, 0);

  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RepeatIcon className="h-5 w-5 text-blue-600" />
            <CardTitle>Smart Subscription Tracker</CardTitle>
          </div>
          <Badge className="bg-blue-600 text-white">
            {subscriptions.filter(s => s.isActive).length} Active
          </Badge>
        </div>
        <CardDescription>AI-detected recurring payments and subscriptions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-lg shadow-sm text-center">
            <p className="text-xs text-muted-foreground mb-1">Monthly Total</p>
            <p className="text-xl font-bold text-blue-700">₹{totalMonthlySubscriptions.toFixed(0)}</p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm text-center">
            <p className="text-xs text-muted-foreground mb-1">Annual Cost</p>
            <p className="text-xl font-bold text-blue-700">₹{totalAnnualCost.toFixed(0)}</p>
          </div>
        </div>

        {/* Subscription List */}
        <div className="space-y-3">
          {subscriptions.map((sub, idx) => {
            const daysUntil = sub.nextPayment ? getDaysUntilPayment(sub.nextPayment) : null;
            const isUpcoming = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0;

            return (
              <div 
                key={idx}
                className={`p-4 bg-white rounded-lg border-l-4 ${
                  !sub.isActive ? 'border-gray-400 opacity-60' : 
                  isUpcoming ? 'border-orange-500' : 'border-blue-500'
                } shadow-sm`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 capitalize">
                        {sub.merchant}
                      </span>
                      {!sub.isActive && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">
                          Inactive
                        </Badge>
                      )}
                      {isUpcoming && (
                        <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                          <Bell className="h-3 w-3 mr-1" />
                          Due Soon
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <RepeatIcon className="h-3 w-3" />
                        {sub.frequency}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ₹{sub.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-700">
                      ₹{sub.annualCost.toFixed(0)}/year
                    </p>
                    <p className="text-xs text-gray-500">{sub.count} payments</p>
                  </div>
                </div>

                {sub.nextPayment && sub.isActive && (
                  <div className={`mt-2 p-2 rounded text-xs ${
                    isUpcoming ? 'bg-orange-50 text-orange-900' : 'bg-blue-50 text-blue-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Next payment: {new Date(sub.nextPayment).toLocaleDateString('en-IN')}
                        {daysUntil !== null && daysUntil >= 0 && ` (in ${daysUntil} days)`}
                      </span>
                    </div>
                  </div>
                )}

                {!sub.isActive && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3 w-3" />
                      <span>Last payment: {new Date(sub.lastPayment).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Insights */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex gap-2 items-start mb-2">
            <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
            <h4 className="font-semibold text-purple-900">AI Insights</h4>
          </div>
          <div className="space-y-2 text-sm text-purple-900">
            <p>💡 You&apos;re spending ₹{totalMonthlySubscriptions.toFixed(0)}/month on {subscriptions.filter(s => s.isActive).length} subscriptions.</p>
            {subscriptions.filter(s => !s.isActive).length > 0 && (
              <p>✅ You&apos;ve saved ₹{subscriptions.filter(s => !s.isActive).reduce((sum, s) => sum + s.annualCost/12, 0).toFixed(0)}/month by canceling {subscriptions.filter(s => !s.isActive).length} subscriptions!</p>
            )}
            {totalAnnualCost > 10000 && (
              <p>⚠️ Consider reviewing if all subscriptions provide value - that&apos;s ₹{totalAnnualCost.toFixed(0)}/year!</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
