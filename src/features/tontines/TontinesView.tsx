import React, { useState, useMemo } from 'react'
import {
  Users,
  HandCoins,
  Plus,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Check,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDate } from '../../lib/formatters'
import { tontinesAndDebtsApi } from '../../data/tontinesAndDebts'
import type { Tontine, Debt, WalletBalanceView } from '../../types/database'

interface TontinesViewProps {
  user: any
  wallets: WalletBalanceView[]
  currency: any
  onRecordTransaction?: (tx: {
    wallet_id: string
    amount: number
    type: 'expense' | 'income'
    note: string
  }) => void
}

export const TontinesView: React.FC<TontinesViewProps> = ({
  user,
  wallets,
  currency,
  onRecordTransaction,
}) => {
  const { t, i18n } = useTranslation()
  const [activeSubTab, setActiveSubTab] = useState<'tontines' | 'debts'>('tontines')
  const [tontines, setTontines] = useState<Tontine[]>(() =>
    tontinesAndDebtsApi.getTontines(user?.id || null)
  )
  const [debts, setDebts] = useState<Debt[]>(() =>
    tontinesAndDebtsApi.getDebts(user?.id || null)
  )

  React.useEffect(() => {
    setTontines(tontinesAndDebtsApi.getTontines(user?.id || null))
    setDebts(tontinesAndDebtsApi.getDebts(user?.id || null))
  }, [user?.id])

  // Modals state
  const [isTontineModalOpen, setIsTontineModalOpen] = useState(false)
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false)

  // Form states - Tontine
  const [tName, setTName] = useState('')
  const [tAmount, setTAmount] = useState('')
  const [tMembers, setTMembers] = useState('10')
  const [tFreq, setTFreq] = useState<'monthly' | 'weekly' | 'biweekly'>('monthly')
  const [tTurnMonth, setTTurnMonth] = useState('')
  const [tWalletId, setTWalletId] = useState(wallets[0]?.wallet_id || '')

  // Form states - Debt
  const [dType, setDType] = useState<'lent' | 'borrowed'>('lent')
  const [dPerson, setDPerson] = useState('')
  const [dAmount, setDAmount] = useState('')
  const [dDueDate, setDDueDate] = useState('')
  const [dNote, setDNote] = useState('')
  const [dWalletId, setDWalletId] = useState(wallets[0]?.wallet_id || '')

  // Filtre pour dettes
  const [debtFilter, setDebtFilter] = useState<'all' | 'lent' | 'borrowed'>('all')

  // Statistiques calculées
  const stats = useMemo(() => {
    const totalContributed = tontines.reduce((acc, t) => acc + t.contributed_so_far, 0)
    const totalPoolExpected = tontines.reduce((acc, t) => acc + t.total_pool, 0)

    const pendingLent = debts
      .filter((d) => d.type === 'lent' && d.status === 'pending')
      .reduce((acc, d) => acc + (d.amount - d.paid_amount), 0)

    const pendingBorrowed = debts
      .filter((d) => d.type === 'borrowed' && d.status === 'pending')
      .reduce((acc, d) => acc + (d.amount - d.paid_amount), 0)

    const netInformal = pendingLent - pendingBorrowed

    return {
      totalContributed,
      totalPoolExpected,
      pendingLent,
      pendingBorrowed,
      netInformal,
    }
  }, [tontines, debts])

  // Actions Tontine
  const handleCreateTontine = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tName.trim() || !tAmount) return

    const amount = Number(tAmount)
    const members = Number(tMembers) || 10
    const pool = amount * members

    const newT = tontinesAndDebtsApi.addTontine(user?.id || null, {
      user_id: user?.id || 'demo',
      name: tName.trim(),
      contribution_amount: amount,
      frequency: tFreq,
      members_count: members,
      my_turn_month: tTurnMonth.trim() || 'Dans 3 mois',
      total_pool: pool,
      contributed_so_far: 0,
      next_due_date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      status: 'active',
      wallet_id: tWalletId || null,
    })

    setTontines([newT, ...tontines])
    setIsTontineModalOpen(false)
    setTName('')
    setTAmount('')
    setTTurnMonth('')
  }

  const handleContribute = (tontine: Tontine) => {
    const updated = tontinesAndDebtsApi.contributeTontine(
      user?.id || null,
      tontine.id,
      tontine.contribution_amount
    )
    if (updated) {
      setTontines(tontines.map((t) => (t.id === tontine.id ? updated : t)))
      if (onRecordTransaction && tontine.wallet_id) {
        onRecordTransaction({
          wallet_id: tontine.wallet_id,
          amount: tontine.contribution_amount,
          type: 'expense',
          note: `Cotisation Tontine : ${tontine.name}`,
        })
      }
    }
  }

  const handleDeleteTontine = (id: string) => {
    if (!window.confirm(i18n.language === 'en' ? 'Delete this tontine?' : 'Supprimer cette tontine ?')) return
    tontinesAndDebtsApi.deleteTontine(user?.id || null, id)
    setTontines(tontines.filter((t) => t.id !== id))
  }

  // Actions Dettes
  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dPerson.trim() || !dAmount) return

    const newD = tontinesAndDebtsApi.addDebt(user?.id || null, {
      user_id: user?.id || 'demo',
      type: dType,
      person_name: dPerson.trim(),
      amount: Number(dAmount),
      paid_amount: 0,
      due_date: dDueDate || null,
      note: dNote.trim() || null,
      status: 'pending',
      wallet_id: dWalletId || null,
    })

    setDebts([newD, ...debts])
    setIsDebtModalOpen(false)
    setDPerson('')
    setDAmount('')
    setDDueDate('')
    setDNote('')
  }

  const handleSettleDebt = (debt: Debt) => {
    const settled = tontinesAndDebtsApi.settleDebt(user?.id || null, debt.id)
    if (settled) {
      setDebts(debts.map((d) => (d.id === debt.id ? settled : d)))
      if (onRecordTransaction && debt.wallet_id) {
        onRecordTransaction({
          wallet_id: debt.wallet_id,
          amount: debt.amount - debt.paid_amount,
          type: debt.type === 'lent' ? 'income' : 'expense',
          note:
            debt.type === 'lent'
              ? `Remboursement reçu de ${debt.person_name}`
              : `Dette payée à ${debt.person_name}`,
        })
      }
    }
  }

  const handleDeleteDebt = (id: string) => {
    tontinesAndDebtsApi.deleteDebt(user?.id || null, id)
    setDebts(debts.filter((d) => d.id !== id))
  }

  const filteredDebts = debts.filter((d) => {
    if (debtFilter === 'all') return true
    return d.type === debtFilter
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. En-tête de la Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 sm:p-6 rounded-2xl border dark:border-white/5 border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-500 dark:text-amber-400 font-bold">
              🤝
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold dark:text-white text-gray-900 tracking-tight">
              {t('appTontines.title')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('appTontines.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'tontines' ? (
            <button
              onClick={() => setIsTontineModalOpen(true)}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition shadow-lg shadow-emerald-900/30 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t('appTontines.createTontine')}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsDebtModalOpen(true)}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-gray-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition shadow-lg shadow-amber-900/30 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t('appTontines.recordDebt')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Cartes KPIs Spécifiques Tontines & Dettes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Épargne Tontines */}
        <div className="glass-card card-hover-effect p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-emerald-500 uppercase">
              {t('appTontines.contributedTotal')}
            </span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-500 dark:text-emerald-400">
            {formatCurrency(stats.totalContributed, currency)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {t('appTontines.expectedPool')} : {formatCurrency(stats.totalPoolExpected, currency)}
          </p>
        </div>

        {/* Créances ("On me doit") */}
        <div className="glass-card card-hover-effect p-4 rounded-2xl border border-sky-500/20 bg-sky-500/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-sky-500 uppercase">
              {t('appTontines.lentTotal')}
            </span>
            <ArrowUpRight className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-500 dark:text-sky-400">
            {formatCurrency(stats.pendingLent, currency)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{t('appTontines.loansToCollect')}</p>
        </div>

        {/* Dettes ("Je dois") */}
        <div className="glass-card card-hover-effect p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-rose-500 uppercase">
              {t('appTontines.borrowedTotal')}
            </span>
            <ArrowDownLeft className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-500 dark:text-rose-400">
            {formatCurrency(stats.pendingBorrowed, currency)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{t('appTontines.debtsToRepay')}</p>
        </div>

        {/* Balance Nette Informelle */}
        <div className="glass-card card-hover-effect p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-amber-500 uppercase">
              {t('appTontines.informalBalance')}
            </span>
            <HandCoins className="w-4 h-4 text-amber-500" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black ${
              stats.netInformal >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {stats.netInformal >= 0 ? '+' : ''}
            {formatCurrency(stats.netInformal, currency)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {stats.netInformal >= 0 ? t('appTontines.loansToCollect') : t('appTontines.debtsToRepay')}
          </p>
        </div>
      </div>

      {/* 3. Commutateur d'Onglets Internes */}
      <div className="flex items-center gap-2 border-b dark:border-white/10 border-gray-200 pb-3">
        <button
          onClick={() => setActiveSubTab('tontines')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'tontines'
              ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-950/20'
              : 'dark:text-gray-300 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>
            {t('appTontines.tontinesTab')} ({tontines.length})
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('debts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'debts'
              ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-950/20'
              : 'dark:text-gray-300 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <HandCoins className="w-4 h-4" />
          <span>
            {t('appTontines.debtsTab')} ({debts.length})
          </span>
        </button>
      </div>

      {/* 4. CONTENU ONGLET TONTINES */}
      {activeSubTab === 'tontines' && (
        <div className="space-y-4">
          {tontines.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-dashed dark:border-white/10 border-gray-300 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold dark:text-white text-gray-900">
                  {t('appTontines.noTontinesTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                  {t('appTontines.noTontinesDesc')}
                </p>
              </div>
              <button
                onClick={() => setIsTontineModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition active:scale-95 shadow-md shadow-emerald-950/20 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                {t('appTontines.newTontine')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tontines.map((tontine) => {
              const percent = Math.min(
                100,
                Math.round((tontine.contributed_so_far / tontine.total_pool) * 100)
              )
              return (
                <div
                  key={tontine.id}
                  className="glass-card card-hover-effect rounded-2xl p-5 border dark:border-white/5 border-gray-200 space-y-4 shadow-sm relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold dark:text-white text-gray-900">
                          {tontine.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {tontine.members_count} {t('appTontines.members')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t('appTontines.contributionUnit')}{' '}
                        <strong className="text-emerald-500">
                          {formatCurrency(tontine.contribution_amount, currency)}
                        </strong>{' '}
                        / {tontine.frequency === 'monthly' ? t('appTontines.perMonth') : t('appTontines.perWeek')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block uppercase font-medium">
                          {t('appTontines.totalPool')}
                        </span>
                        <span className="text-base font-extrabold dark:text-white text-gray-900">
                          {formatCurrency(tontine.total_pool, currency)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTontine(tontine.id)}
                        className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-2 sm:p-1.5 rounded-lg text-rose-500 sm:text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition cursor-pointer"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Mon tour de ramassage */}
                  <div className="flex items-center justify-between p-3 rounded-xl dark:bg-emerald-950/20 bg-emerald-50 border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-500 block">
                          {t('appTontines.myTurn')}
                        </span>
                        <span className="text-xs font-semibold dark:text-gray-200 text-gray-800">
                          {tontine.my_turn_month}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">
                        {t('appTontines.nextDue')}
                      </span>
                      <span className="text-xs font-medium dark:text-gray-300 text-gray-700">
                        {tontine.next_due_date}
                      </span>
                    </div>
                  </div>

                  {/* Jauge de progression */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{t('appTontines.totalContributedSoFar')}</span>
                      <span className="font-bold dark:text-white text-gray-900">
                        {formatCurrency(tontine.contributed_so_far, currency)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full dark:bg-gray-800 bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t dark:border-white/5 border-gray-100">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {t('appTontines.settled')}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleContribute(tontine)}
                      className="py-1.5 px-3 rounded-xl text-xs font-bold text-gray-950 bg-emerald-400 hover:bg-emerald-300 transition active:scale-95 shadow-sm cursor-pointer"
                    >
                      + {t('appTontines.contributeAction')}{' '}
                      {formatCurrency(tontine.contribution_amount, currency)}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </div>
      )}

      {/* 5. CONTENU ONGLET DETTES & PRÊTS */}
      {activeSubTab === 'debts' && (
        <div className="space-y-4">
          {/* Filtres internes pour dettes */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">{t('appTontines.displayFilter')}</span>
            {(['all', 'lent', 'borrowed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setDebtFilter(filter)}
                className={`py-1 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  debtFilter === filter
                    ? 'bg-amber-500 text-gray-950'
                    : 'dark:bg-gray-800 bg-gray-100 dark:text-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter === 'all'
                  ? t('appTontines.allEngagements')
                  : filter === 'lent'
                  ? t('appTontines.lentFilter')
                  : t('appTontines.borrowedFilter')}
              </button>
            ))}
          </div>

          {filteredDebts.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 sm:p-8 border border-dashed dark:border-white/10 border-gray-300 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500 dark:text-sky-400">
                <HandCoins className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold dark:text-white text-gray-900">
                  {t('appTontines.noDebtsTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                  {t('appTontines.noDebtsDesc')}
                </p>
              </div>
              <button
                onClick={() => setIsDebtModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-sky-500 hover:bg-sky-400 text-white transition active:scale-95 shadow-md shadow-sky-950/20 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                {t('appTontines.recordDebt')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDebts.map((d) => {
              const isLent = d.type === 'lent'
              const isSettled = d.status === 'settled'

              return (
                <div
                  key={d.id}
                  className={`glass-card rounded-2xl p-4 sm:p-5 border space-y-3 shadow-sm transition ${
                    isSettled
                      ? 'border-gray-500/20 opacity-75'
                      : isLent
                      ? 'border-sky-500/20 bg-sky-500/5'
                      : 'border-rose-500/20 bg-rose-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSettled
                            ? 'bg-gray-500/20 text-gray-400'
                            : isLent
                            ? 'bg-sky-500/20 text-sky-500'
                            : 'bg-rose-500/20 text-rose-500'
                        }`}
                      >
                        {isSettled ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : isLent ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold dark:text-white text-gray-900">
                            {d.person_name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isSettled
                                ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                : isLent
                                ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {isSettled
                              ? t('appTontines.settled')
                              : isLent
                              ? t('appTontines.lentTotal')
                              : t('appTontines.borrowedTotal')}
                          </span>
                        </div>
                        {d.note && (
                          <p className="text-xs text-gray-400 mt-0.5 italic">"{d.note}"</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-base font-extrabold ${
                          isSettled
                            ? 'text-gray-400 line-through'
                            : isLent
                            ? 'text-sky-500 dark:text-sky-400'
                            : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {isLent ? '+' : '-'}
                        {formatCurrency(d.amount, currency)}
                      </div>
                      {d.due_date && (
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {t('appTontines.dueDate')} : {d.due_date}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t dark:border-white/5 border-gray-100 text-xs">
                    <span className="text-[11px] text-gray-400">
                      {formatDate(d.created_at)}
                    </span>

                    <div className="flex items-center gap-2">
                      {!isSettled && (
                        <button
                          type="button"
                          onClick={() => handleSettleDebt(d)}
                          className="py-1 px-3 rounded-lg text-xs font-bold text-gray-950 bg-emerald-400 hover:bg-emerald-300 transition cursor-pointer"
                        >
                          {isLent ? t('appTontines.settleReceived') : t('appTontines.settlePaid')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteDebt(d.id)}
                        className="text-gray-400 hover:text-rose-500 p-2 sm:p-1 rounded-lg hover:bg-rose-500/10 active:scale-90 transition cursor-pointer"
                        title={t('common.delete')}
                      >
                        <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </div>
      )}

      {/* MODAL CRÉATION TONTINE */}
      {isTontineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl glass-card p-5 sm:p-6 shadow-2xl border dark:border-white/10 border-gray-200">
            <button
              onClick={() => setIsTontineModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold dark:text-white text-gray-900 mb-1">
              {t('appTontines.createTontine')}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              {t('appTontines.tontineModalSubtitle')}
            </p>

            <form onSubmit={handleCreateTontine} className="space-y-3">
              <div>
                <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                  {t('appTontines.tontineName')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('appTontines.tontineNamePlaceholder')}
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                    {t('appTontines.contributionAmount')}
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="ex: 50000"
                    value={tAmount}
                    onChange={(e) => setTAmount(e.target.value)}
                    className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                    {t('appTontines.membersCount')}
                  </label>
                  <input
                    type="number"
                    required
                    min="2"
                    max="50"
                    value={tMembers}
                    onChange={(e) => setTMembers(e.target.value)}
                    className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                    {t('appTontines.frequency')}
                  </label>
                  <select
                    value={tFreq}
                    onChange={(e) => setTFreq(e.target.value as any)}
                    className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
                  >
                    <option value="monthly">{t('appTontines.freqMonthly')}</option>
                    <option value="biweekly">{t('appTontines.freqBiweekly')}</option>
                    <option value="weekly">{t('appTontines.freqWeekly')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                    {t('appTontines.myTurnMonth')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('appTontines.myTurnMonthPlaceholder')}
                    value={tTurnMonth}
                    onChange={(e) => setTTurnMonth(e.target.value)}
                    className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                  {t('appTontines.associatedWallet')}
                </label>
                <select
                  value={tWalletId}
                  onChange={(e) => setTWalletId(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
                >
                  {wallets.map((w) => (
                    <option key={w.wallet_id} value={w.wallet_id}>
                      {w.name} ({w.type})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl font-bold text-xs text-gray-950 bg-emerald-400 hover:bg-emerald-300 transition cursor-pointer"
              >
                {t('appTontines.saveTontine')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJOUT PRÊT / DETTE */}
      {isDebtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl glass-card p-5 sm:p-6 shadow-2xl border dark:border-white/10 border-gray-200">
            <button
              onClick={() => setIsDebtModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold dark:text-white text-gray-900 mb-1">
              {t('appTontines.recordDebt')}
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              {t('appTontines.debtModalSubtitle')}
            </p>

            <form onSubmit={handleCreateDebt} className="space-y-3">
              {/* Type */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDType('lent')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    dType === 'lent'
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500'
                      : 'border-gray-700 text-gray-400'
                  }`}
                >
                  {t('appTontines.lentFilter')}
                </button>
                <button
                  type="button"
                  onClick={() => setDType('borrowed')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    dType === 'borrowed'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500'
                      : 'border-gray-700 text-gray-400'
                  }`}
                >
                  {t('appTontines.borrowedFilter')}
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                  {t('appTontines.contactName')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('appTontines.contactPlaceholder')}
                  value={dPerson}
                  onChange={(e) => setDPerson(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                    {t('appTontines.amountLabel')}
                  </label>
                  <input
                    type="number"
                    required
                    min="500"
                    placeholder="ex: 20000"
                    value={dAmount}
                    onChange={(e) => setDAmount(e.target.value)}
                    className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                    {t('appTontines.dueDateLabel')}
                  </label>
                  <input
                    type="date"
                    value={dDueDate}
                    onChange={(e) => setDDueDate(e.target.value)}
                    className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                  {t('appTontines.debtNote')}
                </label>
                <input
                  type="text"
                  placeholder={t('appTontines.debtNotePlaceholder')}
                  value={dNote}
                  onChange={(e) => setDNote(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                  {t('appTontines.associatedWalletDebt')}
                </label>
                <select
                  value={dWalletId}
                  onChange={(e) => setDWalletId(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
                >
                  {wallets.map((w) => (
                    <option key={w.wallet_id} value={w.wallet_id}>
                      {w.name} ({w.type})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-2.5 rounded-xl font-bold text-xs text-gray-950 bg-amber-400 hover:bg-amber-300 transition cursor-pointer"
              >
                {t('appTontines.saveDebt')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
