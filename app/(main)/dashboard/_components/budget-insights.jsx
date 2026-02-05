"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, Check, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function BudgetInsights({ initialBudget, currentExpenses = 0 }) {
  const [aiGuidance, setAiGuidance] = useState([]);

  // Get current month info
  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const dayOfMonth = currentDate.getDate();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

  const budgetAmount = initialBudget?.amount || 0;
  const percentageUsed = budgetAmount > 0 ? (currentExpenses / budgetAmount) * 100 : 0;
  const remaining = budgetAmount - currentExpenses;

  const getStatusColor = () => {
    if (percentageUsed >= 90) return "text-red-600";
    if (percentageUsed >= 80) return "text-orange-600";
    if (percentageUsed >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  const getStatusIcon = () => {
    if (percentageUsed >= 80) return <AlertCircle className="h-5 w-5 text-orange-600" />;
    if (percentageUsed >= 60) return <TrendingUp className="h-5 w-5 text-yellow-600" />;
    return <Check className="h-5 w-5 text-green-600" />;
  };

  const getStatusBadge = () => {
    if (percentageUsed >= 90) return <Badge variant="destructive">Critical</Badge>;
    if (percentageUsed >= 80) return <Badge className="bg-orange-500">Warning</Badge>;
    if (percentageUsed >= 60) return <Badge className="bg-yellow-500">Monitor</Badge>;
    return <Badge className="bg-green-500">Healthy</Badge>;
  };

  const getAIGuidance = () => {
    const guidance = [];
    const monthlyRemaining = remaining;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const daysRemaining = daysInMonth - currentDay;
    const dailyBudget = budgetAmount / daysInMonth;
    const dailySpending = currentExpenses / currentDay;
    
    if (percentageUsed >= 90) {
      guidance.push({
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        text: `🚨 Critical: You've used ${percentageUsed.toFixed(1)}% of your ₹${budgetAmount.toFixed(0)} budget with ${daysRemaining} days left in the month!`,
        priority: "high"
      });
      guidance.push({
        icon: <Sparkles className="h-4 w-4 text-blue-600" />,
        text: `💡 You have only ₹${monthlyRemaining.toFixed(0)} left. That's ₹${(monthlyRemaining/daysRemaining).toFixed(0)}/day. Stick to essentials only.`,
        priority: "medium"
      });
    } else if (percentageUsed >= 80) {
      guidance.push({
        icon: <AlertCircle className="h-4 w-4 text-orange-600" />,
        text: `⚠️ Warning: ${percentageUsed.toFixed(1)}% of budget used. You have ₹${monthlyRemaining.toFixed(0)} for the next ${daysRemaining} days.`,
        priority: "high"
      });
      guidance.push({
        icon: <Sparkles className="h-4 w-4 text-blue-600" />,
        text: `💡 Your daily limit is now ₹${(monthlyRemaining/daysRemaining).toFixed(0)}. Currently spending ₹${dailySpending.toFixed(0)}/day - ${dailySpending > (monthlyRemaining/daysRemaining) ? 'reduce spending!' : 'good pace!'}`,
        priority: "medium"
      });
    } else if (percentageUsed >= 60) {
      guidance.push({
        icon: <TrendingUp className="h-4 w-4 text-yellow-600" />,
        text: `📊 You're at ${percentageUsed.toFixed(1)}% with ₹${monthlyRemaining.toFixed(0)} remaining for ${daysRemaining} days (₹${(monthlyRemaining/daysRemaining).toFixed(0)}/day).`,
        priority: "medium"
      });
      guidance.push({
        icon: <Sparkles className="h-4 w-4 text-blue-600" />,
        text: `💡 Average daily spending: ₹${dailySpending.toFixed(0)}. Budget allows: ₹${dailyBudget.toFixed(0)}. You're ${dailySpending > dailyBudget ? 'overspending' : 'on track'}!`,
        priority: "low"
      });
    } else if (percentageUsed >= 40) {
      guidance.push({
        icon: <Check className="h-4 w-4 text-green-600" />,
        text: `✅ Great! ${percentageUsed.toFixed(1)}% used. Spending ₹${dailySpending.toFixed(0)}/day vs budget of ₹${dailyBudget.toFixed(0)}/day.`,
        priority: "low"
      });
      guidance.push({
        icon: <Sparkles className="h-4 w-4 text-blue-600" />,
        text: `💡 You're saving ₹${(dailyBudget - dailySpending).toFixed(0)}/day! At this rate, you'll have ₹${((dailyBudget - dailySpending) * daysRemaining + monthlyRemaining).toFixed(0)} left.`,
        priority: "low"
      });
    } else {
      const projectedSavings = (budgetAmount - (dailySpending * daysInMonth));
      guidance.push({
        icon: <Check className="h-4 w-4 text-green-600" />,
        text: `🎉 Excellent! Only ${percentageUsed.toFixed(1)}% used. You're well under budget with ₹${monthlyRemaining.toFixed(0)} remaining.`,
        priority: "low"
      });
      guidance.push({
        icon: <Sparkles className="h-4 w-4 text-blue-600" />,
        text: `💡 At current pace (₹${dailySpending.toFixed(0)}/day), you'll save ₹${projectedSavings > 0 ? projectedSavings.toFixed(0) : 0} this month. Great for emergency fund!`,
        priority: "low"
      });
    }

    // Add personalized tip based on remaining days
    if (daysRemaining > 20) {
      guidance.push({
        icon: <Sparkles className="h-4 w-4 text-purple-600" />,
        text: `📈 It's early in the month - perfect time to set spending goals for the remaining ${daysRemaining} days!`,
        priority: "low"
      });
    } else if (daysRemaining > 10) {
      guidance.push({
        icon: <Sparkles className="h-4 w-4 text-purple-600" />,
        text: `📅 Mid-month checkpoint: ${daysRemaining} days left. Review your top expense categories to stay on track.`,
        priority: "low"
      });
    } else if (daysRemaining > 0) {
      guidance.push({
        icon: <Sparkles className="h-4 w-4 text-purple-600" />,
        text: `🏁 Final ${daysRemaining} days! Stay mindful of spending to finish the month strong.`,
        priority: "low"
      });
    }

    return guidance;
  };

  useEffect(() => {
    setAiGuidance(getAIGuidance());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percentageUsed, budgetAmount, currentExpenses]);

  if (!initialBudget) {
    return null;
  }

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle>Budget Overview & AI Insights</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{monthName} • Day {dayOfMonth} of {daysInMonth}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Budget</p>
            <p className="text-lg font-bold text-gray-900">₹{budgetAmount.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Spent</p>
            <p className="text-lg font-bold text-red-600">₹{currentExpenses.toFixed(2)}</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className={`text-lg font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(remaining).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Budget Usage</span>
            <span className={`font-bold ${getStatusColor()}`}>
              {percentageUsed.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(percentageUsed, 100)} 
            className="h-3"
            extraStyles={
              percentageUsed >= 90 ? "bg-red-600" :
              percentageUsed >= 80 ? "bg-orange-500" :
              percentageUsed >= 60 ? "bg-yellow-500" :
              "bg-green-500"
            }
          />
        </div>

        {/* AI Guidance Section */}
        <div className="space-y-3 p-4 bg-white rounded-lg border border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <h4 className="font-semibold text-emerald-900">AI Financial Guidance</h4>
          </div>
          
          {aiGuidance.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              {item.icon}
              <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 text-xs text-muted-foreground pt-2 border-t">
          <TrendingDown className="h-3 w-3" />
          <span>Budget resets on the 1st of each month</span>
        </div>
      </CardContent>
    </Card>
  );
}
