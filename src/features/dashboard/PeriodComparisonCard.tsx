import React from 'react'
import {
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/ThemeContext'
import { formatCurrency } from '../../lib/formatters'
import type { CurrencyCode } from '../../types/database'
import type {
  ComparisonGranularity,
  GranularComparisonResult,
} from '../../kpi/comparison'

interface PeriodComparisonCardProps {
  comparison: GranularComparisonResult
  granularity: ComparisonGranularity
  onGranularityChange: (g: ComparisonGranularity) => void
  selectedYear: number
  onYearChange: (y: number) => void
  selectedMonth: number
  onMonthChange: (m: number) => void
  availableYears: number[]
  currency: CurrencyCode
}

export const PeriodComparisonCard: React.FC<PeriodComparisonCardProps> = ({
  comparison,
  granularity,
  onGranularityChange,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  availableYears,
  currency,
}) => {
  const { t, i18n } = useTranslation()
  const { theme } = useTheme()
  const isEn = i18n.language?.startsWith('en')

  const monthNames = isEn
    ? [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
    : [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ]

  const { currentPeriod, previousPeriod, diff, chartData } = comparison

  // Calcul du libellé de comparaison N-1
  const comparisonSubtitle =
    granularity === 'year'
      ? isEn
        ? `Comparing ${selectedYear} with ${selectedYear - 1}`
        : `Comparaison entre ${selectedYear} et ${selectedYear - 1}`
      : granularity === 'month'
      ? isEn
        ? `Comparing ${monthNames[selectedMonth]} ${selectedYear} with ${previousPeriod.label}`
        : `Comparaison de ${monthNames[selectedMonth]} ${selectedYear} avec ${previousPeriod.label}`
      : isEn
      ? `Comparing ${currentPeriod.label} with ${previousPeriod.label}`
      : `Comparaison de ${currentPeriod.label} avec ${previousPeriod.label}`

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border dark:border-white/10 border-gray-200 dark:bg-gray-900/40 bg-white shadow-sm space-y-5">
      {/* 1. Header IHM : Titre + Sélecteur de Granularité + Filtres Année/Mois */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b dark:border-white/5 border-gray-100 pb-4">
        {/* Titre et sous-titre */}
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold dark:text-white text-gray-900">
                {t('appComparison.title', { defaultValue: 'Analyse Comparative des Flux' })}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {comparisonSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Contrôles IHM : Boutons Granularité (Semaine / Mois / Année) + Navigation Année */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Boutons Sélecteur Granularité */}
          <div className="inline-flex rounded-xl dark:bg-gray-900 bg-gray-100 p-1 border dark:border-white/5 border-gray-200">
            {(['week', 'month', 'year'] as const).map((g) => (
              <button
                key={g}
                onClick={() => onGranularityChange(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  granularity === g
                    ? 'bg-emerald-500 text-gray-950 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {g === 'week'
                  ? t('appComparison.byWeek', { defaultValue: 'Par Semaine' })
                  : g === 'month'
                  ? t('appComparison.byMonth', { defaultValue: 'Par Mois' })
                  : t('appComparison.byYear', { defaultValue: 'Par Année' })}
              </button>
            ))}
          </div>

          {/* Navigation Année (Précédente / Suivante + Menu) */}
          <div className="flex items-center gap-1 dark:bg-gray-900 bg-gray-100 px-2 py-1 rounded-xl border dark:border-white/5 border-gray-200">
            <button
              onClick={() => onYearChange(selectedYear - 1)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition cursor-pointer"
              title={isEn ? 'Previous Year' : 'Année précédente'}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <select
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              aria-label={isEn ? 'Select Year' : 'Sélectionner l’année'}
              className="bg-transparent text-xs font-bold dark:text-white text-gray-900 outline-none cursor-pointer px-1 py-0.5"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="dark:bg-gray-900 bg-white">
                  {yr}
                </option>
              ))}
            </select>

            <button
              onClick={() => onYearChange(selectedYear + 1)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition cursor-pointer"
              title={isEn ? 'Next Year' : 'Année suivante'}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sélecteur de Mois (affiché quand granularité = week ou month) */}
          {granularity !== 'year' && (
            <div className="flex items-center gap-1 dark:bg-gray-900 bg-gray-100 px-2 py-1 rounded-xl border dark:border-white/5 border-gray-200">
              <Calendar className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                aria-label={isEn ? 'Select Month' : 'Sélectionner le mois'}
                className="bg-transparent text-xs font-semibold dark:text-white text-gray-900 outline-none cursor-pointer"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx} className="dark:bg-gray-900 bg-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. Cartes KPIs Comparatifs (Revenus N vs N-1, Dépenses N vs N-1, Épargne Nette) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* KPI Gains / Revenus */}
        <div className="rounded-xl p-3.5 border border-sky-500/20 dark:bg-sky-950/20 bg-sky-50/50 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
            <span>{t('appComparison.income', { defaultValue: 'Gains / Entrées' })}</span>
            <div className="flex items-center gap-1 text-[11px] font-bold">
              {diff.incomePercent !== null && diff.incomePercent !== 0 ? (
                diff.incomePercent > 0 ? (
                  <span className="text-emerald-500 flex items-center">
                    <ArrowUpRight className="w-3 h-3" /> +{diff.incomePercent}%
                  </span>
                ) : (
                  <span className="text-rose-500 flex items-center">
                    <ArrowDownRight className="w-3 h-3" /> {diff.incomePercent}%
                  </span>
                )
              ) : (
                <span className="text-gray-400 flex items-center">
                  <Minus className="w-3 h-3" /> 0%
                </span>
              )}
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-500 dark:text-sky-400 tracking-tight">
            +{formatCurrency(currentPeriod.income, currency)}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between pt-1 border-t dark:border-white/5 border-gray-200">
            <span>{t('appComparison.previousPeriod', { defaultValue: 'Période préc.' })} :</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              +{formatCurrency(previousPeriod.income, currency)}
            </span>
          </div>
        </div>

        {/* KPI Dépenses / Sorties */}
        <div className="rounded-xl p-3.5 border border-rose-500/20 dark:bg-rose-950/20 bg-rose-50/50 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
            <span>{t('appComparison.expense', { defaultValue: 'Dépenses / Sorties' })}</span>
            <div className="flex items-center gap-1 text-[11px] font-bold">
              {diff.expensePercent !== null && diff.expensePercent !== 0 ? (
                diff.expensePercent > 0 ? (
                  <span className="text-rose-500 flex items-center">
                    <ArrowUpRight className="w-3 h-3" /> +{diff.expensePercent}%
                  </span>
                ) : (
                  <span className="text-emerald-500 flex items-center">
                    <ArrowDownRight className="w-3 h-3" /> {diff.expensePercent}%
                  </span>
                )
              ) : (
                <span className="text-gray-400 flex items-center">
                  <Minus className="w-3 h-3" /> 0%
                </span>
              )}
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-500 dark:text-rose-400 tracking-tight">
            -{formatCurrency(currentPeriod.expense, currency)}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between pt-1 border-t dark:border-white/5 border-gray-200">
            <span>{t('appComparison.previousPeriod', { defaultValue: 'Période préc.' })} :</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              -{formatCurrency(previousPeriod.expense, currency)}
            </span>
          </div>
        </div>

        {/* KPI Épargne Nette & Taux */}
        <div className="rounded-xl p-3.5 border border-emerald-500/20 dark:bg-emerald-950/20 bg-emerald-50/50 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
            <span>{t('appComparison.netSavings', { defaultValue: 'Solde Net / Épargne' })}</span>
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <span
                className={`px-1.5 py-0.5 rounded ${
                  currentPeriod.savingsRate >= 20
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-amber-500/20 text-amber-500'
                }`}
              >
                {currentPeriod.savingsRate}% {t('appComparison.savingsRate', { defaultValue: 'épargne' })}
              </span>
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              currentPeriod.net >= 0
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-rose-500 dark:text-rose-400'
            }`}
          >
            {currentPeriod.net >= 0 ? '+' : ''}
            {formatCurrency(currentPeriod.net, currency)}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between pt-1 border-t dark:border-white/5 border-gray-200">
            <span>{t('appComparison.netDiff', { defaultValue: 'Évolution nette' })} :</span>
            <span
              className={`font-semibold ${
                diff.net >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {diff.net >= 0 ? '+' : ''}
              {formatCurrency(diff.net, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Graphique Comparatif BarChart (Revenus vs Dépenses sur les périodes) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold dark:text-gray-300 text-gray-700">
            {granularity === 'year'
              ? t('appComparison.chartYearly', { defaultValue: 'Historique pluriannuel (Entrées vs Sorties)' })
              : granularity === 'month'
              ? t('appComparison.chartMonthly', { defaultValue: `Cycle annuel ${selectedYear} (12 Mois)` })
              : t('appComparison.chartWeekly', { defaultValue: `Semaines de ${monthNames[selectedMonth]} ${selectedYear}` })}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-sky-500 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              {t('appDashboard.chartIncome', { defaultValue: 'Entrées' })}
            </span>
            <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              {t('appDashboard.chartExpense', { defaultValue: 'Sorties' })}
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme === 'dark' ? '#ffffff10' : '#00000010'}
              />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
              />
              <YAxis
                stroke="#64748b"
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`
                  return `${val}`
                }}
                tick={{ fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b' }}
              />
              <RechartsTooltip
                formatter={(val: any, name: any) => [
                  formatCurrency(Number(val), currency),
                  name === 'income'
                    ? t('appDashboard.chartIncome', { defaultValue: 'Entrées' })
                    : t('appDashboard.chartExpense', { defaultValue: 'Sorties' }),
                ]}
                labelFormatter={(label) => `${t('appDashboard.period', { defaultValue: 'Période' })} : ${label}`}
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  color: theme === 'dark' ? '#fff' : '#000',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
              />
              <Bar dataKey="income" name="income" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
