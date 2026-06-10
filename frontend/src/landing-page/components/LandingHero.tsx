import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { HERO_STATS } from '../landing-content';
import { LandingProductPreview } from './LandingProductPreview';
import { SelfHostHeroCta } from './SelfHostHeroCta';

export function LandingHero() {
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="relative min-h-screen min-h-[100dvh] flex flex-col overflow-hidden">
      <div className="absolute inset-0 landing-hero-bg" aria-hidden />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-3xl" aria-hidden />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/10 blur-3xl" aria-hidden />

      <div className="relative flex-1 flex items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-[4.5rem] pb-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-white text-sm font-semibold shadow-sm">
                  <ShieldCheck className="w-4 h-4" />
                  HIPAA-grade platform
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary/20 text-primary text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  AI-powered telehealth
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-slate-900 leading-[1.1] tracking-tight">
                Clinical care,
                <span className="block bg-gradient-to-r from-primary via-sky-500 to-secondary bg-clip-text text-transparent">
                  intelligently orchestrated.
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-muted leading-relaxed max-w-xl">
                CareMind unifies video visits, document intelligence, and clinician-approved
                AI notes — built under HIPAA rules with isolated tenant data, audit logs, and
                consent-first recording.
              </p>

              <div className="mt-8 flex flex-col gap-4">
                {isAuthenticated ? (
                  <Link to="/dashboard" className="w-fit">
                    <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                      Open App
                    </Button>
                  </Link>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <Link to="/register" className="w-full sm:w-auto">
                        <Button
                          size="lg"
                          className="w-full sm:w-auto"
                          rightIcon={<ArrowRight className="w-5 h-5" />}
                        >
                          Get started free
                        </Button>
                      </Link>
                    </div>
                    <SelfHostHeroCta />
                  </>
                )}
              </div>

              <div className="mt-8 lg:mt-10 grid grid-cols-3 gap-4 sm:gap-6 max-w-md">
                {HERO_STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-muted mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <LandingProductPreview />
        </div>
      </div>
    </section>
  );
}
