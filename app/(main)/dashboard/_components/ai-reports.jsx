"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, TrendingUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { Badge } from "@/components/ui/badge";

export function AIReportsSection() {
  const [monthlyReport, setMonthlyReport] = useState(null);

  const { loading: loadingMonthly, fn: generateMonthlyReport } = useFetch(
    async () => {
      const response = await fetch("/api/test-monthly-report");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate report");
      }
      const data = await response.json();
      return data;
    }
  );

  const handleMonthlyReport = async () => {
    try {
      const result = await generateMonthlyReport();
      console.log("Monthly report result:", result);
      
      if (result?.success) {
        setMonthlyReport(result.data);
        toast.success(result.message || "Monthly Report Generated! (Email sent)");
      } else {
        toast.error(result?.error || "Failed to generate report");
        console.error("Monthly report error:", result);
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate report");
      console.error("Monthly report error:", error);
    }
  };

  // Budget alert function kept for future use
  // const handleBudgetAlert = async () => {
  //   const result = await generateBudgetAlert();
  //   if (result?.success) {
  //     setBudgetAlert(result.data);
  //     toast.success(result.message || "Budget Alert Generated!");
  //   }
  // };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-emerald-600" />
        <h2 className="text-2xl font-bold">AI Financial Reports</h2>
        <Badge variant="outline" className="ml-2">Live Demo</Badge>
      </div>
      
      {/* Monthly Financial Report */}
      <Card className="border-emerald-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <CardTitle>Monthly Financial Report</CardTitle>
            </div>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardDescription>
            AI-powered financial insights sent via email monthly (Auto-sent on 1st of each month)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleMonthlyReport}
            disabled={loadingMonthly}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {loadingMonthly ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Report Now
              </>
            )}
          </Button>

          {monthlyReport && (
            <div className="space-y-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="mb-3 pb-2 border-b border-emerald-300">
                <h4 className="font-bold text-emerald-900 text-sm">{monthlyReport.month} Report</h4>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Income:</span>
                <span className="text-green-600 font-semibold">₹{monthlyReport.income}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Expenses:</span>
                <span className="text-red-600 font-semibold">₹{monthlyReport.expenses}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Savings:</span>
                <span className={`font-semibold ${monthlyReport.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{monthlyReport.savings}
                </span>
              </div>
              
              <div className="pt-3 border-t border-emerald-300">
                <p className="text-xs font-semibold mb-2 text-emerald-900">AI-Generated Insights:</p>
                {monthlyReport.insights?.map((insight, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Sparkles className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-emerald-700 font-medium mt-2">
                ✓ Email sent successfully!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
