import { motion } from "framer-motion";

export default function Topbar({ title, subtitle, sourceLabel, statPills = [] }) {
  return (
    <motion.div
      className="flex flex-col gap-6 border-b border-white/[0.06] px-6 py-6 sm:px-7 xl:flex-row xl:items-end xl:justify-between"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div>
        <div className="mb-4 inline-flex items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/34">
          AI-first inbox orchestration
        </div>
        <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-white/97">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-white/42">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {sourceLabel ? (
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white/55">
            Source: {sourceLabel}
          </span>
        ) : null}

        {statPills.map((pill) => (
          <span
            key={pill.label}
            className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-white/50"
          >
            {pill.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
