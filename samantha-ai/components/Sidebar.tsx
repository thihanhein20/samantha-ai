"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Upload, Users } from "lucide-react";

const navItems = [
  { icon: BarChart2, href: "/dashboard", label: "Dashboard" },
  { icon: Upload, href: "/upload", label: "Upload" },
  { icon: Users, href: "/patients", label: "Patients" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-16 shrink-0 bg-white border-r border-gray-200 flex flex-col items-center pt-4 gap-1">
      {navItems.map(({ icon: Icon, href, label }) => {
        const isActive = pathname.startsWith(href);
        return (
          <div key={href} className="relative group">
            <Link
              href={href}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? "bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-md"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <Icon size={20} />
            </Link>
            <div className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {label}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
