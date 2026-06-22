"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CreditCard, LogOut, ChevronDown, LayoutDashboard, CalendarCheck, ScrollText } from "lucide-react";

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
    } catch { router.push("/login"); }
    finally { setLoggingOut(false); setMenuOpen(false); }
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/ping-pong.png" alt="ping-pong" width={32} height={32} className="rounded-lg" style={{ width: "auto", height: "auto" }} />
            <span className="text-xl font-bold text-blue-600 hidden sm:inline">ping-pong</span>
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors hidden sm:flex items-center gap-1.5 text-sm">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/dashboard/logs" className="text-gray-700 hover:text-blue-600 transition-colors hidden sm:flex items-center gap-1.5 text-sm">
              <ScrollText className="w-4 h-4" />
              Logs
            </Link>
            <Link href="/dashboard/credits" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1.5 text-sm">
              <CalendarCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Daily Check-in</span>
              <span className="sm:hidden">Credits</span>
            </Link>

            <Link href="/dashboard/credits" className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-600">
                {typeof creditBalance === "number" ? creditBalance.toFixed(2) : creditBalance}
              </span>
            </Link>

            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">U</div>
                <ChevronDown className="w-4 h-4 hidden sm:block" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 sm:hidden" onClick={() => setMenuOpen(false)}>
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link href="/dashboard/logs" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>
                    <ScrollText className="w-4 h-4" /> Logs
                  </Link>
                  <Link href="/dashboard/credits" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setMenuOpen(false)}>
                    <CalendarCheck className="w-4 h-4" /> Daily Check-in
                  </Link>
                  <hr className="my-1 border-gray-200" />
                  <button onClick={handleLogout} disabled={loggingOut} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">
                    <LogOut className="w-4 h-4" /> {loggingOut ? "Signing out..." : "Sign Out"}
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
