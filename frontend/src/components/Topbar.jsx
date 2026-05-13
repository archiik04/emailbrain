import { motion } from "framer-motion";

export default function Topbar({ title, subtitle, sourceLabel, statPills = [] }) {
  return (
    <motion.div
      className="flex flex-col gap-6 border-b border-[#2B2B2B]/8 px-7 py-6 sm:px-8 xl:flex-row xl:items-end xl:justify-between"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div>
        <div className="mb-4 inline-flex items-center rounded-full border border-[#2B2B2B]/8 bg-white/55 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[#7A6851] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
          Productivity workspace
        </div>
        <h1 className="font-serif text-[38px] leading-none tracking-[-0.05em] text-ink">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {sourceLabel ? (
          <span className="rounded-full border border-[#2B2B2B]/8 bg-white/58 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-[#6F665C] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            Source: {sourceLabel}
          </span>
        ) : null}

        {statPills.map((pill) => (
          <span
            key={pill.label}
            className="rounded-full border border-[#2B2B2B]/8 bg-[#F7F1E7] px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-[#7A6851]"
          >
            {pill.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
