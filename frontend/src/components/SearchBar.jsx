import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  examples = [],
  onExampleClick,
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#7A6851]/80">
            Search workspace
          </p>
          <p className="mt-2 text-sm text-muted">
            Search your inbox like a structured opportunity board.
          </p>
        </div>
      </div>
      <motion.form
        className="group mx-auto flex max-w-3xl items-center gap-3 rounded-[28px] border border-[#2B2B2B]/10 bg-white/76 px-6 py-5 shadow-[0_18px_38px_rgba(120,95,67,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-200 focus-within:-translate-y-0.5 focus-within:border-[#D8B08A] focus-within:bg-white"
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask your inbox anything..."
          className="h-12 flex-1 bg-transparent text-[16px] font-medium tracking-tight text-ink outline-none placeholder:font-normal placeholder:text-[#8A7D6A]"
        />
        <button
          type="submit"
          className="inline-flex h-12 items-center gap-2 rounded-[20px] border border-[#D45F4D]/20 bg-accent px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(221,107,87,0.18)] transition hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[#D45F4D]"
        >
          Explore
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.form>

      <div className="flex flex-wrap gap-2.5">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onExampleClick(example)}
            className="rounded-full border border-[#2B2B2B]/8 bg-[#F7F1E7] px-3.5 py-1.5 text-[11px] tracking-wide text-[#6F665C] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition hover:-translate-y-0.5 hover:bg-white hover:text-ink"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
