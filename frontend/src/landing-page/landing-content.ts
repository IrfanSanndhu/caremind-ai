import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BrainCircuit,
  Building2,
  FileCheck,
  FileText,
  Lock,
  ScrollText,
  Shield,
  Stethoscope,
  User,
  Users,
  Video,
} from 'lucide-react';

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'For teams', href: '#roles' },
  { label: 'Security', href: '#security' },
] as const;

export const HERO_STATS = [
  { value: 'HIPAA', label: 'Grade architecture' },
  { value: '100%', label: 'Audit-logged PHI access' },
  { value: '3', label: 'Role-based portals' },
] as const;

export const HIPAA_PILLARS = [
  {
    title: 'PHI isolation',
    description: 'Dedicated tenant database per clinic — patient data never co-mingles.',
  },
  {
    title: 'Access controls',
    description: 'Role, org, and patient scope enforced server-side on every request.',
  },
  {
    title: 'Audit accountability',
    description: 'Every PHI read, export, and clinical action is logged with who and when.',
  },
  {
    title: 'Consent & minimum necessary',
    description: 'Recording starts only after patient consent; AI needs clinician approval.',
  },
] as const;

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}

export const FEATURES: FeatureItem[] = [
  {
    icon: Video,
    title: 'HD video consultations',
    description:
      'Secure LiveKit-powered visits with consent-gated recording and live transcription during every session.',
    accent: 'from-sky-500 to-primary',
  },
  {
    icon: BrainCircuit,
    title: 'AI clinical documentation',
    description:
      'Transcripts become SOAP notes and visit summaries. Clinicians review, edit, and approve before anything enters the record.',
    accent: 'from-secondary to-indigo-600',
  },
  {
    icon: FileText,
    title: 'Document intelligence',
    description:
      'Upload labs and PDFs with OCR and vector search so assistants answer from the patient’s actual chart context.',
    accent: 'from-emerald-500 to-success',
  },
  {
    icon: Building2,
    title: 'Multi-tenant by design',
    description:
      'Each organization gets an isolated database. Central control plane handles auth, billing, and org registry.',
    accent: 'from-violet-500 to-secondary',
  },
  {
    icon: Users,
    title: 'Unified scheduling',
    description:
      'Admins and doctors schedule visits; patients see upcoming appointments, consent prompts, and one-click join.',
    accent: 'from-primary to-sky-700',
  },
  {
    icon: ScrollText,
    title: 'HIPAA-aligned by design',
    description:
      'Built under HIPAA rules: audit-logged PHI access, server-side authorization, consent-gated recording, and tenant isolation.',
    accent: 'from-slate-600 to-slate-800',
  },
];

export const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Schedule & prepare',
    description:
      'Invite your care team, assign patients, and book visits. Documents upload in the background and index automatically.',
  },
  {
    step: '02',
    title: 'Consult with confidence',
    description:
      'Patients accept recording consent, then join a secure video room. Audio streams to real-time transcription.',
  },
  {
    step: '03',
    title: 'Review & approve AI notes',
    description:
      'Draft SOAP notes land in your review queue. Approve or edit — only then does content feed the knowledge base.',
  },
] as const;

export interface RoleCard {
  role: string;
  icon: LucideIcon;
  headline: string;
  bullets: string[];
  tint: string;
}

export const ROLE_CARDS: RoleCard[] = [
  {
    role: 'Administrator',
    icon: Shield,
    headline: 'Operate the clinic with full visibility',
    bullets: [
      'Org-wide analytics and appointment trends',
      'Invite doctors and patients, manage roster',
      'Audit logs for every sensitive action',
    ],
    tint: 'border-primary/20 bg-primary-50/50',
  },
  {
    role: 'Doctor',
    icon: Stethoscope,
    headline: 'Focus on patients, not paperwork',
    bullets: [
      'Patient panel, video visits, live transcript',
      'AI assistant with clinical context',
      'Approve AI-generated SOAP notes',
    ],
    tint: 'border-secondary/20 bg-secondary-50/50',
  },
  {
    role: 'Patient',
    icon: User,
    headline: 'Clear, guided care experience',
    bullets: [
      'Upcoming visits and consent before recording',
      'Upload documents and ask questions in plain language',
      'Join telehealth from any device',
    ],
    tint: 'border-success/20 bg-success-50/50',
  },
];

export const SECURITY_POINTS = [
  {
    icon: Shield,
    title: 'HIPAA-grade foundation',
    description:
      'Architecture follows HIPAA Security & Privacy Rule requirements — safeguards for PHI at every layer.',
  },
  {
    icon: Lock,
    title: 'Tenant isolation',
    description: 'Dedicated PostgreSQL per organization. PHI never mixes across clinics.',
  },
  {
    icon: FileCheck,
    title: 'Approval gate',
    description: 'AI outputs require clinician sign-off before entering approved knowledge.',
  },
  {
    icon: Activity,
    title: 'Always audited',
    description: 'Reads, exports, and clinical actions leave a tamper-evident trail.',
  },
] as const;

export const TRUST_BADGES = [
  'Built under HIPAA rules',
  'HIPAA-grade PHI handling',
  'Consent-first recording',
  'Role-based access controls',
  'Encrypted at rest',
  'Minimum necessary access',
] as const;
