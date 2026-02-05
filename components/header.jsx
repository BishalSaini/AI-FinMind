"use client";

import React from "react";
import { Button } from "./ui/button";
import { PenBox, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import NProgress from "nprogress";

const Header = () => {
  const handleLinkClick = () => {
    NProgress.start();
  };

  return (
    <div className="fixed top-0 w-full z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="w-full flex items-center justify-between glass-header rounded-full px-6 py-3 mx-auto shadow-md backdrop-blur-xl bg-white/40 dark:bg-black/40 border border-white/20 dark:border-white/10 supports-[backdrop-filter]:bg-white/20">
          <Link href="/">
            <span className="text-2xl font-bold gradient-title pr-0">
              FinMind
            </span>
          </Link>

          {/* Navigation Links - Different for signed in/out users */}
          <div className="hidden md:flex items-center space-x-8">
            <SignedOut>
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
                Features
              </a>

            </SignedOut>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <SignedIn>
              <Link
                href="/dashboard"
                prefetch={true}
                onClick={handleLinkClick}
                className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
              >
                <Button variant="ghost" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-95">
                  <LayoutDashboard size={18} />
                  <span className="hidden md:inline ml-2">Dashboard</span>
                </Button>
              </Link>
              <Link href="/transaction/create" prefetch={true} onClick={handleLinkClick}>
                <Button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95">
                  <PenBox size={18} />
                  <span className="hidden md:inline">Add Transaction</span>
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton forceRedirectUrl="/dashboard">
                <Button variant="outline" className="border-gray-300 dark:border-gray-700 rounded-full px-6 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Login</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 ring-2 ring-blue-500/20",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Header;
