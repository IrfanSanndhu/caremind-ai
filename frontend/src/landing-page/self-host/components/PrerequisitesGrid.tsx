import { motion } from 'framer-motion';
import { PREREQUISITES } from '../self-host-content';

export function PrerequisitesGrid() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {PREREQUISITES.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-muted mt-1">{item.description}</p>
                <ul className="mt-3 space-y-1">
                  {item.items.map((line) => (
                    <li key={line} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
