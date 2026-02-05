import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { TopLoader } from "@/components/top-loader";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FinMind",
  description: "One stop Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>

        </head>
        <body className={`${inter.className}`} suppressHydrationWarning>
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Toaster richColors />

          <footer className="bg-teal-50 dark:bg-gray-900/50 py-12 border-t border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
              <p>© 2026 FinMind - AI-Powered Personal Finance Platform</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
