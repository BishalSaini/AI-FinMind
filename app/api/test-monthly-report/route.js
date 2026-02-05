import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get previous month (since we're generating report for last month)
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthName = previousMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ 
        success: false,
        error: "User not found in database" 
      }, { status: 404 });
    }

    // Get transactions for the user
    const transactions = await db.transaction.findMany({
      where: {
        userId: dbUser.id,
      },
      orderBy: {
        date: 'desc'
      },
      take: 50 // Limit to most recent 50
    });

    if (transactions.length === 0) {
      // Return demo data if no transactions
      return NextResponse.json({
        success: true,
        message: "Monthly report generated with demo data (no transactions found)",
        data: {
          month: monthName,
          income: "0.00",
          expenses: "0.00",
          savings: "0.00",
          transactionCount: 0,
          topCategories: [],
          insights: [
            "Start tracking your transactions to get personalized AI insights!",
            "Create your first transaction to see AI-powered financial analysis.",
            "Once you have data, I'll provide tailored recommendations to improve your finances."
          ],
        },
      });
    }

    // Calculate income and expenses
    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const expenses = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);

    const savings = income - expenses;

    // Get category breakdown
    const categoryTotals = {};
    transactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        if (!categoryTotals[t.category]) {
          categoryTotals[t.category] = 0;
        }
        categoryTotals[t.category] += t.amount.toNumber();
      });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount: amount.toFixed(2),
      }));

    // Generate AI-powered personalized advice using Gemini
    let aiInsights = [
      "Track your expenses regularly for better financial management.",
      "Consider setting aside 20% of your income for savings.",
      "Review your budget monthly to stay on track."
    ];

    if (transactions.length > 0) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        
        const prompt = `You are a financial advisor AI. Analyze this user's financial data and provide 3 personalized, actionable financial tips.

Financial Summary:
- Total Income: $${income.toFixed(2)}
- Total Expenses: $${expenses.toFixed(2)}
- Net Savings: $${savings.toFixed(2)}
- Transaction Count: ${transactions.length}
- Top Spending Categories: ${topCategories.map(c => `${c.category}: ₹${c.amount}`).join(", ")}

Provide exactly 3 short, specific, actionable tips (each 10-15 words max) based on their spending patterns. Focus on practical advice they can implement immediately. Return ONLY the 3 tips as a JSON array of strings, no other text.

Example format: ["Tip 1 here", "Tip 2 here", "Tip 3 here"]`;

        const result = await model.generateContent(prompt);
        const response = result.response.text().trim();
        
        // Try to parse as JSON
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedInsights = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsedInsights) && parsedInsights.length > 0) {
            aiInsights = parsedInsights.slice(0, 3);
          }
        }
      } catch (aiError) {
        console.error("AI insights generation error:", aiError);
        // Use default insights if AI fails
      }
    }

    // Send monthly report email
    await sendEmail({
      to: user.emailAddresses[0].emailAddress,
      subject: `Your ${monthName} Financial Report`,
      react: EmailTemplate({
        userName: user.firstName || "User",
        type: "monthly-report",
        data: {
          month: monthName,
          stats: {
            totalIncome: income.toFixed(2),
            totalExpenses: expenses.toFixed(2),
            byCategory: Object.fromEntries(
              topCategories.map(c => [c.category, c.amount])
            ),
          },
          insights: aiInsights, // AI-generated personalized advice
        },
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Monthly report email sent successfully!",
      data: {
        month: monthName,
        income: income.toFixed(2),
        expenses: expenses.toFixed(2),
        savings: savings.toFixed(2),
        transactionCount: transactions.length,
        topCategories,
        insights: aiInsights,
      },
    });
  } catch (error) {
    console.error("Test monthly report error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to send monthly report", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
