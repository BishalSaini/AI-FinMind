import { GoogleGenerativeAI } from "@google/generative-ai";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get user's financial data for context
    const dbUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's recent transactions
    const transactions = await db.transaction.findMany({
      where: { userId: dbUser.id },
      orderBy: { date: 'desc' },
      take: 20,
    });

    // Get user's accounts
    const accounts = await db.account.findMany({
      where: { userId: dbUser.id },
    });

    // Get user's budget
    const budget = await db.budget.findFirst({
      where: { userId: dbUser.id },
    });

    // Calculate financial summary
    const currentMonth = new Date();
    const monthlyTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth.getMonth() && 
             txDate.getFullYear() === currentMonth.getFullYear();
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance.toNumber(), 0);

    // Get current month and year
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    const currentMonthName = monthNames[currentMonth.getMonth()];
    const currentYear = currentMonth.getFullYear();

    // Get previous month's data
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthName = monthNames[prevMonth.getMonth()];
    const prevMonthYear = prevMonth.getFullYear();

    const prevMonthTransactions = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === prevMonth.getMonth() && 
             txDate.getFullYear() === prevMonth.getFullYear();
    });

    const prevMonthIncome = prevMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const prevMonthExpenses = prevMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    // Calculate budget usage
    const budgetAmount = budget ? budget.amount.toNumber() : 0;
    const budgetRemaining = budgetAmount - monthlyExpenses;
    const budgetUsedPercent = budgetAmount > 0 ? ((monthlyExpenses / budgetAmount) * 100).toFixed(1) : 0;

    // Get top spending categories for current month
    const categoryBreakdown = monthlyTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount.toNumber();
        return acc;
      }, {});

    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(2)}`)
      .join(', ');

    // Create context for AI
    const financialContext = `
CURRENT MONTH: ${currentMonthName} ${currentYear}

${currentMonthName} Budget Status:
${budget ? `- Budget Set: ₹${budgetAmount.toFixed(2)}` : '- No budget set for this month'}
${budget ? `- Amount Spent: ₹${monthlyExpenses.toFixed(2)} (${budgetUsedPercent}% used)` : ''}
${budget ? `- Budget Remaining: ₹${budgetRemaining.toFixed(2)}` : ''}
- Income This Month: ₹${monthlyIncome.toFixed(2)}
- Expenses This Month: ₹${monthlyExpenses.toFixed(2)}
${topCategories ? `- Top Spending: ${topCategories}` : ''}

${prevMonthName} ${prevMonthYear} Summary:
- Income: ₹${prevMonthIncome.toFixed(2)}
- Expenses: ₹${prevMonthExpenses.toFixed(2)}
- Net: ₹${(prevMonthIncome - prevMonthExpenses).toFixed(2)}
- Transactions: ${prevMonthTransactions.length}

Overall Account Summary:
- Total Balance Across All Accounts: ₹${totalBalance.toFixed(2)} (includes all previous months)
- Number of Accounts: ${accounts.length}

Recent Transaction History (Last 20):
${transactions.slice(0, 5).map(t => `- ${t.description}: ₹${t.amount.toNumber().toFixed(2)} (${t.type}) on ${new Date(t.date).toLocaleDateString()}`).join('\n')}

IMPORTANT: When users ask about previous months, use the historical data provided above. Focus on current month's budget for spending advice.
    `.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `You are a professional financial advisor helping users manage their finances. 
You have access to the user's financial data (provided below). 
Be friendly, supportive, and provide actionable advice.
Use Indian Rupees (₹) in your responses.

${financialContext}

User's Question: ${message}

IMPORTANT RULES:
1. Use ONLY the transaction descriptions and data provided above - do NOT make assumptions or invent details about transaction purposes
2. When mentioning specific transactions, use the exact description shown (e.g., "Purchase Jacket", "Netflix sub")
3. If you don't know the purpose of a transaction, refer to it by its description without guessing
4. Provide helpful, concise responses (2-4 sentences) with practical advice
5. Focus on CURRENT MONTH's budget for spending advice about the present
6. When discussing past months, use the historical data provided
7. Be encouraging and positive while being realistic and accurate

Provide your response now:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      message: text,
      context: {
        balance: totalBalance,
        income: monthlyIncome,
        expenses: monthlyExpenses,
      }
    });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process chat message", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
