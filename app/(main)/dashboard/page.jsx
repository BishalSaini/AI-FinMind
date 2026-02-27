import { Suspense } from "react";
import { getUserAccounts } from "@/actions/dashboard";
import { getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DashboardOverview } from "./_components/transaction-overview";
import { AIReportsSection } from "./_components/ai-reports";
import { BudgetInsights } from "./_components/budget-insights";
import { FinanceAdvisorChat } from "@/components/finance-advisor-chat";
import Loader from "@/components/loader";
import { SpendingPrediction } from "./_components/spending-prediction";
import { FinancialHealthScore } from "./_components/financial-health-score";
import { AnomalyDetection } from "./_components/anomaly-detection";
import { SmartSubscriptionTracker } from "./_components/smart-subscription-tracker";

export default async function DashboardPage() {
  return (
    <Suspense fallback={<Loader />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  // Safely fetch accounts with error handling for new users
  const accounts = await getUserAccounts().catch((err) => {
    console.error("Error fetching accounts:", err);
    return [];
  });
  
  const defaultAccount = accounts?.find((account) => account.isDefault);

  // Fetch all data in parallel for better performance with error handling
  const [transactions, budgetData] = await Promise.all([
    getDashboardData().catch(() => []),
    defaultAccount ? getCurrentBudget(defaultAccount.id).catch(err => {
      console.error("Error fetching budget:", err);
      return null;
    }) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-8">
      {/* Budget Insights with AI Guidance */}
      <BudgetInsights
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      {/* Financial Health Score - NEW */}
      <FinancialHealthScore 
        transactions={transactions || []}
        accounts={accounts}
        budget={budgetData?.budget}
      />

      {/* AI Spending Prediction - NEW */}
      <SpendingPrediction transactions={transactions || []} />

      {/* Anomaly Detection - NEW */}
      <AnomalyDetection transactions={transactions || []} />

      {/* Smart Subscription Tracker - NEW */}
      <SmartSubscriptionTracker transactions={transactions || []} />

      {/* AI Financial Reports Section */}
      <AIReportsSection />

      {/* Dashboard Overview */}
      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      />

      {/* Accounts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>
        {accounts.length > 0 &&
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>

      {/* Finance Advisor Chatbot */}
      <FinanceAdvisorChat />
    </div>
  );
}
