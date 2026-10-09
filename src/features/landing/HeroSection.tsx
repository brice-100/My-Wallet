import React from 'react'
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  Smartphone,
  Banknote,
  Building2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface HeroSectionProps {
  onOpenDashboard: () => void
  onOpenAuth: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenDashboard, onOpenAuth }) => {
  const { t } = useTranslation()

  const operators = [
    { name: 'Wave', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', icon: Smartphone },
    { name: 'Orange Money', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: Smartphone },
    { name: 'MTN MoMo', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: Smartphone },
    { name: 'Moov Money', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Smartphone },
    { name: 'Cash (Espèces)', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: Banknote },
    { name: 'Banques Locales', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', icon: Building2 },
  ]

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Halo de lumière en arrière-plan */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge Supérieur */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-sm animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('hero.badge')}</span>
          </div>

          {/* Titre H1 percutant */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight dark:text-white text-gray-900 leading-[1.15]">
            {t('hero.titlePart1')}{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>{' '}
            {t('hero.titlePart2')}
          </h1>

          {/* Sous-titre */}
          <p className="text-base sm:text-lg dark:text-gray-300 text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={onOpenDashboard}
              type="button"
              className="w-full sm:w-auto py-3.5 px-7 rounded-2xl font-bold text-gray-950 bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 hover:from-emerald-300 hover:to-teal-200 active:scale-95 transition shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>{t('hero.ctaPrimary')}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={onOpenAuth}
              type="button"
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl font-semibold dark:text-gray-200 text-gray-800 dark:bg-gray-900/80 bg-white border dark:border-white/10 border-gray-200 hover:border-emerald-500/40 transition active:scale-95 flex items-center justify-center gap-2 text-sm cursor-pointer shadow-sm"
            >
              <span>{t('hero.ctaSecondary')}</span>
            </button>
          </div>

          {/* Badge sécurité */}
          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('hero.securityBadge')}</span>
          </div>

          {/* Opérateurs compatibles */}
          <div className="pt-6">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 mb-3">
              {t('hero.ecosystemTitle', { defaultValue: "Conçu pour l'écosystème financier africain" })}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {operators.map((op) => (
                <span
                  key={op.name}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${op.color}`}
                >
                  <op.icon className="w-3.5 h-3.5" />
                  {op.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mockup Interactive & Vivante du Dashboard */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="relative rounded-3xl p-2 sm:p-4 bg-gradient-to-b from-white/10 to-transparent dark:from-white/10 dark:to-transparent border dark:border-white/15 border-gray-200 shadow-2xl backdrop-blur-xl">
            <div className="rounded-2xl dark:bg-[#070b14] bg-gray-50 border dark:border-white/5 border-gray-200 p-4 sm:p-6 overflow-hidden">
              {/* Entête de la fausse interface */}
              <div className="flex items-center justify-between pb-4 border-b dark:border-white/10 border-gray-200 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 text-xs font-medium text-gray-400">
                    app.my-wallet.africa / dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Demo
                  </span>
                </div>
              </div>

              {/* Cartes KPIs Démo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
                {/* Solde Net */}
                <div className="card-hover-effect rounded-2xl p-4 dark:bg-gray-900/70 bg-white border dark:border-emerald-500/30 border-emerald-200 shadow-sm cursor-pointer">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{t('preview.netBalance')}</span>
                    <Wallet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold dark:text-white text-gray-900">
                    665 500 FCFA
                  </div>
                  <p className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium mt-1">
                    4 {t('hero.syncedAccounts', { defaultValue: 'comptes synchronisés' })}
                  </p>
                </div>

                {/* Reste à Vivre Quotidien */}
                <div className="card-hover-effect rounded-2xl p-4 dark:bg-gray-900/70 bg-white border dark:border-amber-500/30 border-amber-200 shadow-sm cursor-pointer">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{t('preview.dailyRest')}</span>
                    <PiggyBank className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-amber-500 dark:text-amber-400">
                    18 500 FCFA
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    23 {t('preview.daysUntilPay')}
                  </p>
                </div>

                {/* Flux Mensuels */}
                <div className="card-hover-effect rounded-2xl p-4 dark:bg-gray-900/70 bg-white border dark:border-sky-500/30 border-sky-200 shadow-sm cursor-pointer">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{t('hero.monthlyFlows', { defaultValue: 'Flux du Mois' })}</span>
                    <ArrowUpRight className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-sky-500 dark:text-sky-400">+650k</span>
                    <span className="text-xs text-gray-400">/</span>
                    <span className="text-lg font-bold text-rose-500 dark:text-rose-400">-285k</span>
                  </div>
                  <p className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium mt-1">
                    {t('hero.netSavingsRate', { defaultValue: "Taux d'épargne net" })} : 56%
                  </p>
                </div>
              </div>

              {/* Ligne Portefeuilles Réels */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="card-hover-effect p-3 rounded-xl dark:bg-gray-900/60 bg-white border dark:border-white/5 border-gray-200 cursor-pointer shadow-sm">
                  <div className="text-[11px] text-sky-500 dark:text-sky-400 font-semibold">Wave Money</div>
                  <div className="text-sm font-bold dark:text-white text-gray-900">145 000 FCFA</div>
                </div>
                <div className="card-hover-effect p-3 rounded-xl dark:bg-gray-900/60 bg-white border dark:border-white/5 border-gray-200 cursor-pointer shadow-sm">
                  <div className="text-[11px] text-orange-500 dark:text-orange-400 font-semibold">Orange Money</div>
                  <div className="text-sm font-bold dark:text-white text-gray-900">62 500 FCFA</div>
                </div>
                <div className="card-hover-effect p-3 rounded-xl dark:bg-gray-900/60 bg-white border dark:border-white/5 border-gray-200 cursor-pointer shadow-sm">
                  <div className="text-[11px] text-emerald-500 dark:text-emerald-400 font-semibold">Cash</div>
                  <div className="text-sm font-bold dark:text-white text-gray-900">38 000 FCFA</div>
                </div>
                <div className="card-hover-effect p-3 rounded-xl dark:bg-gray-900/60 bg-white border dark:border-white/5 border-gray-200 cursor-pointer shadow-sm">
                  <div className="text-[11px] text-indigo-500 dark:text-indigo-400 font-semibold">Banque Ecobank</div>
                  <div className="text-sm font-bold dark:text-white text-gray-900">420 000 FCFA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
