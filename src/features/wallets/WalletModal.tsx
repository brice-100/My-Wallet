import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { walletsApi } from '../../data/wallets'
import type { WalletType } from '../../types/database'
import { Wallet, X, Loader2 } from 'lucide-react'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [type, setType] = useState<WalletType>('mobile_money')
  const [provider, setProvider] = useState('Wave')
  const [initialBalance, setInitialBalance] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const providersByType: Record<WalletType, string[]> = {
    mobile_money: ['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Autre Mobile Money'],
    cash: ['Cash (Espèces)'],
    bank: ['Ecobank', 'SGBC / Société Générale', 'UBA', 'BOA', 'Coris Bank', 'Autre Banque'],
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      await walletsApi.create({
        name: name.trim() || provider,
        type,
        provider: type === 'cash' ? undefined : provider,
        initialBalance: initialBalance ? parseFloat(initialBalance) : undefined,
      })
      onCreated()
      onClose()
      setName('')
      setInitialBalance('')
    } catch (err: any) {
      setErrorMsg(err.message || t('common.errorOccurred', { defaultValue: 'Erreur lors de la création du portefeuille' }))
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

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <Wallet className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold dark:text-white text-gray-900">{t('modals.wallet.title', { defaultValue: 'Ajouter un Portefeuille' })}</h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t('modals.wallet.subtitle', { defaultValue: 'Ajoutez un compte Mobile Money, des espèces ou un compte bancaire.' })}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs sm:text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-2">
              {t('modals.wallet.walletType', { defaultValue: 'Type de Portefeuille' })}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('mobile_money')
                  setProvider('Wave')
                }}
                className={`py-2 px-2 sm:px-3 rounded-xl border text-xs font-semibold transition text-center cursor-pointer ${
                  type === 'mobile_money'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 dark:text-amber-300'
                    : 'dark:bg-gray-800/50 bg-gray-100 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('modals.wallet.mobileMoney', { defaultValue: 'Mobile Money' })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('cash')
                  setProvider('Cash')
                }}
                className={`py-2 px-2 sm:px-3 rounded-xl border text-xs font-semibold transition text-center cursor-pointer ${
                  type === 'cash'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-300'
                    : 'dark:bg-gray-800/50 bg-gray-100 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('modals.wallet.cash', { defaultValue: 'Cash' })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('bank')
                  setProvider('Ecobank')
                }}
                className={`py-2 px-2 sm:px-3 rounded-xl border text-xs font-semibold transition text-center cursor-pointer ${
                  type === 'bank'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-600 dark:text-indigo-300'
                    : 'dark:bg-gray-800/50 bg-gray-100 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('modals.wallet.bank', { defaultValue: 'Banque' })}
              </button>
            </div>
          </div>

          {type !== 'cash' && (
            <div>
              <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                {t('modals.wallet.operator', { defaultValue: 'Opérateur / Prestataire' })}
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-emerald-500"
              >
                {providersByType[type].map((p) => (
                  <option key={p} value={p} className="dark:bg-gray-900 dark:text-white text-gray-900 bg-white">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.wallet.accountName', { defaultValue: 'Nom du compte' })}
            </label>
            <input
              type="text"
              required
              placeholder={provider || t('modals.wallet.accountNamePlaceholder', { defaultValue: 'Nom du portefeuille' })}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.wallet.initialBalance', { defaultValue: 'Solde initial' })}
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.99] transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-950" />}
            {t('modals.wallet.submit', { defaultValue: 'Créer le Portefeuille' })}
          </button>
        </form>
      </div>
    </div>
  )
}
