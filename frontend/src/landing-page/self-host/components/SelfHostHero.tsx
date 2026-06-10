import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Cloud, Server } from 'lucide-react';
import { Button } from '@/components/ui';

export function SelfHostHero() {
  return (
    <section className="relative pt-28 pb-12 overflow-hidden">
      <div className="absolute inset-0 landing-hero-bg" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Server className="w-4 h-4" />
            Self-hosted in your VPC
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Run CareMind on
            <span className="block bg-gradient-to-r from-primary via-sky-500 to-secondary bg-clip-text text-transparent">
              your own infrastructure.
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            Multi-tenant healthcare platform with isolated databases per organization.
            One curl command — pulls <strong>divescale/caremind-*</strong> images from Docker Hub.
            No source code on your server. MinIO, TLS, and reverse proxy included.
          </p>
          <div className="mt-8">
            <a href="#setup-wizard">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Open setup planner
              </Button>
            </a>
            <Link to="/" className="ml-3 inline-block mt-3 sm:mt-0">
              <Button size="lg" variant="outline">
                Back to home
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border shadow-sm">
              <Cloud className="w-4 h-4 text-primary" />
              Docker Compose stack
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border shadow-sm">
              Automatic HTTPS via Caddy
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border shadow-sm">
              Bundled MinIO storage
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
