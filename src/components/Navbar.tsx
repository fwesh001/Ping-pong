"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CreditCard, LogOut, ChevronDown, LayoutDashboard, CalendarCheck, ScrollText, Bell, ShoppingCart, ShieldCheck, Menu, X } from "lucide-react";

interface NavbarProps {
  creditBalance: number;
}

export default function Navbar({ creditBalance }: NavbarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadRole() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        setRole(data.user.role || null);
      } catch {
        setRole(null);
      }
    }
    loadRole();
  }, []);

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch { router.push("/login"); }
    finally { setLoggingOut(false); setIsOpen(false); }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
    { href: "/dashboard/logs", label: "Logs", icon: ScrollText },
    { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { href: "/dashboard/store", label: "Store", icon: ShoppingCart },
    { href: "/dashboard/credits", label: "Daily Check-in", icon: CalendarCheck },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-700 shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo (LHS) */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/ping-pong.png" alt="ping-pong" width={32} height={32} className="rounded-lg" style={{ width: "auto", height: "auto" }} />
            <span className="text-xl font-bold text-brand-cyan hidden sm:inline font-poppins">ping-pong</span>
          </Link>

          {/* Desktop Navigation (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-300 hover:text-brand-cyan transition-colors flex items-center gap-1.5 text-sm"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* RHS: Credits + Hamburger Menu */}
          <div className="flex items-center gap-3">
            {/* Credits Display */}
            <Link href="/dashboard/credits" className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800/95 transition-colors flex-shrink-0">
              <CreditCard className="w-4 h-4 text-brand-cyan" />
              <span className="text-sm font-bold text-brand-cyan">
                {typeof creditBalance === "number" ? creditBalance.toFixed(2) : creditBalance}
              </span>
            </Link>

            {/* Hamburger Menu Button (mobile) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden flex items-center gap-2 text-slate-300 hover:text-slate-100 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-700 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-brand-cyan transition-colors rounded-lg"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            <hr className="my-2 border-slate-700" />
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-slate-800 transition-colors rounded-lg disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
