"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  color = "brand",
}: StatCardProps) {
  const colorMap: Record<string, string> = {
    brand: "bg-brand-500/10 text-brand-400",
    blue: "bg-brand-500/10 text-brand-400",
    green: "bg-success/10 text-success",
    yellow: "bg-warning/10 text-warning",
    red: "bg-danger/10 text-danger",
    purple: "bg-brand-500/10 text-brand-400",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <div className="card-interactive">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-wide text-dark-400 mb-2">
            {title}
          </p>
          <p className="kpi text-2xl sm:text-3xl truncate">{value}</p>
          {subtitle && <p className="text-xs text-dark-500 mt-2">{subtitle}</p>}
          {trend && (
            <p
              className={`text-xs mt-2 font-medium ${
                trendUp ? "text-success" : "text-danger"
              }`}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-btn ${
            colorMap[color] || colorMap.brand
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
