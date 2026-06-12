import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Mail, MailOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  notificationsApi,
  notificationKeys,
  NOTIFICATION_PAGE_SIZE,
  type AppNotification,
} from '@/api/notifications.api';
import { cn } from '@/utils/cn';
import { formatTimeAgo } from '@/utils/formatDate';

/** Visible rows in the dropdown before scrolling (~5 notification cards). */
const VISIBLE_NOTIFICATION_ROWS = 5;
const ROW_HEIGHT_REM = 5.25;

function notificationLink(n: AppNotification): string | null {
  if (n.resourceType === 'Appointment' && n.resourceId) {
    return `/appointments/${n.resourceId}`;
  }
  return null;
}

interface NotificationPanelProps {
  unreadCount: number;
}

export function NotificationPanel({ unreadCount }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }) =>
      notificationsApi.list({ limit: NOTIFICATION_PAGE_SIZE, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const markUnreadMutation = useMutation({
    mutationFn: notificationsApi.markUnread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

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

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.readAt) {
      markReadMutation.mutate(n.id);
    }
    const link = notificationLink(n);
    if (link) {
      navigate(link);
      setOpen(false);
    }
  };

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
  const loadedCount = notifications.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md text-muted hover:text-slate-700 hover:bg-surface transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-1 w-[min(100vw-2rem,380px)] bg-white rounded-lg border border-border shadow-elevated overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h3 className="font-semibold text-slate-900">Notifications</h3>
                {loadedCount > 0 && (
                  <p className="text-xs text-muted mt-0.5">
                    Showing {loadedCount}
                    {hasNextPage ? '+' : ''} loaded
                  </p>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-700 disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {isLoading ? (
              <p className="px-4 py-8 text-sm text-muted text-center">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted text-center">No notifications yet</p>
            ) : (
              <>
                <div
                  className="overflow-y-auto"
                  style={{
                    maxHeight: `calc(${VISIBLE_NOTIFICATION_ROWS} * ${ROW_HEIGHT_REM}rem)`,
                  }}
                >
                  <ul>
                    {notifications.map((n) => (
                      <li key={n.id} className="border-b border-border last:border-0">
                        <div
                          className={cn(
                            'flex gap-2 px-4 py-3 hover:bg-surface transition-colors cursor-pointer min-h-[5.25rem]',
                            !n.readAt && 'bg-primary/5',
                          )}
                          onClick={() => handleNotificationClick(n)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleNotificationClick(n);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm text-slate-900', !n.readAt && 'font-semibold')}>
                              {n.title}
                            </p>
                            <p className="text-sm text-muted mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-xs text-muted mt-1">{formatTimeAgo(n.createdAt)}</p>
                          </div>
                          <button
                            type="button"
                            title={n.readAt ? 'Mark as unread' : 'Mark as read'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (n.readAt) {
                                markUnreadMutation.mutate(n.id);
                              } else {
                                markReadMutation.mutate(n.id);
                              }
                            }}
                            className="p-1.5 rounded-md text-muted hover:text-slate-700 hover:bg-white flex-shrink-0 self-start"
                          >
                            {n.readAt ? (
                              <Mail className="w-4 h-4" />
                            ) : (
                              <MailOpen className="w-4 h-4 text-primary" />
                            )}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {hasNextPage && (
                  <div className="border-t border-border px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="w-full text-sm font-medium text-primary hover:text-primary-700 disabled:opacity-50 py-1.5"
                    >
                      {isFetchingNextPage
                        ? 'Loading...'
                        : `Load more (${NOTIFICATION_PAGE_SIZE} more)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
