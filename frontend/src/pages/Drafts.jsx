import { motion } from "framer-motion";

export default function DraftsPage() {
  return (
    <motion.div
      className="flex h-full items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-2xl rounded-[36px] border border-[#2B2B2B]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,240,230,0.9))] p-10 shadow-[0_24px_50px_rgba(111,88,60,0.08),inset_0_1px_0_rgba(255,255,255,0.82)]">
        <p className="text-xs uppercase tracking-[0.26em] text-[#7A6851]">
          Drafts
        </p>
        <h1 className="mt-4 font-serif text-[38px] tracking-[-0.05em] text-ink">
          Saved draft workflows will plug into this space
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          The draft-generation patterns already live inside Inbox. This route is
          ready for the next phase when we expand the drafting experience.
        </p>
      </div>
    </motion.div>
  );
}
