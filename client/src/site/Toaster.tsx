import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Info, Link2 } from 'lucide-react';
import { useToasts, type ToastIcon } from '@/lib/toast';
import { usePrefersReducedMotion } from '@/lib/media';

const ICON: Record<ToastIcon, typeof Check> = { check: Check, link: Link2, info: Info };

/** Where toasts appear. The live region is always there, so screen readers announce each one. */
export function Toaster() {
  const list = useToasts();
  const reduced = usePrefersReducedMotion();
  return createPortal(
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {list.map((t) => {
          const I = ICON[t.icon];
          return (
            <motion.div
              key={t.id}
              layout={!reduced}
              className="toast"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.16 } }}
              transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            >
              <span className="toast-ico" data-icon={t.icon}>
                <I size={14} strokeWidth={2.6} />
              </span>
              <span>{t.text}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
