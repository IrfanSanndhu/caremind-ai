import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { WIZARD_STEPS } from '../self-host-content';

interface WizardStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function WizardStepper({ currentStep, onStepClick }: WizardStepperProps) {
  return (
    <nav aria-label="Setup progress" className="mb-8">
      <ol className="flex flex-wrap gap-2">
        {WIZARD_STEPS.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          const clickable = onStepClick && index <= currentStep;

          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(index)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  active && 'bg-primary text-white shadow-sm',
                  done && !active && 'bg-primary-50 text-primary',
                  !done && !active && 'bg-surface text-muted',
                  clickable && !active && 'hover:bg-primary-50 cursor-pointer',
                  !clickable && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    active && 'bg-white/20 text-white',
                    done && !active && 'bg-primary text-white',
                    !done && !active && 'bg-white border border-border text-muted',
                  )}
                >
                  {done && !active ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
