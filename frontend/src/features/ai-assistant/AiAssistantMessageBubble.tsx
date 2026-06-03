import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui';
import { MarkdownContent } from '@/components/shared/MarkdownContent';
import { formatTime } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import type { ChatMessage } from '@/types';

export function AiAssistantMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      <Avatar
        name={isUser ? 'You' : 'AI'}
        size="sm"
        className={cn(!isUser && 'bg-primary-100 text-primary')}
      />
      <div className={cn('max-w-[80%] space-y-1', isUser && 'items-end flex flex-col')}>
        <div
          className={cn(
            'px-4 py-3 rounded-xl text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-white rounded-tr-sm'
              : 'bg-white border border-border text-slate-800 rounded-tl-sm shadow-card'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>
        <span className="text-xs text-muted px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
