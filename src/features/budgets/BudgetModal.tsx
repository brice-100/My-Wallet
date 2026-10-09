import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { budgetsApi } from '../../data/budgets'
import type { Category } from '../../types/database'
import { PiggyBank, X, Loader2, AlertCircle } from 'lucide-react'
import { validateAmount } from '../../lib/validation'

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  categories: Category[]
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
}) => {
  const { t } = useTranslation()
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  if (!isOpen) return null

  const validateField = (val: string) => {
    const res = validateAmount(val, 100, 'plafond budgétaire')
    setFieldErrors((prev) => {
      const copy = { ...prev }
      if (!res.isValid) copy.amount = res.error!
      else delete copy.amount
      return copy
    })
    return res.isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setTouched({ amount: true })

    if (!validateField(amount)) {
      return
    }

    setLoading(true)
    const parsedAmount = parseFloat(amount.trim().replace(',', '.'))

    try {
      await budgetsApi.upsert({
        categoryId: categoryId || expenseCategories[0]?.id,
        amount: parsedAmount,
        period: 'monthly',
      })
      onSuccess()
      onClose()
      setAmount('')
      setFieldErrors({})
    } catch (err: any) {
      setErrorMsg(err.message || t('common.errorOccurred', { defaultValue: 'Erreur lors de la mise à jour du budget.' }))
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
            <PiggyBank className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold dark:text-white text-gray-900">{t('modals.budget.title', { defaultValue: 'Définir une Enveloppe Budgétaire' })}</h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t('modals.budget.subtitle', { defaultValue: 'Plafonnez vos dépenses par catégorie pour éviter les imprévus.' })}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.budget.category', { defaultValue: 'Catégorie à Plafonner' })}
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-emerald-500"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-gray-900 bg-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.budget.monthlyLimit', { defaultValue: 'Plafond Mensuel Maximal' })} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ex: 50000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                if (touched.amount) validateField(e.target.value)
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, amount: true }))
                validateField(amount)
              }}
              className={`w-full text-xl font-extrabold py-2.5 px-4 rounded-xl dark:bg-gray-900/60 bg-gray-50 border transition dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none ${
                fieldErrors.amount
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                  : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
              }`}
            />
            {fieldErrors.amount && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {fieldErrors.amount}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.99] transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-950" />}
            {t('modals.budget.submit', { defaultValue: 'Enregistrer le Plafond' })}
          </button>
        </form>
      </div>
    </div>
  )
}
