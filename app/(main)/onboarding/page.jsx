import { checkUser } from "@/lib/checkUser";
import { getUserAccounts } from "@/actions/dashboard";
import { redirect } from "next/navigation";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Suspense } from "react";
import Loader from "@/components/loader";

export default async function OnboardingPage() {
  return (
    <Suspense fallback={<Loader />}>
      <OnboardingContent />
    </Suspense>
  );
}

async function OnboardingContent() {
  // Ensure user exists in database
  const user = await checkUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user already has accounts
  const accounts = await getUserAccounts().catch(() => []);

  // If user already has accounts, redirect to dashboard
  if (accounts && accounts.length > 0) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold gradient-title mb-4">
          Welcome to FinMind! 🎉
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          Let's get you started with your financial journey
        </p>
        <p className="text-gray-500 dark:text-gray-500">
          Create your first account to begin tracking your finances
        </p>
      </div>

      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6">
          <div className="mb-8 p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg
              className="w-16 h-16 text-emerald-600 dark:text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Create Your First Account
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            An account helps you organize your finances. You can create multiple
            accounts like Checking, Savings, Credit Card, etc.
          </p>

          <CreateAccountDrawer redirectTo="/dashboard">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-95">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Account
            </button>
          </CreateAccountDrawer>

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
            You can always add more accounts later from your dashboard
          </p>
        </CardContent>
      </Card>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Track Spending</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitor your income and expenses in real-time
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
              <svg
                className="w-6 h-6 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">AI Insights</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get smart financial advice powered by AI
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Budget Goals</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Set budgets and achieve your financial goals
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
