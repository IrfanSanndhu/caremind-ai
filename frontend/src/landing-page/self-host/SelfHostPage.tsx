import { LandingNavbar } from '../components/LandingNavbar';
import { LandingFooter } from '../components/LandingFooter';
import { SelfHostHero } from './components/SelfHostHero';
import { SelfHostWizard } from './SelfHostWizard';

export function SelfHostPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <main>
        <SelfHostHero />
        <SelfHostWizard />
      </main>
      <LandingFooter />
    </div>
  );
}
