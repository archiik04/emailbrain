import { motion } from "framer-motion";

export default function Topbar({ title, subtitle, sourceLabel, statPills = [] }) {
  return (
    <motion.div
      className="flex flex-col gap-5 border-b border-white/8 px-5 py-5 sm:px-6 xl:flex-row xl:items-end xl:justify-between"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div>
        <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/55">
          AI-first inbox orchestration
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sourceLabel ? (
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/60">
            Source: {sourceLabel}
          </span>
        ) : null}

        {statPills.map((pill) => (
          <span
            key={pill.label}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/70"
          >
            {pill.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
