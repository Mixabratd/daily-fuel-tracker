import { Link } from "@tanstack/react-router";
import { Home, NotebookPen, TrendingUp, Settings } from "lucide-react";

const tabs = [
  { to: "/", label: "Today", icon: Home, exact: true },
  { to: "/log", label: "Log", icon: NotebookPen, exact: true },
  { to: "/progress", label: "Progress", icon: TrendingUp, exact: true },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <ul className="mx-auto grid w-full max-w-md grid-cols-4 gap-1 px-2 pt-2 pb-safe">
        {tabs.map(({ to, label, icon: Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              className="flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
            >
              <Icon className="size-5" strokeWidth={2.2} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
