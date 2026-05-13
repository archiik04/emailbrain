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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/26">
            Intelligence layer
          </p>
          <p className="mt-2 text-sm text-white/44">
            Ask your inbox in natural language.
          </p>
        </div>
      </div>
      <motion.form
        className="group flex items-center gap-3 rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.03))] px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_18px_40px_rgba(0,0,0,0.24)] transition-all duration-200 focus-within:border-accent/22 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_1px_rgba(124,92,255,0.12),0_22px_50px_rgba(25,18,47,0.24)]"
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        whileFocus={{ scale: 1.002 }}
      >
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask your inbox anything..."
          className="h-12 flex-1 bg-transparent text-[15px] font-medium tracking-tight text-white outline-none placeholder:font-normal placeholder:text-white/24"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-[18px] border border-white/[0.08] bg-white/[0.04] px-4 text-sm font-medium text-white/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-white"
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
            className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3.5 py-1.5 text-[11px] tracking-wide text-white/42 transition hover:-translate-y-0.5 hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white/78"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
