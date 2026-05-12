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
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.995 }}
      className={`w-full rounded-[22px] border p-4 text-left transition-all duration-200 ${
        isActive
          ? "border-accent/28 bg-accent/12 shadow-glow"
          : "border-white/8 bg-white/[0.03] hover:border-white/14 hover:bg-white/[0.05] hover:shadow-halo"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {email.unread ? (
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent shadow-[0_0_18px_rgba(124,92,255,0.7)]" />
            ) : null}
            <p className="truncate text-sm font-medium text-white/86">
              {email.sender}
            </p>
          </div>
          <h3 className="mt-2 truncate text-[15px] font-semibold text-white">
            {email.subject}
          </h3>
        </div>

        <span className="shrink-0 text-xs text-white/38">{email.displayDate}</span>
      </div>

      <p
        className="mt-3 text-sm leading-6 text-white/42"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {email.preview}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
            urgencyStyles[email.urgency]
          }`}
        >
          {email.urgency}
        </span>
        <span className="text-xs font-medium text-white/34">
          Urgency {email.score}/10
        </span>
      </div>
    </motion.button>
  );
}
