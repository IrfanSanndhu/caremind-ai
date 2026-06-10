import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';

export function LandingCtaSection() {
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-sky-500 to-secondary" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white blur-3xl" />
          </div>

          <div className="relative px-8 py-14 sm:px-12 sm:py-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to transform your clinic?
            </h2>
            <p className="mt-4 text-lg text-white/85 max-w-2xl mx-auto">
              Register your HIPAA-grade clinic in minutes, or deploy CareMind in your own VPC
              with our one-command installer — PHI stays on your infrastructure.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to={isAuthenticated ? '/dashboard' : '/register'}>
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-elevated"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {isAuthenticated ? 'Open App' : 'Get started'}
                </Button>
              </Link>
              {!isAuthenticated && (
                <>
                  <Link to="/self-host">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/40 text-white hover:bg-white/10 bg-transparent"
                    >
                      Self-host guide
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/40 text-white hover:bg-white/10 bg-transparent"
                    >
                      Sign in
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
