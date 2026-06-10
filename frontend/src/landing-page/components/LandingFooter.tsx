import { Link, useLocation } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { NAV_LINKS, NAV_PAGE_LINKS } from '../landing-content';
import { scrollToPageTop } from '../scroll-to-top';

export function LandingFooter() {
  const location = useLocation();
  const year = new Date().getFullYear();

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/') {
      e.preventDefault();
      scrollToPageTop();
    }
  };

  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2.5" onClick={handleHomeClick}>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">CareMind</span>
            </Link>
            <p className="mt-3 text-sm text-muted max-w-xs leading-relaxed">
              HIPAA-grade telehealth — built under HIPAA rules with secure visits and
              clinician-approved notes.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-2" aria-label="Footer navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={location.pathname === '/' ? link.href : `/${link.href}`}
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            {NAV_PAGE_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link to="/login" className="text-sm text-muted hover:text-primary transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="text-sm text-muted hover:text-primary transition-colors">
              Register
            </Link>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted">
          <p>&copy; {year} CareMind AI. All rights reserved.</p>
          <p>Proprietary — CareMind AI MVP</p>
        </div>
      </div>
    </footer>
  );
}
