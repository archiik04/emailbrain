import { motion } from "framer-motion";
import {
  FilePenLine,
  Inbox,
  Search,
  TimerReset,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/search", label: "Search", icon: Search },
  { to: "/followups", label: "Followups", icon: TimerReset },
  { to: "/drafts", label: "Drafts", icon: FilePenLine },
];

export default function Sidebar() {
  return (
    <aside className="hidden h-full w-[88px] shrink-0 rounded-[32px] border border-[#2B2B2B]/10 bg-[linear-gradient(180deg,rgba(255,252,247,0.92),rgba(244,238,228,0.96))] p-4 shadow-[0_18px_42px_rgba(115,95,71,0.08),inset_0_1px_0_rgba(255,255,255,0.82)] xl:flex xl:w-[272px] xl:flex-col">
      <motion.div
        className="mb-7 rounded-[28px] border border-[#2B2B2B]/8 bg-white/60 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center">
          <div className="hidden xl:block">
            <p className="font-serif text-[28px] leading-none tracking-[-0.04em] text-ink">
              EmailBrain
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Warm, focused email intelligence for daily work.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="mb-4 hidden xl:block">
        <p className="px-3 text-[11px] uppercase tracking-[0.24em] text-[#7A6851]/80">
          Browse
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-2.5">
        {navItems.map(({ to, label, icon: Icon }, index) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <motion.div
                className={`group flex items-center gap-3 rounded-[22px] border px-3 py-3.5 text-sm transition-all duration-200 xl:px-4 ${
                  isActive
                    ? "border-accent/20 bg-[linear-gradient(180deg,rgba(221,107,87,0.18),rgba(221,107,87,0.1))] text-ink shadow-[0_8px_20px_rgba(221,107,87,0.12),inset_0_1px_0_rgba(255,255,255,0.65)]"
                    : "border-transparent bg-transparent text-[#6F665C] hover:border-[#2B2B2B]/8 hover:bg-white/50 hover:text-ink"
                }`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-[16px] transition ${
                  isActive
                    ? "bg-white/70 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                    : "bg-[#EFE8DB]/70 text-[#7A6851] group-hover:bg-white/65 group-hover:text-ink"
                }`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="hidden font-medium tracking-tight xl:inline">{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="hidden rounded-[28px] border border-[#2B2B2B]/8 bg-white/55 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] xl:block">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#7A6851]/75">
          Workspace
        </p>
        <p className="mt-4 text-[15px] font-semibold tracking-tight text-ink">
          Structured browsing
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Browse your inbox like a marketplace of decisions, with clean signals
          and a calm assistant alongside.
        </p>
      </div>
    </aside>
  );
}
