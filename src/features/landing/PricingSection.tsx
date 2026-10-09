import React from 'react'
import { Check, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PricingSectionProps {
  onOpenAuth: () => void
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenAuth }) => {
  const { t } = useTranslation()

  return (
    <section id="pricing" className="py-20 border-t dark:border-white/5 border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {t('pricing.tag')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight dark:text-white text-gray-900">
            {t('pricing.title')}
          </h2>
          <p className="text-sm sm:text-base dark:text-gray-400 text-gray-600">
            {t('pricing.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Plan Gratuit */}
          <div className="glass-card card-hover-effect rounded-3xl p-8 border dark:border-white/8 border-gray-200 flex flex-col justify-between cursor-pointer">
            <div>
              <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-2">
                {t('pricing.freeTitle')}
              </h3>
              <p className="text-xs dark:text-gray-400 text-gray-600 mb-6">
                {t('pricing.freeDesc')}
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold dark:text-white text-gray-900">
                  {t('pricing.freePrice')}
                </span>
                <span className="text-xs text-gray-400">{t('pricing.freePeriod')}</span>
              </div>

              <ul className="space-y-3.5 mb-8 text-sm dark:text-gray-300 text-gray-700">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{t('pricing.freeF1')}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{t('pricing.freeF2')}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{t('pricing.freeF3')}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{t('pricing.freeF4')}</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenAuth}
              type="button"
              className="w-full py-3 px-4 rounded-xl font-semibold dark:text-white text-gray-900 dark:bg-gray-800 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition active:scale-95 text-sm cursor-pointer border dark:border-white/5 border-gray-200"
            >
              {t('pricing.freeCta')}
            </button>
          </div>

          {/* Pass Premium */}
          <div className="glass-card card-hover-effect rounded-3xl p-8 border-2 border-emerald-500/50 relative flex flex-col justify-between shadow-2xl dark:bg-gradient-to-b dark:from-emerald-950/20 dark:to-transparent bg-emerald-50/40 cursor-pointer">
            <div className="absolute -top-3.5 right-8">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500 text-gray-950 shadow-md">
                <Sparkles className="w-3 h-3" />
                {t('pricing.badgePopular')}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold dark:text-white text-gray-900 mb-2">
                {t('pricing.premiumTitle')}
              </h3>
              <p className="text-xs dark:text-gray-400 text-gray-600 mb-6">
                {t('pricing.premiumDesc')}
              </p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-emerald-400">
                  {t('pricing.premiumPrice')}
                </span>
                <span className="text-xs text-gray-400">{t('pricing.premiumPeriod')}</span>
              </div>

              <ul className="space-y-3.5 mb-8 text-sm dark:text-gray-300 text-gray-700">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">{t('pricing.premiumF1')}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{t('pricing.premiumF2')}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{t('pricing.premiumF3')}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{t('pricing.premiumF4')}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{t('pricing.premiumF5')}</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenAuth}
              type="button"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 transition shadow-lg shadow-emerald-950/40 text-sm cursor-pointer"
            >
              {t('pricing.premiumCta')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
