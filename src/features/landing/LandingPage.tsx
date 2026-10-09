import React from 'react'
import { Navbar } from './Navbar'
import { HeroSection } from './HeroSection'
import { FeaturesSection } from './FeaturesSection'
import { HowItWorksSection } from './HowItWorksSection'
import { PricingSection } from './PricingSection'
import { TestimonialsSection } from './TestimonialsSection'
import { Footer } from './Footer'

interface LandingPageProps {
  onOpenDashboard: () => void
  onOpenAuth: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenDashboard,
  onOpenAuth,
}) => {
  return (
    <div className="min-h-screen dark:bg-[#070b14] bg-[#f8fafc] text-gray-900 dark:text-gray-100 flex flex-col transition-colors selection:bg-emerald-500 selection:text-black">
      <Navbar onOpenDashboard={onOpenDashboard} onOpenAuth={onOpenAuth} />
      <main className="flex-1">
        <HeroSection onOpenDashboard={onOpenDashboard} onOpenAuth={onOpenAuth} />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection onOpenAuth={onOpenAuth} />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  )
}
