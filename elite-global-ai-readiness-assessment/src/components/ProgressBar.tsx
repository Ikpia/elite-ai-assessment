import { motion } from "motion/react";

export function ProgressBar({
  current,
  total
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="fixed left-0 top-0 z-50 h-1.5 w-full bg-slate-200/80 backdrop-blur-xl">
      <motion.div
        className="h-full bg-gradient-to-r from-brand-700 via-brand-600 to-accent-500"
        initial={{ width: 0 }}
        animate={{ width: `${(current / total) * 100}%` }}
        transition={{ duration: 0.35 }}
      />
    </div>
  );
}
