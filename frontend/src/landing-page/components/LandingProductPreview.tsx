import { motion } from 'framer-motion';
import {
  Activity,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Video,
} from 'lucide-react';

export function LandingProductPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="relative w-full max-w-xl mx-auto lg:mx-0 py-5 px-3 sm:px-4"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent rounded-3xl blur-2xl" />

      <div className="relative rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-elevated overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-slate-50/80">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-danger/80" />
            <span className="w-3 h-3 rounded-full bg-warning/80" />
            <span className="w-3 h-3 rounded-full bg-success/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-border text-xs text-muted">
              <Activity className="w-3 h-3 text-primary" />
              app.caremind.ai
            </div>
          </div>
        </div>

        <div className="flex min-h-[340px]">
          <aside className="hidden sm:flex flex-col w-14 bg-white border-r border-border/60 py-4 gap-3 items-center">
            {[Calendar, Video, FileText, BrainCircuit].map((Icon, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  i === 1 ? 'bg-primary-50 text-primary' : 'text-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            ))}
          </aside>

          <div className="flex-1 p-4 sm:p-5 space-y-4 bg-gradient-to-b from-surface to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">Today&apos;s schedule</p>
                <p className="text-sm font-semibold text-slate-900">Dr. Sarah Chen</p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success-50 text-success-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Live
              </span>
            </div>

            <div className="rounded-xl border border-border bg-white p-3 shadow-card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-semibold text-sm">
                  JP
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">James Parker</p>
                  <p className="text-xs text-muted">Follow-up · 10:30 AM</p>
                </div>
                <Video className="w-4 h-4 text-primary flex-shrink-0" />
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-secondary" />
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary-50/40 p-3">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-primary">AI SOAP Note — Draft</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                Subjective: Patient reports improved sleep and reduced anxiety since last visit.
                Objective: Vitals stable. Assessment: GAD responding to current plan...
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-xs text-success-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready for review
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 sm:right-1 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white shadow-elevated text-xs font-semibold z-10"
      >
        <ShieldCheck className="w-4 h-4" />
        HIPAA-grade
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute bottom-0 left-0 sm:left-1 px-4 py-3 rounded-xl bg-white border border-border shadow-elevated z-10"
      >
        <p className="text-xs text-muted">Pending AI reviews</p>
        <p className="text-2xl font-bold text-slate-900">3</p>
      </motion.div>
    </motion.div>
  );
}
