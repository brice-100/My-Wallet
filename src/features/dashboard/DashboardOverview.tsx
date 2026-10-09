import React from 'react'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  PiggyBank,
  Plus,
  Layers,
  ArrowRight,
  Trash2,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDate, getWalletStyle } from '../../lib/formatters'
import { useTheme } from '../../context/ThemeContext'
import type {
  Category,
  Profile,
  Transaction,
  WalletBalanceView,
  BudgetProgressView,
  MonthlyFlowView,
} from '../../types/database'

import { PeriodComparisonCard } from './PeriodComparisonCard'
import type {
  ComparisonGranularity,
  GranularComparisonResult,
} from '../../kpi/comparison'

const PIE_COLORS = [
  '#10B981', // Émeraude
  '#06B6D4', // Cyan
  '#F59E0B', // Ambre
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#3B82F6', // Bleu
  '#F97316', // Orange
  '#14B8A6', // Teal
]

interface DashboardOverviewProps {
  profile: Profile | null
  wallets: WalletBalanceView[]
  transactions: Transaction[]
  categories: Category[]
  budgetProgress: BudgetProgressView[]
  monthlyFlows: MonthlyFlowView[]
  totalBalance: number
  flows: { income: number; expense: number; net: number; savingsRate: number }
  dailyRemaining: { dailyRemaining: number; daysRemaining: number }
  spendingCategories: Array<{ categoryId: string; name: string; total: number; percentage: number }>
  currency: any
  // Props de comparaison temporelle granulaire (semaine / mois / année)
  comparison: GranularComparisonResult
  comparisonGranularity: ComparisonGranularity
  onComparisonGranularityChange: (g: ComparisonGranularity) => void
  selectedYear: number
  onYearChange: (y: number) => void
  selectedMonth: number
  onMonthChange: (m: number) => void
  availableYears: number[]
  onOpenWalletModal: () => void
  onDeleteWallet?: (walletId: string) => void
  onOpenBudgetModal: () => void
  onNavigateToTab: (tab: 'transactions' | 'tontines' | 'settings') => void
  onDeleteTransaction: (id: string) => void
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  profile,
  wallets,
  transactions,
  budgetProgress,
  monthlyFlows,
  totalBalance,
  flows,
  dailyRemaining,
  spendingCategories,
  currency,
  comparison,
  comparisonGranularity,
  onComparisonGranularityChange,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  availableYears,
  onOpenWalletModal,
  onDeleteWallet,
  onOpenBudgetModal,
  onNavigateToTab,
  onDeleteTransaction,
}) => {
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Cartes KPIs Principales */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Solde Global */}
        <div className="glass-card card-hover-effect rounded-2xl p-4 sm:p-5 border border-emerald-500/20 dark:bg-gradient-to-b dark:from-emerald-950/20 dark:to-transparent bg-emerald-50/60 cursor-pointer shadow-sm">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('appDashboard.consolidatedBalance')}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold dark:text-white text-gray-900 tracking-tight">
            {formatCurrency(totalBalance, currency)}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{wallets.length}</span> {t('appDashboard.accountsCount')}
          </p>
        </div>

        {/* Reste à Vivre Quotidien */}
        <div className="glass-card card-hover-effect rounded-2xl p-4 sm:p-5 border border-amber-500/20 dark:bg-gradient-to-b dark:from-amber-950/20 dark:to-transparent bg-amber-50/60 cursor-pointer shadow-sm">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('appDashboard.dailyRemaining')}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 dark:text-amber-400 tracking-tight">
            {formatCurrency(dailyRemaining.dailyRemaining, currency)}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
            <span>{dailyRemaining.daysRemaining} {t('appDashboard.daysRemaining')}</span>
            <span className="text-amber-500 font-medium">(J-{profile?.pay_day || 1})</span>
          </p>
        </div>

        {/* Entrées / Gains */}
        <div className="glass-card card-hover-effect rounded-2xl p-4 sm:p-5 border border-sky-500/20 dark:bg-gradient-to-b dark:from-sky-950/20 dark:to-transparent bg-sky-50/60 cursor-pointer shadow-sm">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('appDashboard.monthlyIncome')}
            </span>
            <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-500 dark:text-sky-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-500 dark:text-sky-400 tracking-tight">
            +{formatCurrency(flows.income, currency)}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {t('appDashboard.incomeSubtitle')}
          </p>
        </div>

        {/* Dépenses / Sorties */}
        <div className="glass-card card-hover-effect rounded-2xl p-4 sm:p-5 border border-rose-500/20 dark:bg-gradient-to-b dark:from-rose-950/20 dark:to-transparent bg-rose-50/60 cursor-pointer shadow-sm">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('appDashboard.monthlyExpenses')}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-500 dark:text-rose-400 tracking-tight">
            -{formatCurrency(flows.expense, currency)}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>{t('appDashboard.savingsRate')} :</span>
            <span
              className={`font-semibold ${
                flows.savingsRate >= 20 ? 'text-emerald-500' : 'text-amber-500'
              }`}
            >
              {flows.savingsRate}%
            </span>
          </div>
        </div>
      </section>

      {/* 2. Section Portefeuilles Dédiés (CRUD: Création + Suppression) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider dark:text-gray-300 text-gray-700">
              {t('appDashboard.dedicatedWallets')}
            </h2>
          </div>
          <button
            onClick={onOpenWalletModal}
            className="text-xs text-emerald-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('appDashboard.addAccount')}
          </button>
        </div>

        {wallets.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-dashed dark:border-white/10 border-gray-300 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold dark:text-white text-gray-900">
                {t('appDashboard.noWalletsTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                {t('appDashboard.noWalletsDesc')}
              </p>
            </div>
            <button
              onClick={onOpenWalletModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition active:scale-95 shadow-md shadow-emerald-950/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              {t('appDashboard.addAccount')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {wallets.map((w) => {
              const style = getWalletStyle(w.type, w.provider)
              return (
                <div
                  key={w.wallet_id}
                  className="glass-card card-hover-effect rounded-2xl p-4 border dark:border-white/5 border-gray-200 cursor-pointer relative overflow-hidden group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate pr-2">
                      {w.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.color}`}
                      >
                        {style.label}
                      </span>
                      {onDeleteWallet && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteWallet(w.wallet_id)
                          }}
                          title={t('common.delete')}
                          className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 sm:p-1 rounded-lg text-rose-500 sm:text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xl font-bold dark:text-white text-gray-900 tracking-tight">
                    {formatCurrency(w.balance, currency)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 2bis. Analyse Comparative des Flux (Semaine / Mois / Année) */}
      <section>
        <PeriodComparisonCard
          comparison={comparison}
          granularity={comparisonGranularity}
          onGranularityChange={onComparisonGranularityChange}
          selectedYear={selectedYear}
          onYearChange={onYearChange}
          selectedMonth={selectedMonth}
          onMonthChange={onMonthChange}
          availableYears={availableYears}
          currency={currency}
        />
      </section>

      {/* 3. Graphiques : Donut des Dépenses & Histogramme Mensuel */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Donut Répartition */}
        <div className="glass-card card-hover-effect rounded-2xl p-4 sm:p-5 border dark:border-white/5 border-gray-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold dark:text-white text-gray-900">{t('appDashboard.spendingBreakdown')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('appDashboard.spendingBreakdownSubtitle', { defaultValue: 'Postes de coût sur le mois' })}</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg dark:bg-gray-900 bg-gray-100 border dark:border-white/5 border-gray-200 dark:text-gray-300 text-gray-700">
              {t('appDashboard.donutCategories', { defaultValue: 'Donut Catégories' })}
            </span>
          </div>

          {spendingCategories.length === 0 ? (
            <div className="h-56 sm:h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
              {t('appDashboard.noExpenses', { defaultValue: 'Aucune dépense enregistrée sur cette période' })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="total"
                    >
                      {spendingCategories.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: any) => [formatCurrency(Number(value), currency), t('appTontines.amount', { defaultValue: 'Montant' })]}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        borderRadius: '12px',
                        color: theme === 'dark' ? '#fff' : '#000',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Légende */}
              <div className="space-y-2 text-xs">
                {spendingCategories.slice(0, 5).map((cat, i) => (
                  <div key={cat.categoryId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="dark:text-gray-300 text-gray-700 truncate">{cat.name}</span>
                    </div>
                    <span className="font-semibold dark:text-white text-gray-900 ml-2">
                      {formatCurrency(cat.total, currency)} ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Histogramme Revenus vs Dépenses */}
        <div className="glass-card card-hover-effect rounded-2xl p-4 sm:p-5 border dark:border-white/5 border-gray-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold dark:text-white text-gray-900">{t('appDashboard.monthlyFlows')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('appDashboard.monthlyFlowsSubtitle', { defaultValue: "Évolution de la capacité d'épargne" })}</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-sky-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> {t('appDashboard.chartIncome', { defaultValue: 'Entrées' })}
              </span>
              <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> {t('appDashboard.chartExpense', { defaultValue: 'Sorties' })}
              </span>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFlows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#ffffff10' : '#00000010'} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(val) => {
                    try {
                      const d = new Date(val)
                      return d.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR', { month: 'short' })
                    } catch {
                      return val
                    }
                  }}
                  stroke="#64748b"
                  fontSize={11}
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <RechartsTooltip
                  formatter={(val: any) => [formatCurrency(Number(val), currency), '']}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    color: theme === 'dark' ? '#fff' : '#000',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }}
                />
                <Bar dataKey="income" fill="#38bdf8" radius={[6, 6, 0, 0]} name={t('appDashboard.chartIncome', { defaultValue: 'Revenus' })} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} name={t('appDashboard.chartExpense', { defaultValue: 'Dépenses' })} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 4. Enveloppes Budgétaires */}
      <section className="glass-card rounded-2xl p-4 sm:p-5 border dark:border-white/5 border-gray-200 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold dark:text-white text-gray-900">{t('appDashboard.budgetEnvelopes')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('appDashboard.budgetEnvelopesSubtitle', { defaultValue: 'Plafonds de dépenses (Vert < 75%, Orange 75-100%, Rouge > 100%)' })}
            </p>
          </div>
          <button
            onClick={onOpenBudgetModal}
            className="text-xs text-emerald-500 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('appDashboard.adjustBudgets')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {budgetProgress.map((b) => {
            const isOver = b.percent_used > 100
            const isWarning = b.percent_used >= 75 && b.percent_used <= 100
            const barColor = isOver
              ? 'bg-rose-500'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-emerald-500'

            return (
              <div
                key={b.budget_id}
                className="card-hover-effect dark:bg-gray-900/60 bg-gray-50 p-4 rounded-xl border dark:border-white/5 border-gray-200 space-y-2.5 cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold dark:text-white text-gray-900">{b.category_name}</span>
                  <span
                    className={`font-bold ${
                      isOver
                        ? 'text-rose-500'
                        : isWarning
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                    }`}
                  >
                    {b.percent_used}%
                  </span>
                </div>

                <div className="w-full h-2 rounded-full dark:bg-gray-800 bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, b.percent_used)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{t('appDashboard.spent', { defaultValue: 'Dépensé' })} : {formatCurrency(b.spent, currency)}</span>
                  <span>{t('appDashboard.limit', { defaultValue: 'Plafond' })} : {formatCurrency(b.budget_amount, currency)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. Aperçu des Dernières Transactions */}
      <section className="glass-card rounded-2xl p-4 sm:p-5 border dark:border-white/5 border-gray-200 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold dark:text-white text-gray-900">{t('appDashboard.recentTransactions')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('appDashboard.recentTransactionsSubtitle', { defaultValue: 'Aperçu direct des opérations les plus récentes' })}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('transactions')}
            className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer transition"
          >
            <span>{t('appDashboard.viewAllHistory')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y dark:divide-white/5 divide-gray-100">
          {transactions.slice(0, 5).map((tx) => {
            const isIncome = tx.type === 'income' || tx.type === 'opening'
            const isTransfer = tx.type === 'transfer_in' || tx.type === 'transfer_out'
            const walletStyle = getWalletStyle(tx.wallet?.type || 'cash', tx.wallet?.provider)

            return (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3 group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isTransfer
                        ? 'bg-sky-500/15 text-sky-500 border border-sky-500/30'
                        : isIncome
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                    }`}
                  >
                    {isTransfer ? (
                      <ArrowLeftRight className="w-4 h-4" />
                    ) : isIncome ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-xs font-semibold dark:text-white text-gray-900 truncate">
                        {tx.note || tx.category?.name || (isTransfer ? t('appDashboard.transferLabel', { defaultValue: 'Transfert' }) : t('appDashboard.operationLabel', { defaultValue: 'Opération' }))}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${walletStyle.bg} ${walletStyle.border} ${walletStyle.color} flex-shrink-0`}
                      >
                        {tx.wallet?.name || walletStyle.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      <span>{formatDate(tx.occurred_at)}</span>
                      {tx.category?.name && (
                        <>
                          <span>•</span>
                          <span>{tx.category.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span
                    className={`text-xs sm:text-sm font-bold tracking-tight ${
                      isIncome ? 'text-emerald-500' : isTransfer ? 'text-sky-500' : 'text-rose-500'
                    }`}
                  >
                    {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </span>
                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    title={t('common.delete')}
                    className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-2 sm:p-1.5 rounded-lg text-rose-500 sm:text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
