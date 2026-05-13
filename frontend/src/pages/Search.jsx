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
      <div className="w-full max-w-3xl rounded-[36px] border border-[#2B2B2B]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,240,230,0.9))] p-10 text-center shadow-[0_24px_50px_rgba(111,88,60,0.08),inset_0_1px_0_rgba(255,255,255,0.82)]">
        <div className="mx-auto max-w-lg">
          <p className="text-xs uppercase tracking-[0.26em] text-[#7A6851]">
            Search
          </p>
          <h1 className="mt-4 font-serif text-[40px] tracking-[-0.05em] text-ink">
            Semantic inbox search comes next
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted">
            The reusable shell is in place. For this pass, the detailed work is
            focused on the Inbox experience first.
          </p>
        </div>

        <div className="mt-8 space-y-3 text-left">
          {prompts.map((prompt) => (
            <div
              key={prompt}
              className="rounded-[22px] border border-[#2B2B2B]/8 bg-[#FCFAF6] px-4 py-4 text-sm text-[#5C5248] shadow-[0_10px_24px_rgba(115,95,71,0.05)]"
            >
              {prompt}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
