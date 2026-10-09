import React, { useState, useMemo } from 'react'
import {
  Plus,
  Download,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Trash2,
  RotateCcw,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDate, getWalletStyle } from '../../lib/formatters'
import type {
  Transaction,
  WalletBalanceView,
  Category,
} from '../../types/database'

interface TransactionsViewProps {
  transactions: Transaction[]
  wallets: WalletBalanceView[]
  categories: Category[]
  currency: any
  onOpenTxModal: () => void
  onDeleteTransaction: (id: string) => void
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  wallets,
  categories,
  currency,
  onOpenTxModal,
  onDeleteTransaction,
}) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [selectedWallet, setSelectedWallet] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'highest'>('recent')

  // Filtrage réactif
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Recherche textuelle
        if (search.trim()) {
          const query = search.toLowerCase()
          const noteMatch = (tx.note || '').toLowerCase().includes(query)
          const catMatch = (tx.category?.name || '').toLowerCase().includes(query)
          const walletMatch = (tx.wallet?.name || '').toLowerCase().includes(query)
          const amountMatch = tx.amount.toString().includes(query)
          if (!noteMatch && !catMatch && !walletMatch && !amountMatch) return false
        }

        // Filtre portefeuille
        if (selectedWallet !== 'all' && tx.wallet_id !== selectedWallet) {
          return false
        }

        // Filtre catégorie
        if (selectedCategory !== 'all' && tx.category_id !== selectedCategory) {
          return false
        }

        // Filtre type
        if (selectedType !== 'all') {
          if (selectedType === 'income' && tx.type !== 'income' && tx.type !== 'opening') return false
          if (selectedType === 'expense' && tx.type !== 'expense') return false
          if (selectedType === 'transfer' && tx.type !== 'transfer_in' && tx.type !== 'transfer_out') return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'recent') {
          return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
        }
        if (sortBy === 'oldest') {
          return new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
        }
        if (sortBy === 'highest') {
          return b.amount - a.amount
        }
        return 0
      })
  }, [transactions, search, selectedWallet, selectedCategory, selectedType, sortBy])

  // KPIs de la sélection filtrée
  const filterStats = useMemo(() => {
    let income = 0
    let expense = 0
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income' || tx.type === 'opening') {
        income += tx.amount
      } else if (tx.type === 'expense') {
        expense += tx.amount
      }
    })
    return {
      income,
      expense,
      net: income - expense,
      count: filteredTransactions.length,
    }
  }, [filteredTransactions])

  // Export CSV natif
  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      alert('Aucune transaction à exporter dans le filtre actuel.')
      return
    }

    const headers = ['Date', 'Type', 'Montant', 'Devise', 'Portefeuille', 'Catégorie', 'Note']
    const rows = filteredTransactions.map((t) => [
      t.occurred_at,
      t.type,
      t.amount,
      currency,
      t.wallet?.name || '',
      t.category?.name || '',
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `transactions_mywallet_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetFilters = () => {
    setSearch('')
    setSelectedWallet('all')
    setSelectedCategory('all')
    setSelectedType('all')
    setSortBy('recent')
  }

  const hasActiveFilters =
    search !== '' || selectedWallet !== 'all' || selectedCategory !== 'all' || selectedType !== 'all'

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. En-tête & Boutons d'action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 sm:p-6 rounded-2xl border dark:border-white/5 border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 font-bold">
              💸
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold dark:text-white text-gray-900 tracking-tight">
              {t('appTransactions.title')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('appTransactions.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl text-xs font-semibold dark:bg-gray-800 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-200 text-gray-800 border dark:border-white/5 border-gray-200 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('appTransactions.exportCsv')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenTxModal}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 transition shadow-lg shadow-emerald-900/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('appTransactions.newOperation')}</span>
          </button>
        </div>
      </div>

      {/* 2. Résumé de la Sélection Filtrée */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-3 sm:p-4 rounded-xl border dark:border-white/5 border-gray-200">
          <span className="text-[11px] font-semibold text-gray-400 uppercase">
            {t('appTransactions.operationsCount')}
          </span>
          <div className="text-lg sm:text-xl font-bold dark:text-white text-gray-900 mt-1">
            {filterStats.count} <span className="text-xs font-normal text-gray-400">/ {transactions.length}</span>
          </div>
        </div>

        <div className="glass-card p-3 sm:p-4 rounded-xl border border-sky-500/20 bg-sky-500/5">
          <span className="text-[11px] font-semibold text-sky-400 uppercase">
            {t('appTransactions.totalIncome')}
          </span>
          <div className="text-lg sm:text-xl font-bold text-sky-500 dark:text-sky-400 mt-1">
            +{formatCurrency(filterStats.income, currency)}
          </div>
        </div>

        <div className="glass-card p-3 sm:p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
          <span className="text-[11px] font-semibold text-rose-400 uppercase">
            {t('appTransactions.totalExpenses')}
          </span>
          <div className="text-lg sm:text-xl font-bold text-rose-500 dark:text-rose-400 mt-1">
            -{formatCurrency(filterStats.expense, currency)}
          </div>
        </div>

        <div className="glass-card p-3 sm:p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase">
            {t('appTransactions.netBalance')}
          </span>
          <div
            className={`text-lg sm:text-xl font-bold mt-1 ${
              filterStats.net >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500'
            }`}
          >
            {filterStats.net >= 0 ? '+' : ''}
            {formatCurrency(filterStats.net, currency)}
          </div>
        </div>
      </div>

      {/* 3. Barre d'outils et Filtres Avancés */}
      <div className="glass-card p-4 rounded-2xl border dark:border-white/5 border-gray-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Recherche */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder={t('appTransactions.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl dark:bg-gray-900/80 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filtre Portefeuille */}
          <div>
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900/80 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{t('appTransactions.allWallets')}</option>
              {wallets.map((w) => (
                <option key={w.wallet_id} value={w.wallet_id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Catégorie */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900/80 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{t('appTransactions.allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Type */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl dark:bg-gray-900/80 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{t('appTransactions.allTypes')}</option>
              <option value="income">{t('appTransactions.incomeOnly')}</option>
              <option value="expense">{t('appTransactions.expenseOnly')}</option>
              <option value="transfer">{t('appTransactions.transferOnly')}</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t dark:border-white/5 border-gray-200 text-xs">
            <span className="text-gray-400">
              {filterStats.count} {t('appTransactions.operationsCount').toLowerCase()}
            </span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-emerald-500 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('appTransactions.resetFilters')}</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Liste / Tableau des Transactions */}
      <div className="glass-card rounded-2xl border dark:border-white/5 border-gray-200 overflow-hidden shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold dark:text-white text-gray-900">
              {t('appTransactions.noResults')}
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {hasActiveFilters
                ? t('appTransactions.noResultsHint')
                : t('appTransactions.noResultsEmpty')}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition cursor-pointer"
              >
                {t('appTransactions.resetFilters')}
              </button>
            ) : (
              <button
                onClick={onOpenTxModal}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 text-gray-950 hover:bg-emerald-400 transition cursor-pointer"
              >
                + {t('appTransactions.newOperation')}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y dark:divide-white/5 divide-gray-100">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income' || tx.type === 'opening'
              const isTransfer = tx.type === 'transfer_in' || tx.type === 'transfer_out'
              const walletStyle = getWalletStyle(tx.wallet?.type || 'cash', tx.wallet?.provider)

              return (
                <div
                  key={tx.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isTransfer
                          ? 'bg-sky-500/15 text-sky-500 border border-sky-500/30'
                          : isIncome
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                      }`}
                    >
                      {isTransfer ? (
                        <ArrowLeftRight className="w-5 h-5" />
                      ) : isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold dark:text-white text-gray-900 truncate">
                          {tx.note || tx.category?.name || (isTransfer ? t('appDashboard.transferLabel', { defaultValue: 'Transfert' }) : t('appDashboard.operationLabel', { defaultValue: 'Opération' }))}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${walletStyle.bg} ${walletStyle.border} ${walletStyle.color} flex-shrink-0`}
                        >
                          {tx.wallet?.name || walletStyle.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex-wrap">
                        <span>{formatDate(tx.occurred_at)}</span>
                        {tx.category?.name && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded dark:bg-gray-800 bg-gray-100 text-[11px]">
                              {tx.category.name}
                            </span>
                          </>
                        )}
                        {tx.source && tx.source !== 'manual' && (
                          <>
                            <span>•</span>
                            <span className="text-[10px] text-emerald-500 font-medium uppercase">
                              {tx.source}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-extrabold tracking-tight ${
                          isIncome
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : isTransfer
                            ? 'text-sky-500 dark:text-sky-400'
                            : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase font-medium">
                        {isIncome ? t('modals.tx.income', { defaultValue: 'Revenu' }) : isTransfer ? t('modals.tx.transfer', { defaultValue: 'Transfert' }) : t('modals.tx.expense', { defaultValue: 'Dépense' })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(tx.id)}
                      title={t('common.delete')}
                      className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-2 rounded-xl text-rose-500 sm:text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
