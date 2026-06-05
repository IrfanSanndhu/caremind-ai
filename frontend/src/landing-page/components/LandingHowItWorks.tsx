import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { WORKFLOW_STEPS } from '../landing-content';
import { LandingSectionHeader } from './LandingSectionHeader';

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingSectionHeader
          eyebrow="Workflow"
          title="From schedule to signed note in three steps"
          subtitle="A consent-first pipeline that keeps clinicians in control at every stage."
        />

        <div className="grid lg:grid-cols-3 gap-8 relative">
          <div
            className="hidden lg:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            aria-hidden
          />

          {WORKFLOW_STEPS.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-lg shadow-card mb-5">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-muted leading-relaxed">{step.description}</p>
              </div>

              {index < WORKFLOW_STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-4 top-7 w-8 h-8 text-primary/30" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
