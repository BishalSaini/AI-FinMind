import arcjet, { createMiddleware, detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/account(.*)",
  "/transaction(.*)",
]);

// Create base Clerk middleware
const clerk = clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  return NextResponse.next();
});

// Only create Arcjet middleware if key is available
if (process.env.ARCJET_KEY) {
  const aj = arcjet({
    key: process.env.ARCJET_KEY,
    // characteristics: ["userId"], // Track based on Clerk userId
    rules: [
      // Shield protection for content and security
      shield({
        mode: "LIVE",
      }),
      detectBot({
        mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
        allow: [
          "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
          "GO_HTTP", // For Inngest
          // See the full list at https://arcjet.com/bot-list
        ],
      }),
    ],
  });

  // Chain middlewares - ArcJet runs first, then Clerk
  export default createMiddleware(aj, clerk);
} else {
  // Use only Clerk middleware if Arcjet key is not available
  console.warn("ARCJET_KEY not found - running without Arcjet protection");
  export default clerk;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
