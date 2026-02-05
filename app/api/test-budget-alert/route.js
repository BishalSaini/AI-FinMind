import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's budgets
    const dbUser = await db.user.findUnique({
      where: { clerkUserId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ 
        success: false,
        error: "User not found in database" 
      }, { status: 404 });
    }

    const budgets = await db.budget.findMany({
      where: { userId: dbUser.id },
      include: {
        user: {
          include: {
            accounts: true,
          },
        },
      },
    });

    if (budgets.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No budgets found. Please create a budget first.",
      });
    }

    const budget = budgets[0];

    // Calculate current month expenses for ALL accounts
    const startDate = new Date();
    startDate.setDate(1);

    const expenses = await db.transaction.aggregate({
      where: {
        userId: dbUser.id,
        type: "EXPENSE",
        date: {
          gte: startDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpenses = expenses._sum.amount?.toNumber() || 0;
    const budgetAmount = budget.amount.toNumber();
    const percentageUsed = (totalExpenses / budgetAmount) * 100;

    // Send test alert email regardless of percentage or last alert date
    await sendEmail({
      to: user.emailAddresses[0].emailAddress,
      subject: `Budget Alert - Monthly Budget`,
      react: EmailTemplate({
        userName: user.firstName || "User",
        type: "budget-alert",
        data: {
          percentageUsed: percentageUsed.toFixed(1),
          budgetAmount: budgetAmount.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          accountName: "All Accounts",
        },
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Test budget alert sent to ${user.emailAddresses[0].emailAddress}`,
      data: {
        budgetAmount: budgetAmount.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        percentageUsed: percentageUsed.toFixed(1),
        accountName: "All Accounts",
      },
    });
  } catch (error) {
    console.error("Error sending test budget alert:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to send test budget alert", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
