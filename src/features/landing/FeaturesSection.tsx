import React from 'react'
import {
  Layers,
  PiggyBank,
  Zap,
  Target,
  Users,
  WifiOff,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const FeaturesSection: React.FC = () => {
  const { t } = useTranslation()

  const features = [
    {
      icon: Layers,
      title: t('features.f1Title'),
      desc: t('features.f1Desc'),
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: PiggyBank,
      title: t('features.f2Title'),
      desc: t('features.f2Desc'),
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: Zap,
      title: t('features.f3Title'),
      desc: t('features.f3Desc'),
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      icon: Target,
      title: t('features.f4Title'),
      desc: t('features.f4Desc'),
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      icon: Users,
      title: t('features.f5Title'),
      desc: t('features.f5Desc'),
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      icon: WifiOff,
      title: t('features.f6Title'),
      desc: t('features.f6Desc'),
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    },
  ]

  return (
    <section id="features" className="py-20 border-t dark:border-white/5 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {t('features.tag')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight dark:text-white text-gray-900">
            {t('features.title')}
          </h2>
          <p className="text-sm sm:text-base dark:text-gray-300 text-gray-600">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card card-hover-effect rounded-2xl p-6 border dark:border-white/8 border-gray-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold dark:text-white text-gray-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm dark:text-gray-400 text-gray-600 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
