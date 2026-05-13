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
    <aside className="hidden h-full w-[88px] shrink-0 rounded-[30px] border border-white/[0.07] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl xl:flex xl:w-[252px] xl:flex-col">
      <motion.div
        className="mb-7 rounded-[28px] border border-white/[0.06] bg-white/[0.035] px-5 py-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center">
          <div className="hidden xl:block">
            <p className="text-[15px] font-semibold tracking-tight text-white/96">
              EmailBrain
            </p>
            <p className="mt-1 text-sm text-white/38">AI workspace for email</p>
          </div>
        </div>
      </motion.div>

      <nav className="flex flex-1 flex-col gap-2.5">
        {navItems.map(({ to, label, icon: Icon }, index) => (
          <NavLink key={to} to={to}>
            {({ isActive }) => (
              <motion.div
                className={`group flex items-center gap-3 rounded-[22px] border px-3 py-3.5 text-sm transition-all duration-200 xl:px-4 ${
                  isActive
                    ? "border-accent/18 bg-[linear-gradient(180deg,rgba(124,92,255,0.14),rgba(124,92,255,0.08))] text-white shadow-[0_0_0_1px_rgba(124,92,255,0.08),0_18px_40px_rgba(31,17,64,0.28)]"
                    : "border-transparent bg-transparent text-white/48 hover:border-white/[0.06] hover:bg-white/[0.035] hover:text-white/82"
                }`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-[16px] transition ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "bg-white/[0.03] text-white/54 group-hover:bg-white/[0.05] group-hover:text-white/84"
                }`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="hidden font-medium tracking-tight xl:inline">{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="hidden rounded-[28px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-5 py-5 xl:block">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/26">
          System
        </p>
        <p className="mt-4 text-[15px] font-medium tracking-tight text-white/86">
          Calm, local-first workflow
        </p>
        <p className="mt-3 text-sm leading-7 text-white/38">
          Prioritize what matters, keep context nearby, and let AI do the first
          pass.
        </p>
      </div>
    </aside>
  );
}
