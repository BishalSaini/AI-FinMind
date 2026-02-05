"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart, TrendingUp, Shield, AlertTriangle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function FinancialHealthScore({ transactions = [], accounts = [], budget = null }) {
  const [healthScore, setHealthScore] = useState(null);

  useEffect(() => {
    if (transactions.length > 0 || accounts.length > 0) {
      const score = calculateHealthScore(transactions, accounts, budget);
      setHealthScore(score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, accounts, budget]);

  const calculateHealthScore = (txns, accts, bdgt) => {
    let score = 0;
    const factors = [];

    // Factor 1: Savings Rate (0-30 points)
    const currentDate = new Date();
    const monthlyTxns = txns.filter(t => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentDate.getMonth() && 
             txDate.getFullYear() === currentDate.getFullYear();
    });

    const income = monthlyTxns.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthlyTxns.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    if (savingsRate >= 20) {
      score += 30;
      factors.push({ name: "Savings Rate", points: 30, status: "excellent", message: `Excellent! Saving ${savingsRate.toFixed(0)}% of income` });
    } else if (savingsRate >= 10) {
      score += 20;
      factors.push({ name: "Savings Rate", points: 20, status: "good", message: `Good! Saving ${savingsRate.toFixed(0)}% of income` });
    } else if (savingsRate > 0) {
      score += 10;
      factors.push({ name: "Savings Rate", points: 10, status: "fair", message: `Saving ${savingsRate.toFixed(0)}% - aim for 20%` });
    } else {
      score += 0;
      factors.push({ name: "Savings Rate", points: 0, status: "poor", message: "Not saving - expenses exceed income" });
    }

    // Factor 2: Budget Adherence (0-25 points)
    if (bdgt && bdgt.amount > 0) {
      const budgetUsage = (expenses / bdgt.amount) * 100;
      if (budgetUsage <= 80) {
        score += 25;
        factors.push({ name: "Budget Control", points: 25, status: "excellent", message: `Using only ${budgetUsage.toFixed(0)}% of budget` });
      } else if (budgetUsage <= 100) {
        score += 15;
        factors.push({ name: "Budget Control", points: 15, status: "good", message: `${budgetUsage.toFixed(0)}% of budget used` });
      } else {
        score += 5;
        factors.push({ name: "Budget Control", points: 5, status: "poor", message: `Over budget by ${(budgetUsage - 100).toFixed(0)}%` });
      }
    } else {
      score += 10;
      factors.push({ name: "Budget Control", points: 10, status: "fair", message: "No budget set - create one to improve" });
    }

    // Factor 3: Account Balance Health (0-20 points)
    const totalBalance = accts.reduce((sum, a) => sum + a.balance, 0);
    if (totalBalance >= 10000) {
      score += 20;
      factors.push({ name: "Emergency Fund", points: 20, status: "excellent", message: "Strong emergency fund" });
    } else if (totalBalance >= 5000) {
      score += 15;
      factors.push({ name: "Emergency Fund", points: 15, status: "good", message: "Good buffer, build more" });
    } else if (totalBalance >= 1000) {
      score += 10;
      factors.push({ name: "Emergency Fund", points: 10, status: "fair", message: "Build emergency fund to ₹5000" });
    } else if (totalBalance >= 0) {
      score += 5;
      factors.push({ name: "Emergency Fund", points: 5, status: "poor", message: "Low balance - risky situation" });
    } else {
      score += 0;
      factors.push({ name: "Emergency Fund", points: 0, status: "poor", message: "Negative balance - urgent action needed" });
    }

    // Factor 4: Spending Consistency (0-15 points)
    const last30Days = txns.filter(t => {
      const txDate = new Date(t.date);
      const diffDays = (currentDate - txDate) / (1000 * 60 * 60 * 24);
      return diffDays <= 30 && t.type === 'EXPENSE';
    });

    const avgDailySpending = last30Days.length > 0 
      ? last30Days.reduce((sum, t) => sum + t.amount, 0) / 30 
      : 0;

    const dailyVariance = calculateVariance(last30Days, avgDailySpending);
    
    if (dailyVariance < avgDailySpending * 0.5) {
      score += 15;
      factors.push({ name: "Spending Pattern", points: 15, status: "excellent", message: "Consistent spending habits" });
    } else if (dailyVariance < avgDailySpending * 1) {
      score += 10;
      factors.push({ name: "Spending Pattern", points: 10, status: "good", message: "Moderate spending consistency" });
    } else {
      score += 5;
      factors.push({ name: "Spending Pattern", points: 5, status: "fair", message: "Erratic spending - track better" });
    }

    // Factor 5: Financial Activity (0-10 points)
    if (txns.length >= 20) {
      score += 10;
      factors.push({ name: "Transaction Tracking", points: 10, status: "excellent", message: "Actively tracking finances" });
    } else if (txns.length >= 10) {
      score += 7;
      factors.push({ name: "Transaction Tracking", points: 7, status: "good", message: "Good tracking, add more data" });
    } else {
      score += 4;
      factors.push({ name: "Transaction Tracking", points: 4, status: "fair", message: "Limited data - track more" });
    }

    // Determine grade and color
    let grade, color, rating, icon;
    if (score >= 85) {
      grade = 'A+'; color = 'emerald'; rating = 'Excellent'; icon = '🏆';
    } else if (score >= 70) {
      grade = 'A'; color = 'green'; rating = 'Very Good'; icon = '⭐';
    } else if (score >= 55) {
      grade = 'B'; color = 'blue'; rating = 'Good'; icon = '👍';
    } else if (score >= 40) {
      grade = 'C'; color = 'yellow'; rating = 'Fair'; icon = '⚠️';
    } else {
      grade = 'D'; color = 'red'; rating = 'Needs Improvement'; icon = '🚨';
    }

    return { score, grade, color, rating, factors, icon };
  };

  const calculateVariance = (txns, avg) => {
    if (txns.length === 0) return 0;
    const variance = txns.reduce((sum, t) => sum + Math.pow(t.amount - avg, 2), 0) / txns.length;
    return Math.sqrt(variance);
  };

  if (!healthScore) {
    return null;
  }

  return (
    <Card className={`border-2 border-${healthScore.color}-200 bg-gradient-to-br from-${healthScore.color}-50 to-${healthScore.color}-100`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className={`h-5 w-5 text-${healthScore.color}-600`} />
            <CardTitle>Financial Health Score</CardTitle>
          </div>
          <Badge className={`bg-${healthScore.color}-600 text-white`}>
            AI-Powered
          </Badge>
        </div>
        <CardDescription>Machine learning analysis of your financial wellbeing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <div className="text-6xl font-bold mb-2">
            <span className={`text-${healthScore.color}-600`}>{healthScore.score}</span>
            <span className="text-2xl text-gray-400">/100</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">{healthScore.icon}</span>
            <Badge className={`bg-${healthScore.color}-100 text-${healthScore.color}-700 text-lg px-4 py-1`}>
              Grade: {healthScore.grade}
            </Badge>
          </div>
          <p className={`text-${healthScore.color}-700 font-semibold`}>{healthScore.rating}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall Health</span>
            <span className={`font-bold text-${healthScore.color}-600`}>{healthScore.score}%</span>
          </div>
          <Progress value={healthScore.score} className="h-3" />
        </div>

        {/* Factors Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Score Breakdown
          </h4>
          {healthScore.factors.map((factor, idx) => (
            <div key={idx} className="p-3 bg-white rounded-lg border-l-4" 
                 style={{borderColor: factor.status === 'excellent' ? '#10b981' : factor.status === 'good' ? '#3b82f6' : factor.status === 'fair' ? '#f59e0b' : '#ef4444'}}>
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">{factor.name}</span>
                <span className="text-sm font-bold">{factor.points} pts</span>
              </div>
              <p className="text-xs text-gray-600">{factor.message}</p>
            </div>
          ))}
        </div>

        {/* AI Recommendations */}
        <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold text-purple-900">AI Recommendations to Improve</h4>
          </div>
          <div className="space-y-2 text-sm">
            {healthScore.score < 85 && (
              <>
                {healthScore.factors.find(f => f.name === "Savings Rate")?.status !== 'excellent' && (
                  <div className="flex gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5" />
                    <p>Increase savings to 20% of income (+{30 - healthScore.factors.find(f => f.name === "Savings Rate")?.points} pts)</p>
                  </div>
                )}
                {healthScore.factors.find(f => f.name === "Budget Control")?.status !== 'excellent' && (
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-purple-600 mt-0.5" />
                    <p>Stay under 80% of budget (+{25 - healthScore.factors.find(f => f.name === "Budget Control")?.points} pts)</p>
                  </div>
                )}
                {healthScore.factors.find(f => f.name === "Emergency Fund")?.status !== 'excellent' && (
                  <div className="flex gap-2">
                    <Shield className="h-4 w-4 text-purple-600 mt-0.5" />
                    <p>Build emergency fund to ₹10,000 (+{20 - healthScore.factors.find(f => f.name === "Emergency Fund")?.points} pts)</p>
                  </div>
                )}
              </>
            )}
            {healthScore.score >= 85 && (
              <p className="text-green-700">🎉 Excellent! You&apos;re in the top tier. Keep maintaining these habits!</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
