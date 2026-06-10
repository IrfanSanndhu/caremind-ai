import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Server, Shield, Terminal } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SelfHostHeroCtaProps {
  className?: string;
}

export function SelfHostHeroCta({ className }: SelfHostHeroCtaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className={cn('w-full sm:w-auto', className)}
    >
      <Link to="/self-host" className="group block focus-visible:outline-none">
        <div className="relative rounded-2xl p-[2px] self-host-cta-border overflow-hidden">
          <div
            className="absolute inset-0 self-host-cta-shimmer opacity-80 group-hover:opacity-100 transition-opacity"
            aria-hidden
          />
          <div className="relative flex items-center gap-4 rounded-[14px] bg-white/95 backdrop-blur-sm px-4 py-3.5 sm:px-5 sm:py-4 shadow-lg shadow-primary/10 ring-1 ring-slate-900/5 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/20 group-hover:-translate-y-0.5">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-600 via-primary to-sky-500 flex items-center justify-center shadow-md">
                <Server className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Self-host on your VPC
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200/80">
                  <Shield className="w-3 h-3" />
                  PHI on your infra
                </span>
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm text-muted">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <Terminal className="w-3.5 h-3.5 text-primary" />
                  One curl command
                </span>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <span>Docker Hub images</span>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <span>No source on server</span>
              </p>
            </div>

            <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-primary-50 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
