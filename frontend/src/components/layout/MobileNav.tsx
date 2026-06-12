import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CalendarPlus,
  BrainCircuit,
  FileText,
  User,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/auth.store';

interface MobileNavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const mobileNavItems: MobileNavItem[] = [
  { to: '/dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin', 'doctor', 'patient'] },
  { to: '/appointments', label: 'Appts', icon: <Calendar className="w-5 h-5" />, roles: ['admin', 'doctor', 'patient'] },
  { to: '/booking', label: 'Book', icon: <CalendarPlus className="w-5 h-5" />, roles: ['doctor', 'patient'] },
  { to: '/ai-assistant', label: 'AI Chat', icon: <BrainCircuit className="w-5 h-5" />, roles: ['doctor', 'patient'] },
  { to: '/documents', label: 'Docs', icon: <FileText className="w-5 h-5" />, roles: ['doctor', 'patient'] },
  { to: '/profile', label: 'Profile', icon: <User className="w-5 h-5" />, roles: ['admin', 'doctor', 'patient'] },
];

export function MobileNav() {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const userRole = role ?? 'patient';
  const filteredItems = mobileNavItems.filter((item) => item.roles.includes(userRole));

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-around h-16">
        {filteredItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 h-16 w-full',
                  'transition-colors duration-200 min-w-[44px]',
                  isActive ? 'text-primary' : 'text-muted hover:text-slate-700'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
