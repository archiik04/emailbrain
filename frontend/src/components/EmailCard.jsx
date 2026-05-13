import { motion } from "framer-motion";

const urgencyStyles = {
  High: "border-rose-400/18 bg-rose-400/10 text-rose-200",
  Medium: "border-amber-300/18 bg-amber-300/10 text-amber-100",
  Low: "border-emerald-300/18 bg-emerald-300/10 text-emerald-100",
};

export default function EmailCard({ email, isActive, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`w-full rounded-[24px] border px-4 py-4.5 text-left transition-all duration-200 ${
        isActive
          ? "border-accent/18 bg-[linear-gradient(180deg,rgba(124,92,255,0.12),rgba(124,92,255,0.06))] shadow-[0_0_0_1px_rgba(124,92,255,0.08),0_18px_38px_rgba(23,17,44,0.24)]"
          : "border-white/[0.06] bg-white/[0.025] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:border-white/[0.1] hover:bg-white/[0.04] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.22)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {email.unread ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent/90 shadow-[0_0_10px_rgba(124,92,255,0.45)]" />
            ) : null}
            <p className="truncate text-[13px] font-medium tracking-tight text-white/72">
              {email.sender}
            </p>
          </div>
          <h3 className="mt-2.5 truncate text-[15px] font-medium tracking-tight text-white/94">
            {email.subject}
          </h3>
        </div>

        <span className="shrink-0 text-[11px] tracking-wide text-white/28">{email.displayDate}</span>
      </div>

      <p
        className="mt-3.5 text-[13px] leading-6 text-white/38"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {email.preview}
      </p>

      <div className="mt-4.5 flex items-center justify-between gap-3">
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${
            urgencyStyles[email.urgency]
          }`}
        >
          {email.urgency}
        </span>
        <span className="text-[11px] tracking-wide text-white/28">
          {email.score}/10 priority
        </span>
      </div>
    </motion.button>
  );
}
