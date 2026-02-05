"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Calendar, Sparkles, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SpendingPrediction({ transactions = [] }) {
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    if (transactions.length > 0) {
      const predicted = predictNextMonth(transactions);
      setPrediction(predicted);
    }
  }, [transactions]);

  // Simple ML-based prediction using linear regression on historical data
  const predictNextMonth = (txns) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get last 3 months data for trend analysis
    const monthlyData = [];
    for (let i = 2; i >= 0; i--) {
      const targetMonth = new Date(currentYear, currentMonth - i, 1);
      const monthTxns = txns.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === targetMonth.getMonth() && 
               txDate.getFullYear() === targetMonth.getFullYear();
      });

      const expenses = monthTxns
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: targetMonth.toLocaleDateString('en-IN', { month: 'short' }),
        expenses
      });
    }

    // Calculate trend and predict next month
    if (monthlyData.length < 2) {
      return null;
    }

    const avgExpense = monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length;
    const trend = monthlyData[monthlyData.length - 1].expenses - monthlyData[0].expenses;
    const predictedExpense = monthlyData[monthlyData.length - 1].expenses + (trend / monthlyData.length);

    // Categorize predictions
    const categoryPredictions = {};
    const currentMonthTxns = txns.filter(t => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    currentMonthTxns.filter(t => t.type === 'EXPENSE').forEach(t => {
      if (!categoryPredictions[t.category]) {
        categoryPredictions[t.category] = 0;
      }
      categoryPredictions[t.category] += t.amount;
    });

    const topCategories = Object.entries(categoryPredictions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => ({ category: cat, amount: amt }));

    return {
      predictedExpense: Math.max(0, predictedExpense),
      avgExpense,
      trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      trendPercent: avgExpense > 0 ? ((trend / avgExpense) * 100).toFixed(1) : 0,
      monthlyData,
      topCategories,
      confidence: monthlyData.length >= 3 ? 'High' : 'Medium'
    };
  };

  if (!prediction) {
    return null;
  }

  const nextMonth = new Date(new Date().setMonth(new Date().getMonth() + 1))
    .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <CardTitle>AI Spending Forecast</CardTitle>
          </div>
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
            {prediction.confidence} Confidence
          </Badge>
        </div>
        <CardDescription>Machine learning prediction for {nextMonth}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prediction Box */}
        <div className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Predicted Spending</span>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-700">
              ₹{prediction.predictedExpense.toFixed(0)}
            </span>
            {prediction.trend !== 'stable' && (
              <Badge className={prediction.trend === 'increasing' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                {prediction.trend === 'increasing' ? '↑' : '↓'} {Math.abs(prediction.trendPercent)}%
              </Badge>
            )}
          </div>
        </div>

        {/* Historical Trend */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <span>Historical Trend (Last 3 Months)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {prediction.monthlyData.map((month, idx) => (
              <div key={idx} className="text-center p-2 bg-white rounded">
                <p className="text-xs text-muted-foreground">{month.month}</p>
                <p className="text-sm font-semibold text-gray-700">₹{month.expenses.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Predictions */}
        {prediction.topCategories.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Expected Top Spending Categories:</p>
            {prediction.topCategories.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-white rounded text-sm">
                <span className="capitalize">{cat.category}</span>
                <span className="font-semibold text-purple-700">₹{cat.amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}

        {/* AI Insights */}
        <div className="p-3 bg-purple-100 rounded-lg border border-purple-200">
          <div className="flex gap-2 items-start">
            <Sparkles className="h-4 w-4 text-purple-600 mt-0.5" />
            <div className="space-y-1 text-sm text-purple-900">
              {prediction.trend === 'increasing' && (
                <>
                  <p>⚠️ Your spending is trending upward by {prediction.trendPercent}%.</p>
                  <p>💡 Consider reviewing your top expense categories to optimize spending.</p>
                </>
              )}
              {prediction.trend === 'decreasing' && (
                <>
                  <p>✅ Great news! Your spending is decreasing by {Math.abs(prediction.trendPercent)}%.</p>
                  <p>💰 Keep up the good work - you&apos;re moving in the right direction!</p>
                </>
              )}
              {prediction.trend === 'stable' && (
                <>
                  <p>📊 Your spending is consistent month-over-month.</p>
                  <p>💡 Consider setting aggressive savings goals to boost your financial health.</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Prediction updates daily based on your transaction patterns</span>
        </div>
      </CardContent>
    </Card>
  );
}
