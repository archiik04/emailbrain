import { motion } from "framer-motion";

const prompts = [
  "What deadlines are buried in my inbox?",
  "Summarize every recruiter thread from this week.",
  "Which conversations still need a reply?",
];

export default function SearchPage() {
  return (
    <motion.div
      className="flex h-full items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-white/[0.04] p-10 text-center shadow-halo">
        <div className="mx-auto max-w-lg">
          <p className="text-xs uppercase tracking-[0.26em] text-white/35">
            Search
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Semantic inbox search comes next
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/45">
            The reusable shell is in place. For this pass, the detailed work is
            focused on the Inbox experience first.
          </p>
        </div>

        <div className="mt-8 space-y-3 text-left">
          {prompts.map((prompt) => (
            <div
              key={prompt}
              className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm text-white/58"
            >
              {prompt}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
