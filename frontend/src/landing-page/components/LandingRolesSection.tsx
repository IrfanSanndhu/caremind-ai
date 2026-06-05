import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { ROLE_CARDS } from '../landing-content';
import { LandingSectionHeader } from './LandingSectionHeader';

export function LandingRolesSection() {
  const { isAuthenticated } = useAuthStore();

  return (
    <section id="roles" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingSectionHeader
          eyebrow="Built for every role"
          title="One platform, three purpose-built experiences"
          subtitle="Admins govern. Doctors deliver care. Patients stay informed — each with the tools they actually need."
        />

        <div className="grid md:grid-cols-3 gap-6">
          {ROLE_CARDS.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className={`rounded-2xl border p-6 lg:p-8 ${card.tint}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-card flex items-center justify-center text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                    {card.role}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{card.headline}</h3>
                <ul className="space-y-3">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link to={isAuthenticated ? '/dashboard' : '/register'}>
            <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              {isAuthenticated ? 'Open App' : 'Start your clinic'}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
