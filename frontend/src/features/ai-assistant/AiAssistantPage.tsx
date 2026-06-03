import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, AlertTriangle, BrainCircuit, Stethoscope, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, Avatar } from '@/components/ui';
import { aiApi } from '@/api/ai.api';
import { appointmentsApi, appointmentKeys } from '@/api/appointments.api';
import { useAuthStore } from '@/stores/auth.store';
import { UserRole } from '@/types';
import { formatTime } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import type { ChatMessage } from '@/types';

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center py-2 px-1" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 bg-muted rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
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
          {message.content}
        </div>
        <span className="text-xs text-muted px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

export function AiAssistantPage() {
  const { role } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [escalated, setEscalated] = useState(false);
  const [isDoctorMode, setIsDoctorMode] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { data: appointments } = useQuery({
    queryKey: appointmentKeys.lists(),
    queryFn: () => appointmentsApi.list({ pageSize: 20 }),
    retry: 1,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, streamingContent]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsStreaming(true);
    setStreamingContent('');
    setEscalated(false);

    abortControllerRef.current = new AbortController();

    // Doctor copilot uses /api/ai/doctor-copilot/:patientId (patient-wide context)
    if (isDoctorMode) {
      if (!selectedPatientId) {
        setIsStreaming(false);
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Select a patient to use Copilot mode.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
        return;
      }

      aiApi
        .doctorCopilot({ patientId: selectedPatientId, q: text })
        .then((res) => {
          if (res.escalated) setEscalated(true);
          const aiMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: res.response,
            timestamp: new Date().toISOString(),
            escalated: res.escalated,
          };
          setMessages((prev) => [...prev, aiMsg]);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          const errMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `I encountered an error: ${msg}. Please try again.`,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errMsg]);
        })
        .finally(() => {
          setIsStreaming(false);
          setStreamingContent('');
        });

      return;
    }

    let accumulatedContent = '';

    aiApi.streamChat(
      {
        message: text,
        appointmentId: selectedAppointmentId || undefined,
      },
      (chunk) => {
        accumulatedContent += chunk;
        setStreamingContent(accumulatedContent);
      },
      (isEscalated) => {
        setIsStreaming(false);
        setStreamingContent('');
        if (isEscalated) setEscalated(true);
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: accumulatedContent,
          timestamp: new Date().toISOString(),
          escalated: isEscalated,
        };
        setMessages((prev) => [...prev, aiMsg]);
      },
      (error) => {
        setIsStreaming(false);
        setStreamingContent('');
        const errMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I encountered an error: ${error}. Please try again.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      },
      abortControllerRef.current.signal
    );
  }, [input, isStreaming, selectedAppointmentId, isDoctorMode, selectedPatientId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setStreamingContent('');
    setIsStreaming(false);
    setEscalated(false);
  };

  const appointmentOptions = appointments?.items.map((a) => ({
    value: a.id,
    label: `${a.patient?.firstName} ${a.patient?.lastName} — ${new Date(a.scheduledAt).toLocaleDateString()}`,
  })) ?? [];

  const patientOptions =
    appointments?.items
      .map((a) => a.patient)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .reduce<Record<string, { value: string; label: string }>>((acc, p) => {
        const label = `${p.firstName} ${p.lastName}`.trim();
        acc[p.id] = { value: p.id, label };
        return acc;
      }, {}) ?? {};

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Assistant</h1>
              <p className="text-xs text-muted">
                {isDoctorMode ? 'Doctor Copilot Mode' : 'Patient Assistant Mode'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="p-2 text-muted hover:text-slate-700 hover:bg-surface rounded-md transition-colors"
                aria-label="Clear chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {(role === UserRole.DOCTOR || role === UserRole.ADMIN) && (
              <button
                type="button"
                onClick={() => setIsDoctorMode(!isDoctorMode)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  isDoctorMode
                    ? 'bg-secondary text-white'
                    : 'bg-surface text-muted hover:text-slate-700'
                )}
                aria-label="Toggle doctor copilot mode"
              >
                <Stethoscope className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isDoctorMode ? 'Copilot Mode' : 'Switch to Copilot'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Context selector */}
        {!isDoctorMode && appointmentOptions.length > 0 && (
          <div className="mt-3 max-w-sm">
            <Select
              options={[{ value: '', label: 'No appointment context' }, ...appointmentOptions]}
              value={selectedAppointmentId}
              onChange={(e) => setSelectedAppointmentId(e.target.value)}
            />
          </div>
        )}

        {isDoctorMode && (
          <div className="mt-3 max-w-sm">
            <Select
              options={[
                { value: '', label: 'Select a patient' },
                ...Object.values(patientOptions),
              ]}
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Escalation Banner */}
      <AnimatePresence>
        {escalated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-danger-50 border-b border-danger-100 px-6 py-3 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" />
            <p className="text-sm text-danger-700 font-medium">
              Safety concern detected. Please contact a healthcare professional immediately if this is urgent. Call emergency services if needed.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-surface">
        {messages.length === 0 && !isStreaming && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
              <BrainCircuit className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              {isDoctorMode ? 'Doctor Copilot Ready' : 'How can I help you?'}
            </h2>
            <p className="text-sm text-muted max-w-xs">
              {isDoctorMode
                ? 'Ask me to generate clinical notes, summarize cases, or assist with documentation.'
                : 'Ask me about medications, symptoms, appointment preparation, or general health questions.'}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <div className="flex gap-3">
            <Avatar name="AI" size="sm" className="bg-primary-100 text-primary" />
            <div className="max-w-[80%]">
              <div className="bg-white border border-border rounded-xl rounded-tl-sm shadow-card px-4 py-3 text-sm leading-relaxed text-slate-800">
                {streamingContent || <TypingIndicator />}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-border">
        <div className="flex items-end gap-3 bg-surface rounded-xl border border-border p-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustTextareaHeight(); }}
            onKeyDown={handleKeyDown}
            placeholder={isDoctorMode ? 'Ask your clinical question...' : 'Type a message...'}
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-transparent resize-none outline-none text-base text-slate-900 placeholder:text-muted leading-relaxed max-h-[120px] min-h-[24px]"
            aria-label="Message input"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0',
              input.trim() && !isStreaming
                ? 'bg-primary text-white hover:bg-primary-dark active:scale-95'
                : 'bg-border text-muted cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted mt-2 text-center">
          Enter to send · Shift+Enter for new line · AI responses may not be medically accurate
        </p>
      </div>
    </div>
  );
}
