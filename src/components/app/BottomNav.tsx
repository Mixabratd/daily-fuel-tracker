import { Link } from "@tanstack/react-router";
import { Home, NotebookPen, Target, Settings } from "lucide-react";

const tabs = [
  { to: "/", label: "Today", icon: Home },
  { to: "/log", label: "Log", icon: NotebookPen },
  { to: "/targets", label: "Targets", icon: Target },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-safe">
      <ul className="mb-2 grid grid-cols-4 rounded-3xl bg-ink p-1.5 shadow-float">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: true }}
              className="group flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium text-ink-foreground/60 transition-colors data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
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
