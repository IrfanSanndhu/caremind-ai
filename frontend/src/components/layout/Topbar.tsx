import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronRight, LogOut, User } from 'lucide-react';
import { getUserDisplayName } from '@/utils/display-name';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';

function buildBreadcrumbs(pathname: string): { label: string; to: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; to: string }[] = [];
  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    const label = seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, to: path });
  }
  return crumbs;
}

export function Topbar() {
  const { toggleMobileSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const displayName = getUserDisplayName(user);

  const breadcrumbs = buildBreadcrumbs(location.pathname);

  const dropdownItems = [
    {
      label: 'Profile',
      icon: <User className="w-4 h-4" />,
      onClick: () => navigate('/profile'),
    },
    {
      label: 'Logout',
      icon: <LogOut className="w-4 h-4" />,
      onClick: logout,
      variant: 'danger' as const,
      separator: true,
    },
  ];

  return (
    <header className="h-14 border-b border-border bg-white flex items-center px-4 gap-4 flex-shrink-0 sticky top-0 z-30">
      <button
        type="button"
        onClick={toggleMobileSidebar}
        className="lg:hidden p-2 rounded-md text-muted hover:text-slate-700 hover:bg-surface transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <nav className="flex items-center gap-1 flex-1 text-sm overflow-hidden" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, idx) => (
          <span key={crumb.to} className="flex items-center gap-1 min-w-0">
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted flex-shrink-0" />}
            {idx === breadcrumbs.length - 1 ? (
              <span className="text-slate-900 font-medium truncate">{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="text-muted hover:text-slate-700 transition-colors truncate">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-2 rounded-md text-muted hover:text-slate-700 hover:bg-surface transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full" aria-hidden="true" />
        </button>

        <Dropdown
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-surface transition-colors min-h-[44px]"
              aria-label="User menu"
            >
              <Avatar name={displayName || user?.email} size="sm" />
              <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[160px] truncate">
                {displayName || user?.email}
              </span>
            </button>
          }
          items={dropdownItems}
        />
      </div>
    </header>
  );
}
