import { motion } from "framer-motion";

const urgencyStyles = {
  High: "border-[#E2B0A6] bg-[#F8E2DD] text-[#A24F42]",
  Medium: "border-[#E7D4A3] bg-[#F9F0CC] text-[#A77B28]",
  Low: "border-[#B8CEB2] bg-[#E6F1E2] text-[#5F7B57]",
};

const getIdentity = (sender = "") => {
  const plain = sender.replace(/<.*?>/g, "").trim();
  const parts = plain.split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
  return {
    label: plain || "Unknown",
    initials: initials || (plain[0]?.toUpperCase() ?? "E"),
  };
};

export default function EmailCard({ email, isActive, onClick }) {
  const identity = getIdentity(email.sender);

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
          ? "border-[#D9B6AA] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,238,228,0.98))] shadow-[0_14px_28px_rgba(130,99,71,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
          : "border-[#2B2B2B]/8 bg-white/70 shadow-[0_10px_18px_rgba(120,95,67,0.06),inset_0_1px_0_rgba(255,255,255,0.84)] hover:border-[#2B2B2B]/12 hover:bg-white hover:shadow-[0_16px_28px_rgba(120,95,67,0.1),inset_0_1px_0_rgba(255,255,255,0.9)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-[#2B2B2B]/8 bg-[#F3EBE0] text-sm font-semibold tracking-[0.08em] text-[#5C5348] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
            {identity.initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {email.unread ? (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#D96B57]" />
              ) : null}
              <p className="truncate text-[13px] font-semibold tracking-tight text-[#6A6157]">
                {identity.label}
              </p>
            </div>
            <h3 className="mt-2.5 truncate text-[16px] font-semibold tracking-[-0.02em] text-ink">
              {email.subject}
            </h3>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-[#F3EBE0] px-2.5 py-1 text-[11px] tracking-wide text-[#8A7D6A]">
          {email.displayDate}
        </span>
      </div>

      <p
        className="mt-4 text-[13px] leading-6 text-muted"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {email.preview}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
              urgencyStyles[email.urgency]
            }`}
          >
            {email.urgency}
          </span>
          <span className="rounded-full border border-[#2B2B2B]/8 bg-[#F7F1E7] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#7A6851]">
            {email.unread ? "Unread" : "Reviewed"}
          </span>
        </div>
        <span className="text-[11px] tracking-wide text-[#8A7D6A]">
          Priority score {email.score}/10
        </span>
      </div>
    </motion.button>
  );
}
