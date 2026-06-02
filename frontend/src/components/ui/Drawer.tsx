import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: 'left' | 'right' | 'bottom';
  className?: string;
}

const sideConfig = {
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    position: 'inset-y-0 left-0 w-80 h-full',
  },
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    position: 'inset-y-0 right-0 w-80 h-full',
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    position: 'inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-xl',
  },
};

export function Drawer({ open, onClose, title, children, side = 'right', className }: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const config = sideConfig[side];

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={config.initial}
            animate={config.animate}
            exit={config.exit}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed z-50 bg-white shadow-modal flex flex-col',
              config.position,
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'drawer-title' : undefined}
          >
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              {title && <h2 id="drawer-title" className="text-lg font-semibold text-slate-900">{title}</h2>}
              <button
                type="button"
                onClick={onClose}
                className="ml-auto p-1 rounded-md text-muted hover:text-slate-700 hover:bg-surface transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
