import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { Drawer } from '@/components/ui/Drawer';
import { useUIStore } from '@/stores/ui.store';
import { navItems } from './Sidebar';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useLogout';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui/Avatar';
import { LogOut } from 'lucide-react';
import { useHydrateAuthProfile } from '@/hooks/useAuthProfile';
import { getUserDisplayName } from '@/utils/display-name';

function MobileDrawerNav() {
  const { sidebarOpen, closeMobileSidebar } = useUIStore();
  const { user } = useAuthStore();
  const logout = useLogout();
  const location = useLocation();
  const role = user?.role ?? 'patient';
  const displayName = getUserDisplayName(user);
  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <Drawer open={sidebarOpen} onClose={closeMobileSidebar} title="CareMind AI" side="left">
      <nav aria-label="Mobile main navigation">
        <ul className="space-y-1">
          {filtered.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={closeMobileSidebar}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-md transition-all',
                    'text-base font-medium min-h-[44px]',
                    isActive
                      ? 'bg-primary-50 text-primary font-semibold'
                      : 'text-slate-600 hover:bg-surface hover:text-slate-900'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center gap-3 px-3">
          <Avatar name={displayName || user?.email} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName || user?.email}</p>
            <p className="text-xs text-muted capitalize">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={() => { logout(); closeMobileSidebar(); }}
            className="p-2 text-muted hover:text-danger transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Drawer>
  );
}

export function AppShell() {
  const location = useLocation();
  const userId = useAuthStore((s) => s.user?.id);
  useHydrateAuthProfile();

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <MobileDrawerNav />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${userId ?? 'anon'}-${location.pathname}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
