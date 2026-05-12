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
    <div className="space-y-3">
      <motion.form
        className="group flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 shadow-halo transition-all duration-200 focus-within:border-accent/35 focus-within:bg-white/[0.06] focus-within:shadow-glow"
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask your inbox anything..."
          className="h-12 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/28"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-white/72 transition hover:border-accent/30 hover:text-white"
        >
          Explore
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.form>

      <div className="flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onExampleClick(example)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/45 transition hover:border-accent/20 hover:bg-accent/10 hover:text-white/80"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
