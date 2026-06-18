"use client";

import React from "react";
import Link from "next/link";

interface NavbarProps {
  creditBalance: number;
}

export default function Navbar({ creditBalance }: NavbarProps) {
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
              href="/dashboard/credits"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Daily Check-in
            </Link>

            {/* Credit Badge */}
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-gray-700">Credits:</span>
              <span className="text-lg font-bold text-blue-600">
                {creditBalance}
              </span>
            </div>

            {/* User Menu */}
            <button className="text-gray-700 hover:text-gray-900 transition-colors">
              Menu
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
