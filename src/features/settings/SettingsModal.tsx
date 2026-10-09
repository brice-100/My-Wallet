import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { profileApi } from '../../data/profile'
import { supabase } from '../../lib/supabase'
import type { CurrencyCode, Profile, Transaction } from '../../types/database'
import { Settings, X, Loader2, Download, LogOut, Check, AlertCircle, KeyRound } from 'lucide-react'
import { LanguageSelector } from '../../components/LanguageSelector'
import { ThemeToggle } from '../../components/ThemeToggle'
import { ChangePasswordModal } from '../auth/ChangePasswordModal'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile | null
  transactions: Transaction[]
  onProfileUpdated: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  transactions,
  onProfileUpdated,
}) => {
  const { t } = useTranslation()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [currency, setCurrency] = useState<CurrencyCode>(profile?.currency || 'XOF')
  const [payDay, setPayDay] = useState(profile?.pay_day || 1)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  if (!isOpen) return null

  const validateField = (field: string, val: any) => {
    let err: string | undefined
    if (field === 'fullName') {
      const trimmed = String(val).trim()
      if (trimmed && trimmed.length < 2) {
        err = 'Le nom doit comporter au moins 2 caractères.'
      }
    } else if (field === 'payDay') {
      const num = Number(val)
      if (isNaN(num) || num < 1 || num > 31) {
        err = 'Le jour de paie doit être un nombre compris entre 1 et 31.'
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setTouched({ fullName: true, payDay: true })

    const errors: Record<string, string> = {}
    if (fullName.trim() && fullName.trim().length < 2) {
      errors.fullName = 'Le nom doit comporter au moins 2 caractères.'
    }
    const dayNum = Number(payDay)
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      errors.payDay = 'Le jour de paie doit être un nombre compris entre 1 et 31.'
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)
    setSaved(false)

    try {
      await profileApi.updateProfile({
        fullName: fullName.trim() || undefined,
        currency,
        payDay: dayNum,
      })
      setSaved(true)
      onProfileUpdated()
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setErrorMsg(err.message || t('common.errorOccurred', { defaultValue: 'Erreur lors de la sauvegarde du profil' }))
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!transactions.length) {
      setErrorMsg(t('appTransactions.noResults', { defaultValue: 'Aucune transaction à exporter.' }))
      return
    }

    const headers = ['Date', 'Type', 'Montant', 'Portefeuille', 'Catégorie', 'Note']
    const rows = transactions.map((t) => [
      t.occurred_at,
      t.type,
      t.amount,
      t.wallet?.name || '',
      t.category?.name || '',
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `transactions_pfm_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onClose()
    window.location.reload()
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
            <Settings className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold dark:text-white text-gray-900">{t('modals.settings.title', { defaultValue: 'Paramètres du Portefeuille' })}</h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t('modals.settings.subtitle', { defaultValue: 'Personnalisez votre devise, jour de paie et exportez vos données.' })}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.settings.fullName', { defaultValue: "Nom complet" })}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (touched.fullName) validateField('fullName', e.target.value)
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, fullName: true }))
                validateField('fullName', fullName)
              }}
              placeholder="Votre nom complet"
              className={`w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border transition dark:text-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none ${
                fieldErrors.fullName
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                  : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
              }`}
            />
            {fieldErrors.fullName && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {fieldErrors.fullName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                {t('modals.settings.currency', { defaultValue: 'Devise Principale' })}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="XOF" className="dark:bg-gray-900 bg-white">XOF (FCFA Ouest)</option>
                <option value="XAF" className="dark:bg-gray-900 bg-white">XAF (FCFA Centre)</option>
                <option value="GNF" className="dark:bg-gray-900 bg-white">GNF (Franc Guinéen)</option>
                <option value="CDF" className="dark:bg-gray-900 bg-white">CDF (Franc Congolais)</option>
                <option value="EUR" className="dark:bg-gray-900 bg-white">EUR (€ Euro)</option>
                <option value="USD" className="dark:bg-gray-900 bg-white">USD ($ Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                {t('modals.settings.payDay', { defaultValue: 'Jour de Paie (1 - 31)' })}
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={payDay}
                onChange={(e) => {
                  setPayDay(Number(e.target.value))
                  if (touched.payDay) validateField('payDay', e.target.value)
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, payDay: true }))
                  validateField('payDay', payDay)
                }}
                className={`w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border transition dark:text-white text-gray-900 text-sm focus:outline-none ${
                  fieldErrors.payDay
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                    : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
                }`}
              />
              {fieldErrors.payDay && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" /> {fieldErrors.payDay}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.99] transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
            ) : saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-950" />
                <span>{t('modals.settings.saved', { defaultValue: 'Enregistré avec succès !' })}</span>
              </>
            ) : (
              t('modals.settings.save', { defaultValue: 'Enregistrer les modifications' })
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t dark:border-white/10 border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium dark:text-gray-300 text-gray-700">Langue & Thème</span>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold dark:text-white text-gray-900">Mot de passe</p>
              <p className="text-[10px] text-gray-400">Modifier ou renforcer votre mot de passe de connexion.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="py-1.5 px-3 rounded-lg border dark:border-white/10 border-gray-200 text-xs font-semibold dark:text-white text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
              <span>Modifier</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold dark:text-white text-gray-900">Données & Sauvegarde</p>
              <p className="text-[10px] text-gray-400">Exportez l'ensemble de vos transactions au format CSV.</p>
            </div>
            <button
              type="button"
              onClick={handleExportCSV}
              className="py-1.5 px-3 rounded-lg border dark:border-white/10 border-gray-200 text-xs font-semibold dark:text-white text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter CSV</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav.logout', { defaultValue: 'Se déconnecter' })}</span>
          </button>
        </div>
      </div>

      {/* MODAL MODIFIER MOT DE PASSE */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  )
}
