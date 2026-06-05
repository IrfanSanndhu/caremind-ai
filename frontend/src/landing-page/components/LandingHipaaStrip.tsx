import { motion } from 'framer-motion';
import { Shield, ShieldCheck } from 'lucide-react';
import { HIPAA_PILLARS } from '../landing-content';

export function LandingHipaaStrip() {
  return (
    <section
      aria-label="HIPAA compliance"
      className="relative border-y border-primary/15 bg-gradient-to-r from-primary-50 via-white to-primary-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12"
        >
          <div className="flex items-start gap-4 lg:max-w-sm flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md flex-shrink-0">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
                HIPAA-grade platform
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                Built under HIPAA rules from day one
              </h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Not bolted on later — every workflow, database boundary, and audit trail is
                designed around HIPAA Security &amp; Privacy requirements.
              </p>
              <a
                href="#security"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:underline"
              >
                <Shield className="w-4 h-4" />
                See our safeguards
              </a>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            {HIPAA_PILLARS.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="rounded-xl border border-primary/15 bg-white/80 backdrop-blur-sm p-4 shadow-card"
              >
                <p className="text-sm font-semibold text-slate-900 mb-1">{pillar.title}</p>
                <p className="text-xs text-muted leading-relaxed">{pillar.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
