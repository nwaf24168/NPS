import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import alramzLogo from "@/assets/alramz-logo.png";
import { LayoutDashboard, Users, FileSpreadsheet, Send, BarChart3, Menu, X, ClipboardList, CalendarClock } from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { path: "/dashboard/customers", label: "العملاء", icon: Users },
  { path: "/dashboard/nps-new", label: "NPS جديد", icon: ClipboardList },
  { path: "/dashboard/nps-year", label: "NPS بعد سنة", icon: CalendarClock },
  { path: "/dashboard/import", label: "استيراد Excel", icon: FileSpreadsheet },
  { path: "/dashboard/campaigns", label: "الحملات", icon: Send },
  { path: "/dashboard/analytics", label: "التحليلات", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" dir="rtl">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-64 bg-card border-l border-border transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 flex items-center justify-between">
          <img src={alramzLogo} alt="الرمز" className="h-10" />
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="border-b border-border p-4 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <img src={alramzLogo} alt="الرمز" className="h-8" />
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
