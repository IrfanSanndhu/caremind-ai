import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, ArrowRight, Menu, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/utils/cn';
import { NAV_LINKS, NAV_PAGE_LINKS } from '../landing-content';
import { scrollToPageTop } from '../scroll-to-top';

export function LandingNavbar() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    closeMobile();
    if (location.pathname === '/') {
      e.preventDefault();
      scrollToPageTop();
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-border/60 shadow-sm'
          : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[4.5rem]">
          <Link to="/" className="flex items-center gap-2.5 group" onClick={handleHomeClick}>
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">CareMind</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary mt-0.5">
                <ShieldCheck className="w-3 h-3" />
                HIPAA-grade
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Landing navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={location.pathname === '/' ? link.href : `/${link.href}`}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            {NAV_PAGE_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Open App
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="md">Sign in</Button>
                </Link>
                <Link to="/register">
                  <Button size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-surface"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/60 bg-white overflow-hidden"
          >
            <nav className="px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={location.pathname === '/' ? link.href : `/${link.href}`}
                  onClick={closeMobile}
                  className="px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-surface"
                >
                  {link.label}
                </a>
              ))}
              {NAV_PAGE_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobile}
                  className="px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-surface"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-border flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={closeMobile}>
                    <Button className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Open App
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMobile}>
                      <Button variant="outline" className="w-full">Sign in</Button>
                    </Link>
                    <Link to="/register" onClick={closeMobile}>
                      <Button className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                        Get started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
