import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  separator?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div onClick={() => setOpen((v) => !v)} role="button" tabIndex={0} onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setOpen((v) => !v);
      }}>
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-1 min-w-[160px] bg-white rounded-lg border border-border shadow-elevated py-1',
              align === 'right' ? 'right-0' : 'left-0'
            )}
            role="menu"
          >
            {items.map((item, idx) => (
              <div key={idx}>
                {item.separator && idx > 0 && <div className="h-px bg-border my-1" />}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-base transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    item.variant === 'danger'
                      ? 'text-danger hover:bg-danger-50'
                      : 'text-slate-700 hover:bg-surface'
                  )}
                >
                  {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                  {item.label}
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
