import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { usePrefersReducedMotion } from '@/lib/media';

/** Sun ↔ moon: the old icon spins out as the new one spins in. */
export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const reduced = usePrefersReducedMotion();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button className="btn btn--ghost btn--icon theme-toggle" onClick={toggle} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={theme}
          className="theme-toggle-icon"
          initial={reduced ? false : { rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
