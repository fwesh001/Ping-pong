import type { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
  title: string;
  metric: number | string;
  subtitle?: string;
  icon: LucideIcon;
  colorTint?: string;
}

export default function AdminStatCard({
  title,
  metric,
  subtitle,
  icon: Icon,
  colorTint = "text-slate-100",
}: AdminStatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className={`mt-4 text-4xl font-semibold ${colorTint}`}>{metric}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <Icon className={`w-5 h-5 ${colorTint}`} />
      </div>
    </div>
  );
}
