import React from 'react'
import { Wallet, Smartphone, LineChart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const HowItWorksSection: React.FC = () => {
  const { t } = useTranslation()

  const steps = [
    {
      num: '01',
      title: t('howItWorks.step1Title'),
      desc: t('howItWorks.step1Desc'),
      icon: Wallet,
    },
    {
      num: '02',
      title: t('howItWorks.step2Title'),
      desc: t('howItWorks.step2Desc'),
      icon: Smartphone,
    },
    {
      num: '03',
      title: t('howItWorks.step3Title'),
      desc: t('howItWorks.step3Desc'),
      icon: LineChart,
    },
  ]

  return (
    <section id="how-it-works" className="py-20 border-t dark:border-white/5 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {t('howItWorks.tag')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight dark:text-white text-gray-900">
            {t('howItWorks.title')}
          </h2>
          <p className="text-sm sm:text-base dark:text-gray-400 text-gray-600">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((s, idx) => (
            <div
              key={idx}
              className="glass-card card-hover-effect rounded-2xl p-6 border dark:border-white/8 border-gray-200 relative group cursor-pointer"
            >
              <div className="text-4xl font-black text-emerald-500/20 mb-4 group-hover:text-emerald-500/40 transition">
                {s.num}
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-2">
                {s.title}
              </h3>
              <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
