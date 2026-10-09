import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { walletsApi } from '../../data/wallets'
import type { WalletType } from '../../types/database'
import { Wallet, X, Loader2, AlertCircle } from 'lucide-react'
import { AMOUNT_REGEX } from '../../lib/validation'

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  if (!isOpen) return null

  const providersByType: Record<WalletType, string[]> = {
    mobile_money: ['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Autre Mobile Money'],
    cash: ['Cash (Espèces)'],
    bank: ['Ecobank', 'SGBC / Société Générale', 'UBA', 'BOA', 'Coris Bank', 'Autre Banque'],
  }

  const validateField = (field: string, val: string) => {
    let err: string | undefined

    if (field === 'name') {
      const trimmed = val.trim()
      if (!trimmed && !provider) {
        err = 'Veuillez renseigner un nom pour ce portefeuille.'
      } else if (trimmed && trimmed.length < 2) {
        err = 'Le nom doit comporter au moins 2 caractères.'
      }
    } else if (field === 'initialBalance') {
      const trimmed = val.trim().replace(',', '.')
      if (trimmed !== '') {
        if (!AMOUNT_REGEX.test(trimmed)) {
          err = 'Le solde initial doit être un nombre positif (ex: 50000).'
        } else {
          const num = parseFloat(trimmed)
          if (isNaN(num) || num < 0) {
            err = 'Le solde initial ne peut pas être négatif.'
          }
        }
      }
    }

    setFieldErrors((prev) => {
      const copy = { ...prev }
      if (err) copy[field] = err
      else delete copy[field]
      return copy
    })

    return !err
  }

  const handleBlur = (field: string, val: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateField(field, val)
  }

  const validateAll = () => {
    const errors: Record<string, string> = {}
    const trimmedName = name.trim()

    if (!trimmedName && !provider) {
      errors.name = 'Veuillez renseigner un nom pour ce portefeuille.'
    } else if (trimmedName && trimmedName.length < 2) {
      errors.name = 'Le nom doit comporter au moins 2 caractères.'
    }

    const trimmedBalance = initialBalance.trim().replace(',', '.')
    if (trimmedBalance !== '') {
      if (!AMOUNT_REGEX.test(trimmedBalance)) {
        errors.initialBalance = 'Le solde initial doit être un nombre positif (ex: 50000).'
      } else {
        const num = parseFloat(trimmedBalance)
        if (isNaN(num) || num < 0) {
          errors.initialBalance = 'Le solde initial ne peut pas être négatif.'
        }
      }
    }

    setFieldErrors(errors)
    setTouched({ name: true, initialBalance: true })
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!validateAll()) {
      return
    }

    setLoading(true)

    try {
      const parsedBalance = initialBalance.trim()
        ? parseFloat(initialBalance.trim().replace(',', '.'))
        : undefined

      await walletsApi.create({
        name: name.trim() || provider,
        type,
        provider: type === 'cash' ? undefined : provider,
        initialBalance: parsedBalance,
      })
      onCreated()
      onClose()
      setName('')
      setInitialBalance('')
      setFieldErrors({})
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
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
              placeholder={provider || t('modals.wallet.accountNamePlaceholder', { defaultValue: 'Nom du portefeuille' })}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (touched.name) validateField('name', e.target.value)
              }}
              onBlur={() => handleBlur('name', name)}
              className={`w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border transition dark:text-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none ${
                fieldErrors.name
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                  : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
              }`}
            />
            {fieldErrors.name && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.wallet.initialBalance', { defaultValue: 'Solde initial' })}
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={initialBalance}
              onChange={(e) => {
                setInitialBalance(e.target.value)
                if (touched.initialBalance) validateField('initialBalance', e.target.value)
              }}
              onBlur={() => handleBlur('initialBalance', initialBalance)}
              className={`w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border transition dark:text-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none ${
                fieldErrors.initialBalance
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                  : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
              }`}
            />
            {fieldErrors.initialBalance && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {fieldErrors.initialBalance}
              </p>
            )}
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
