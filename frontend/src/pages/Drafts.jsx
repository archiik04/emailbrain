import { motion } from "framer-motion";

export default function DraftsPage() {
  return (
    <motion.div
      className="flex h-full items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-white/[0.04] p-10 shadow-halo">
        <p className="text-xs uppercase tracking-[0.26em] text-white/35">
          Drafts
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          Saved draft workflows will plug into this space
        </h1>
        <p className="mt-4 text-sm leading-7 text-white/45">
          The draft-generation patterns already live inside Inbox. This route is
          ready for the next phase when we expand the drafting experience.
        </p>
      </div>
    </motion.div>
  );
}
