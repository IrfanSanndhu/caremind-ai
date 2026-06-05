import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { SECURITY_POINTS, TRUST_BADGES } from '../landing-content';
import { LandingSectionHeader } from './LandingSectionHeader';

export function LandingSecuritySection() {
  return (
    <section id="security" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900" aria-hidden />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 rounded-2xl border border-primary/30 bg-primary/10 backdrop-blur-sm p-6 sm:p-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/25 mb-4">
            <Shield className="w-6 h-6 text-primary-200" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary-200 mb-2">
            HIPAA Security &amp; Privacy Rule
          </p>
          <p className="text-xl sm:text-2xl font-bold text-white max-w-2xl mx-auto">
            Engineered for HIPAA-grade PHI protection — not retrofitted compliance
          </p>
        </motion.div>

        <LandingSectionHeader
          eyebrow="Security & compliance"
          title="Every safeguard HIPAA expects, built into the product"
          subtitle="Multi-tenant isolation, consent-first recording, server-side access controls, and audit trails on every PHI interaction."
          dark
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {SECURITY_POINTS.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary-200 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{point.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{point.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-3"
        >
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm text-slate-200"
            >
              <Shield className="w-3.5 h-3.5 text-primary-300" />
              {badge}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
