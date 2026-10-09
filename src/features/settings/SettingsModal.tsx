import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { profileApi } from '../../data/profile'
import { supabase } from '../../lib/supabase'
import type { CurrencyCode, Profile, Transaction } from '../../types/database'
import { Settings, X, Loader2, Download, LogOut, Check } from 'lucide-react'
import { LanguageSelector } from '../../components/LanguageSelector'
import { ThemeToggle } from '../../components/ThemeToggle'

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

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      await profileApi.updateProfile({
        fullName: fullName.trim() || undefined,
        currency,
        payDay: Number(payDay),
      })
      setSaved(true)
      onProfileUpdated()
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      alert(err.message || t('common.errorOccurred', { defaultValue: 'Erreur lors de la sauvegarde du profil' }))
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!transactions.length) {
      alert(t('appTransactions.noResults', { defaultValue: 'Aucune transaction à exporter.' }))
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

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.settings.fullName', { defaultValue: "Nom complet" })}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Votre nom complet"
              className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-emerald-500"
            />
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
                onChange={(e) => setPayDay(Number(e.target.value))}
                className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm shadow-md"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
            ) : saved ? (
              <>
                <Check className="w-4 h-4 text-gray-950" />
                {t('common.save', { defaultValue: 'Enregistré !' })}
              </>
            ) : (
              t('modals.settings.saveChanges', { defaultValue: 'Enregistrer les Paramètres' })
            )}
          </button>
        </form>

        {/* Préférences Affichage & Langue */}
        <div className="mt-5 pt-4 border-t dark:border-white/10 border-gray-200">
          <div className="flex items-center justify-between p-3 rounded-2xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/5 border-gray-200">
            <div>
              <p className="text-xs font-semibold dark:text-gray-200 text-gray-800">
                {t('nav.langAndTheme', { defaultValue: 'Affichage & Langue' })}
              </p>
              <p className="text-[11px] text-gray-400">
                {t('modals.settings.payDayHelp', { defaultValue: 'Thème et langue de l’application' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t dark:border-white/10 border-gray-200 space-y-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold dark:text-gray-300 text-gray-700 hover:text-gray-900 dark:hover:text-white dark:bg-gray-800/60 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-800 border dark:border-white/5 border-gray-200 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {t('modals.settings.exportData', { defaultValue: 'Exporter les transactions (CSV)' })}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {t('modals.settings.logout', { defaultValue: 'Se déconnecter' })}
          </button>
        </div>
      </div>
    </div>
  )
}
