import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  TIMEZONE_OPTIONS,
  filterTimezoneOptions,
  findTimezoneOption,
} from '@/utils/timezone-options';

interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
}

export function TimezoneSelect({
  value,
  onChange,
  label = 'Timezone',
  helperText = 'Used for appointment times in emails and notifications.',
  disabled = false,
}: TimezoneSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => findTimezoneOption(value) ?? { value, label: value, offsetHours: 0, keywords: '' },
    [value],
  );

  const filtered = useMemo(() => {
    const list = filterTimezoneOptions(query);
    if (value && !list.some((o) => o.value === value)) {
      return [selected, ...list];
    }
    return list;
  }, [query, selected, value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const pick = (iana: string) => {
    onChange(iana);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700">{label}</span>
      )}

      <div className="relative z-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          disabled={disabled}
          placeholder="Search city, region, or UTC offset (e.g. Karachi, Asia, UTC+5)"
          value={open ? query : selected.label}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          className={cn(
            'w-full pl-9 pr-10 py-2.5 text-sm border border-border rounded-lg bg-white',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        />
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none transition-transform',
            open && 'rotate-180',
          )}
        />

        {open && !disabled && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-white border border-border rounded-lg shadow-elevated py-1"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">No timezones match your search</li>
          ) : (
            filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => pick(opt.value)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors',
                    opt.value === value && 'bg-primary/10 text-primary font-medium',
                  )}
                >
                  {opt.label}
                </button>
              </li>
            ))
          )}
        </ul>
        )}
      </div>

      {helperText && (
        <p className="text-xs text-muted">
          {helperText} Showing {TIMEZONE_OPTIONS.length} zones from UTC−12 to UTC+12.
        </p>
      )}
    </div>
  );
}
