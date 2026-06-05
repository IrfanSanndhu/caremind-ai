import { LandingNavbar } from './components/LandingNavbar';
import { LandingHero } from './components/LandingHero';
import { LandingHipaaStrip } from './components/LandingHipaaStrip';
import { LandingFeatures } from './components/LandingFeatures';
import { LandingHowItWorks } from './components/LandingHowItWorks';
import { LandingRolesSection } from './components/LandingRolesSection';
import { LandingSecuritySection } from './components/LandingSecuritySection';
import { LandingCtaSection } from './components/LandingCtaSection';
import { LandingFooter } from './components/LandingFooter';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingHipaaStrip />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingRolesSection />
        <LandingSecuritySection />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
