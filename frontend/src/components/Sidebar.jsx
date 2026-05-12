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
    <aside className="hidden h-full w-[88px] shrink-0 rounded-[28px] border border-white/10 bg-white/[0.04] p-3 shadow-halo backdrop-blur-xl xl:flex xl:w-[252px] xl:flex-col">
      <motion.div
        className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center">
          <div className="hidden xl:block">
            <p className="text-sm font-semibold tracking-wide text-white">
              EmailBrain
            </p>
            <p className="text-xs text-white/45">AI workspace for email</p>
          </div>
        </div>
      </motion.div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map(({ to, label, icon: Icon }, index) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <motion.div
                className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all duration-200 xl:px-4 ${
                  isActive
                    ? "border-accent/30 bg-accent/[0.14] text-white shadow-glow"
                    : "border-transparent bg-transparent text-white/58 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                }`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-white/70 group-hover:text-white">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="hidden font-medium xl:inline">{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 xl:block">
        <p className="text-xs uppercase tracking-[0.22em] text-white/35">
          System
        </p>
        <p className="mt-3 text-sm font-medium text-white/88">
          Calm, local-first workflow
        </p>
        <p className="mt-2 text-sm leading-6 text-white/45">
          Prioritize what matters, keep context nearby, and let AI do the first
          pass.
        </p>
      </div>
    </aside>
  );
}
