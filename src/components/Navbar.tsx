"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NavbarProps {
  creditBalance: number;
}

export default function Navbar({ creditBalance }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <Link href="/" className="text-2xl font-bold text-blue-600">
            ping-pong
          </Link>

          {/* Right Items */}
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-blue-600 transition-colors hidden sm:block"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/credits"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Daily Check-in
            </Link>

            {/* Credit Badge */}
            <Link
              href="/dashboard/credits"
              className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Credits:</span>
              <span className="text-lg font-bold text-blue-600">
                {typeof creditBalance === "number"
                  ? creditBalance.toFixed(2)
                  : creditBalance}
              </span>
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  U
                </div>
                <svg
                  className="w-4 h-4 hidden sm:block"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:hidden"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/credits"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Daily Check-in
                  </Link>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {loggingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
