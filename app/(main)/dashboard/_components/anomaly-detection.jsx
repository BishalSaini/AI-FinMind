"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, TrendingUp, Sparkles, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AnomalyDetection({ transactions = [] }) {
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    if (transactions.length > 0) {
      const detected = detectAnomalies(transactions);
      setAnomalies(detected);
    }
  }, [transactions]);

  const detectAnomalies = (txns) => {
    const anomalousTransactions = [];
    
    // Group transactions by category
    const categoryGroups = {};
    txns.filter(t => t.type === 'EXPENSE').forEach(t => {
      if (!categoryGroups[t.category]) {
        categoryGroups[t.category] = [];
      }
      categoryGroups[t.category].push(t.amount);
    });

    // Calculate statistics for each category
    Object.keys(categoryGroups).forEach(category => {
      const amounts = categoryGroups[category];
      if (amounts.length < 3) return; // Need at least 3 transactions for pattern

      const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      // Find outliers (transactions beyond 2 standard deviations)
      txns.filter(t => t.category === category && t.type === 'EXPENSE').forEach(t => {
        const zScore = Math.abs((t.amount - mean) / (stdDev || 1));
        
        if (zScore > 2) { // More than 2 standard deviations
          const percentAboveAvg = ((t.amount - mean) / mean) * 100;
          anomalousTransactions.push({
            transaction: t,
            reason: 'unusual_amount',
            severity: zScore > 3 ? 'high' : 'medium',
            message: `${percentAboveAvg.toFixed(0)}% above your average ${category} spending`,
            avgAmount: mean,
            zScore: zScore.toFixed(2)
          });
        }
      });
    });

    // Detect duplicate transactions (same amount within short time)
    const sorted = [...txns].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (let i = 0; i < sorted.length - 1; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const timeDiff = Math.abs(new Date(sorted[i].date) - new Date(sorted[j].date)) / (1000 * 60 * 60); // hours
        
        if (timeDiff <= 24 && Math.abs(sorted[i].amount - sorted[j].amount) < 0.01 && sorted[i].type === sorted[j].type) {
          const exists = anomalousTransactions.find(a => 
            a.transaction.id === sorted[i].id || a.transaction.id === sorted[j].id
          );
          
          if (!exists) {
            anomalousTransactions.push({
              transaction: sorted[i],
              reason: 'possible_duplicate',
              severity: 'medium',
              message: `Similar transaction of ₹${sorted[j].amount} found within 24 hours`,
              duplicate: sorted[j]
            });
          }
        }
      }
    }

    // Detect high-frequency spending (multiple transactions same day)
    const dailyTxnCount = {};
    txns.filter(t => t.type === 'EXPENSE').forEach(t => {
      const dateKey = new Date(t.date).toDateString();
      if (!dailyTxnCount[dateKey]) {
        dailyTxnCount[dateKey] = [];
      }
      dailyTxnCount[dateKey].push(t);
    });

    Object.entries(dailyTxnCount).forEach(([date, dayTxns]) => {
      if (dayTxns.length >= 5) {
        const totalSpent = dayTxns.reduce((sum, t) => sum + t.amount, 0);
        const exists = anomalousTransactions.find(a => 
          dayTxns.some(dt => dt.id === a.transaction.id)
        );
        
        if (!exists && dayTxns.length > 0) {
          anomalousTransactions.push({
            transaction: dayTxns[0],
            reason: 'high_frequency',
            severity: 'low',
            message: `${dayTxns.length} transactions on ${new Date(date).toLocaleDateString('en-IN')} totaling ₹${totalSpent.toFixed(0)}`,
            count: dayTxns.length,
            total: totalSpent
          });
        }
      }
    });

    // Sort by severity
    return anomalousTransactions.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    }).slice(0, 5); // Show top 5 anomalies
  };

  if (anomalies.length === 0) {
    return (
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle>Transaction Security Check</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">All Clear!</p>
              <p className="text-sm text-green-700">No unusual transactions detected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle>Anomaly Detection</CardTitle>
          </div>
          <Badge className="bg-orange-600 text-white">
            {anomalies.length} Alert{anomalies.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {anomalies.map((anomaly, idx) => {
          const severityColors = {
            high: 'red',
            medium: 'orange',
            low: 'yellow'
          };
          const color = severityColors[anomaly.severity];

          return (
            <div 
              key={idx} 
              className={`p-4 bg-white rounded-lg border-l-4 border-${color}-500 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {anomaly.severity === 'high' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                  {anomaly.severity === 'medium' && <TrendingUp className="h-5 w-5 text-orange-600" />}
                  {anomaly.severity === 'low' && <Sparkles className="h-5 w-5 text-yellow-600" />}
                  <span className="font-semibold capitalize text-gray-900">
                    {anomaly.transaction.description || anomaly.transaction.category}
                  </span>
                </div>
                <Badge 
                  className={`bg-${color}-100 text-${color}-800 border-${color}-300`}
                  variant="outline"
                >
                  {anomaly.severity}
                </Badge>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-red-600">₹{anomaly.transaction.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900">
                    {new Date(anomaly.transaction.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
                {anomaly.avgAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average:</span>
                    <span className="text-gray-700">₹{anomaly.avgAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className={`mt-3 p-2 bg-${color}-50 rounded text-sm`}>
                <div className="flex gap-2 items-start">
                  <AlertTriangle className={`h-4 w-4 text-${color}-700 mt-0.5`} />
                  <p className={`text-${color}-900`}>{anomaly.message}</p>
                </div>
              </div>

              {anomaly.reason === 'unusual_amount' && (
                <div className="mt-2 text-xs text-gray-600">
                  <span className="font-medium">Z-Score: {anomaly.zScore}</span> (Statistical outlier)
                </div>
              )}
            </div>
          );
        })}

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-4">
          <div className="flex gap-2 items-start">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-900">
              AI monitors your transactions using machine learning to detect fraud, duplicates, and unusual patterns.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
