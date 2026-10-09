import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { transactionsApi } from '../../data/transactions'
import { offlineStorage } from '../../lib/offlineStorage'
import { useNetwork } from '../../context/NetworkContext'
import type { Category, TransactionType, WalletBalanceView } from '../../types/database'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, X, Loader2 } from 'lucide-react'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  wallets: WalletBalanceView[]
  categories: Category[]
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  wallets,
  categories,
}) => {
  const { t } = useTranslation()
  const { isOnline } = useNetwork()
  const [mode, setMode] = useState<'expense' | 'income' | 'transfer'>('expense')
  const [walletId, setWalletId] = useState(wallets[0]?.wallet_id || '')
  const [targetWalletId, setTargetWalletId] = useState(wallets[1]?.wallet_id || wallets[0]?.wallet_id || '')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  React.useEffect(() => {
    if (wallets.length > 0) {
      if (!walletId || !wallets.some((w) => w.wallet_id === walletId)) {
        setWalletId(wallets[0].wallet_id)
      }
      if (!targetWalletId || !wallets.some((w) => w.wallet_id === targetWalletId)) {
        setTargetWalletId(wallets[1]?.wallet_id || wallets[0].wallet_id)
      }
    }
  }, [wallets, walletId, targetWalletId])

  if (!isOpen) return null

  const filteredCategories = categories.filter((c) =>
    mode === 'expense' ? c.type === 'expense' : c.type === 'income'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg(t('modals.tx.validAmount', { defaultValue: 'Veuillez renseigner un montant valide supérieur à 0.' }))
      setLoading(false)
      return
    }

    try {
      if (!isOnline) {
        // Enregistrement offline immédiat dans la file d'attente locale
        await offlineStorage.enqueueAction('CREATE_TRANSACTION', {
          id: `local_tx_${Date.now()}`,
          wallet_id: walletId,
          walletId,
          category_id: categoryId || null,
          categoryId: categoryId || undefined,
          amount: parsedAmount,
          type: mode as TransactionType,
          occurred_at: new Date().toISOString(),
          note: note.trim() || undefined,
        })
      } else {
        if (mode === 'transfer') {
          if (!walletId || !targetWalletId) {
            throw new Error(t('modals.tx.selectWallets', { defaultValue: 'Veuillez sélectionner les portefeuilles source et cible.' }))
          }
          if (walletId === targetWalletId) {
            throw new Error(t('modals.tx.distinctWallets', { defaultValue: 'Le portefeuille de destination doit être différent du portefeuille source.' }))
          }
          await transactionsApi.createTransfer({
            fromWalletId: walletId,
            toWalletId: targetWalletId,
            amount: parsedAmount,
            note: note.trim() || undefined,
          })
        } else {
          if (!walletId) {
            throw new Error(t('modals.tx.selectOneWallet', { defaultValue: 'Veuillez sélectionner un portefeuille.' }))
          }
          try {
            await transactionsApi.create({
              walletId,
              categoryId: categoryId || undefined,
              amount: parsedAmount,
              type: mode as TransactionType,
              note: note.trim() || undefined,
            })
          } catch (apiErr) {
            // Si l'appel réseau échoue (coupure soudaine), basculer en sauvegarde locale
            console.warn('[TransactionModal] Réseau indisponible, mise en file d attente offline:', apiErr)
            await offlineStorage.enqueueAction('CREATE_TRANSACTION', {
              id: `local_tx_${Date.now()}`,
              wallet_id: walletId,
              walletId,
              category_id: categoryId || null,
              categoryId: categoryId || undefined,
              amount: parsedAmount,
              type: mode as TransactionType,
              occurred_at: new Date().toISOString(),
              note: note.trim() || undefined,
            })
          }
        }
      }

      onSuccess()
      onClose()
      setAmount('')
      setNote('')
    } catch (err: any) {
      setErrorMsg(err.message || t('common.errorOccurred', { defaultValue: "Erreur lors de l'enregistrement de l'opération" }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl glass-card p-5 sm:p-6 shadow-2xl border dark:border-white/10 border-gray-200">
        <button
          onClick={onClose}
          type="button"
          aria-label={t('common.close', { defaultValue: 'Fermer' })}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold dark:text-white text-gray-900 mb-1">{t('modals.tx.title', { defaultValue: 'Nouvelle Transaction' })}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
          {t('modals.tx.subtitle', { defaultValue: 'Saisie en 2 clics avec catégorisation instantanée.' })}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs sm:text-sm">
            {errorMsg}
          </div>
        )}

        {/* Sélecteur de type d'opération */}
        <div className="grid grid-cols-3 gap-2 p-1 dark:bg-gray-900/60 bg-gray-100 rounded-xl mb-5 border dark:border-white/5 border-gray-200">
          <button
            type="button"
            onClick={() => setMode('expense')}
            className={`py-2 px-1 sm:px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'expense'
                ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            {t('modals.tx.expense', { defaultValue: 'Dépense' })}
          </button>
          <button
            type="button"
            onClick={() => setMode('income')}
            className={`py-2 px-1 sm:px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'income'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            {t('modals.tx.income', { defaultValue: 'Revenu' })}
          </button>
          <button
            type="button"
            onClick={() => setMode('transfer')}
            className={`py-2 px-1 sm:px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mode === 'transfer'
                ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {t('modals.tx.transfer', { defaultValue: 'Transfert' })}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.tx.amount', { defaultValue: 'Montant' })}
            </label>
            <input
              type="number"
              required
              min="1"
              placeholder="Ex: 5000"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-2xl font-extrabold py-2.5 px-4 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Transfert: Source & Cible */}
          {mode === 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                  {t('modals.tx.sourceWallet', { defaultValue: 'Depuis le compte' })}
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-sky-500"
                >
                  {wallets.map((w) => (
                    <option key={w.wallet_id} value={w.wallet_id} className="dark:bg-gray-900 bg-white">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                  {t('modals.tx.targetWallet', { defaultValue: 'Vers le compte' })}
                </label>
                <select
                  value={targetWalletId}
                  onChange={(e) => setTargetWalletId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-sky-500"
                >
                  {wallets.map((w) => (
                    <option key={w.wallet_id} value={w.wallet_id} className="dark:bg-gray-900 bg-white">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                  {t('modals.tx.sourceWallet', { defaultValue: 'Portefeuille' })}
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.wallet_id} value={w.wallet_id} className="dark:bg-gray-900 bg-white">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                  {t('modals.tx.category', { defaultValue: 'Catégorie' })}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">{t('modals.tx.selectCategory', { defaultValue: 'Sélectionner...' })}</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id} className="dark:bg-gray-900 bg-white">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.tx.note', { defaultValue: 'Note / Description (optionnel)' })}
            </label>
            <input
              type="text"
              placeholder={t('modals.tx.notePlaceholder', { defaultValue: 'Ex: Courses, Taxi, Facture...' })}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm ${
              mode === 'expense'
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 shadow-rose-950/20'
                : mode === 'income'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-950/20 text-gray-950'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sky-950/20'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
            {t('modals.tx.submit', { defaultValue: 'Enregistrer l’Opération' })}
          </button>
        </form>
      </div>
    </div>
  )
}
