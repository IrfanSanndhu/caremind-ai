import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { DEFAULT_FORM_VALUES, type SelfHostFormValues } from './self-host-env';
import { WizardStepper } from './components/WizardStepper';
import {
  DatabaseStep,
  DomainStep,
  EmailStep,
  IntegrationsStep,
  LlmStep,
  PrereqsStep,
} from './components/WizardFormSteps';
import { WizardReview } from './components/WizardReview';

const STEP_COUNT = 7;

export function SelfHostWizard() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<SelfHostFormValues>(DEFAULT_FORM_VALUES);

  const onChange = <K extends keyof SelfHostFormValues>(key: K, value: SelfHostFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 1:
        return Boolean(values.domain && values.acmeEmail);
      case 3:
        return Boolean(values.llmApiKey && values.llmModel);
      case 4:
        return Boolean(
          values.voyageApiKey &&
            values.deepgramApiKey &&
            values.livekitUrl &&
            values.livekitApiKey &&
            values.livekitApiSecret,
        );
      case 5:
        if (!values.emailFrom) return false;
        if (values.emailProvider === 'resend') return Boolean(values.resendApiKey);
        return Boolean(values.smtpHost && values.smtpPort);
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <PrereqsStep />;
      case 1:
        return <DomainStep values={values} onChange={onChange} />;
      case 2:
        return <DatabaseStep values={values} onChange={onChange} />;
      case 3:
        return <LlmStep values={values} onChange={onChange} />;
      case 4:
        return <IntegrationsStep values={values} onChange={onChange} />;
      case 5:
        return <EmailStep values={values} onChange={onChange} />;
      case 6:
        return <WizardReview values={values} />;
      default:
        return null;
    }
  };

  return (
    <section id="setup-wizard" className="py-12 lg:py-16 bg-surface/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-white shadow-elevated p-6 sm:p-8 lg:p-10">
          <WizardStepper currentStep={step} onStepClick={setStep} />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            {step < STEP_COUNT - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canContinue()}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={() => setStep(0)} variant="outline">
                Start over
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
