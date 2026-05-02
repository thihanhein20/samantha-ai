"use client";

import { useEffect, useState } from "react";
import { Users, FileText, TrendingUp } from "lucide-react";

interface Stats {
  total_patients: number;
  total_documents: number;
  this_week: number;
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.stats); });
  }, []);

  const cards = [
    {
      label: "Total Patients",
      value: stats?.total_patients ?? null,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Documents",
      value: stats?.total_documents ?? null,
      icon: FileText,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "This Week",
      value: stats?.this_week ?? null,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 max-w-7xl mx-auto mb-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={card.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {card.value === null ? (
                  <span className="inline-block w-10 h-6 bg-gray-100 rounded animate-pulse" />
                ) : (
                  card.value.toLocaleString()
                )}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
