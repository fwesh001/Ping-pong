import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) {
    if (auth.status === 401) {
      redirect("/login");
    }
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main content area - offset by sidebar width */}
        <main className="flex-1 min-w-0 xl:ml-[260px] p-4 pt-16 xl:pt-6 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-black/20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
