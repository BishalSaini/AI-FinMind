import { inngest } from "@/lib/inngest/client";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Trigger the test email function
    await inngest.send({
      name: "test/email.send",
      data: {
        email: user.emailAddresses[0].emailAddress,
        name: user.firstName || "User",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${user.emailAddresses[0].emailAddress}`,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Failed to send test email", details: error.message },
      { status: 500 }
    );
  }
}
