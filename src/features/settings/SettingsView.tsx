import React, { useState } from 'react'
import {
  User,
  Coins,
  Tags,
  Crown,
  Shield,
  Check,
  Loader2,
  Plus,
  Download,
  LogOut,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  AlertCircle,
  KeyRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { profileApi } from '../../data/profile'
import { categoriesApi } from '../../data/categories'
import { supabase } from '../../lib/supabase'
import { ThemeToggle } from '../../components/ThemeToggle'
import { LanguageSelector } from '../../components/LanguageSelector'
import { ChangePasswordModal } from '../auth/ChangePasswordModal'
import type {
  Category,
  CurrencyCode,
  Profile,
  Transaction,
  UserPlan,
} from '../../types/database'

interface SettingsViewProps {
  user: any
  profile: Profile | null
  categories: Category[]
  transactions: Transaction[]
  currency: CurrencyCode
  onProfileUpdated: () => void
  onCategoryAdded?: (cat: Category) => void
  onCategoryDeleted?: (id: string) => void
  onCurrencyChange?: (c: CurrencyCode) => void
  onNavigateToAdmin?: () => void
}

const AVAILABLE_CURRENCIES: Array<{
  code: CurrencyCode
  label: string
  region: string
  symbol: string
}> = [
  { code: 'XOF', label: 'FCFA UEMOA', region: 'Côte d’Ivoire, Sénégal, Mali, Burkina...', symbol: 'FCFA' },
  { code: 'XAF', label: 'FCFA CEMAC', region: 'Cameroun, Gabon, Congo, Tchad...', symbol: 'FCFA' },
  { code: 'GNF', label: 'Franc Guinéen', region: 'Guinée (Conakry)', symbol: 'GNF' },
  { code: 'CDF', label: 'Franc Congolais', region: 'RD Congo', symbol: 'FC' },
  { code: 'MAD', label: 'Dirham Marocain', region: 'Maroc', symbol: 'DH' },
  { code: 'NGN', label: 'Naira Nigérian', region: 'Nigeria', symbol: '₦' },
  { code: 'GHS', label: 'Cedi Ghanéen', region: 'Ghana', symbol: 'GH₵' },
  { code: 'EUR', label: 'Euro', region: 'Zone Euro & Diaspora', symbol: '€' },
  { code: 'USD', label: 'Dollar US', region: 'International', symbol: '$' },
]

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  profile,
  categories,
  transactions,
  currency,
  onProfileUpdated,
  onCategoryAdded,
  onCategoryDeleted,
  onCurrencyChange,
  onNavigateToAdmin,
}) => {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<
    'profile' | 'currency' | 'categories' | 'subscription' | 'security'
  >('profile')

  // Profile Form
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(
    profile?.currency || currency || 'XOF'
  )
  const [payDay, setPayDay] = useState(profile?.pay_day || 1)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [profileTouched, setProfileTouched] = useState<Record<string, boolean>>({})

  // Subscription state
  const [currentPlan, setCurrentPlan] = useState<UserPlan>(profile?.plan || 'free')
  const [planSuccess, setPlanSuccess] = useState(false)

  // Category creation
  const [newCatName, setNewCatName] = useState('')
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense')
  const [catFilter, setCatFilter] = useState<'all' | 'expense' | 'income'>('all')
  const [creatingCat, setCreatingCat] = useState(false)
  const [catError, setCatError] = useState<string | null>(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  // Validation profil
  const validateProfileField = (field: string, val: any) => {
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

    setProfileErrors((prev) => {
      const copy = { ...prev }
      if (err) copy[field] = err
      else delete copy[field]
      return copy
    })
    return !err
  }

  // Sauvegarder Profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileTouched({ fullName: true, payDay: true })

    const errors: Record<string, string> = {}
    if (fullName.trim() && fullName.trim().length < 2) {
      errors.fullName = 'Le nom doit comporter au moins 2 caractères.'
    }
    const dayNum = Number(payDay)
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      errors.payDay = 'Le jour de paie doit être un nombre compris entre 1 et 31.'
    }

    setProfileErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSavingProfile(true)
    setProfileSuccess(false)

    try {
      if (user) {
        await profileApi.updateProfile({
          fullName: fullName.trim() || undefined,
          currency: selectedCurrency,
          payDay: dayNum,
        })
      }
      if (onCurrencyChange) onCurrencyChange(selectedCurrency)
      onProfileUpdated()
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 2500)
    } catch (err: any) {
      setProfileErrors({ global: err.message || 'Erreur lors de la mise à jour du profil' })
    } finally {
      setSavingProfile(false)
    }
  }

  // Changer de plan (simulation SaaS)
  const handleSelectPlan = (plan: UserPlan) => {
    setCurrentPlan(plan)
    setPlanSuccess(true)
    setTimeout(() => setPlanSuccess(false), 2500)
  }

  // Créer une catégorie
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setCatError(null)

    const trimmed = newCatName.trim()
    if (!trimmed) {
      setCatError('Veuillez renseigner un nom pour la catégorie.')
      return
    }
    if (trimmed.length < 2) {
      setCatError('Le nom de la catégorie doit comporter au moins 2 caractères.')
      return
    }

    setCreatingCat(true)
    try {
      if (user) {
        const cat = await categoriesApi.create({
          name: trimmed,
          type: newCatType,
        })
        if (onCategoryAdded) onCategoryAdded(cat)
      } else {
        const mockCat: Category = {
          id: `cat-${Date.now()}`,
          user_id: 'demo',
          name: trimmed,
          type: newCatType,
          icon: null,
          parent_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        }
        if (onCategoryAdded) onCategoryAdded(mockCat)
      }
      setNewCatName('')
      setCatError(null)
    } catch (err: any) {
      setCatError(err.message || 'Erreur lors de la création de la catégorie')
    } finally {
      setCreatingCat(false)
    }
  }

  const handleDeleteCategory = (catId: string) => {
    if (!window.confirm('Voulez-vous supprimer cette catégorie ?')) return
    if (onCategoryDeleted) onCategoryDeleted(catId)
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!transactions.length) {
      alert('Aucune transaction disponible à exporter.')
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
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `export_complet_pfm_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.hash = ''
    window.location.reload()
  }

  const filteredCategories = categories.filter((c) => {
    if (catFilter === 'all') return true
    return c.type === catFilter
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. En-tête Paramètres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 sm:p-6 rounded-2xl border dark:border-white/5 border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/15 text-purple-500 dark:text-purple-400 font-bold">
              ⚙️
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold dark:text-white text-gray-900 tracking-tight">
              {t('appSettings.title')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('appSettings.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {profile?.role === 'admin' && onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/30 transition cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('appSettings.adminPortal')}</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold dark:bg-gray-800 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300 text-gray-700 border dark:border-white/5 border-gray-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('appSettings.csvBackup')}</span>
          </button>
        </div>
      </div>

      {/* 2. Menu Navigation des Sous-sections */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'profile', label: t('appSettings.profileTab'), icon: User },
          { id: 'currency', label: t('appSettings.currencyTab'), icon: Coins },
          { id: 'categories', label: t('appSettings.categoriesTab'), icon: Tags },
          { id: 'subscription', label: t('appSettings.subscriptionTab'), icon: Crown },
          { id: 'security', label: t('appSettings.securityTab'), icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeSection === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex-shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-950/20'
                  : 'dark:text-gray-300 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 3. SECTION 1 : PROFIL & IDENTITÉ */}
      {activeSection === 'profile' && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 border dark:border-white/5 border-gray-200 space-y-6">
          <div className="flex items-center justify-between border-b dark:border-white/10 border-gray-200 pb-4">
            <div>
              <h2 className="text-base font-bold dark:text-white text-gray-900">
                {t('appSettings.personalInfo')}
              </h2>
              <p className="text-xs text-gray-400">{t('appSettings.personalInfoSubtitle')}</p>
            </div>
            {profileSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                <Check className="w-3.5 h-3.5" /> {t('appSettings.profileSaved')}
              </span>
            )}
          </div>

          {profileErrors.global && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{profileErrors.global}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} noValidate className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                {t('appSettings.fullName')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (profileTouched.fullName) validateProfileField('fullName', e.target.value)
                }}
                onBlur={() => {
                  setProfileTouched((prev) => ({ ...prev, fullName: true }))
                  validateProfileField('fullName', fullName)
                }}
                placeholder="ex: Mamadou Kouassi"
                className={`w-full py-2.5 px-3 rounded-xl dark:bg-gray-900 bg-gray-50 border transition dark:text-white text-sm focus:outline-none ${
                  profileErrors.fullName
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                    : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
                }`}
              />
              {profileErrors.fullName && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" /> {profileErrors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                {t('appSettings.emailAddress')}
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'demo@mywallet-africa.com'}
                className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900/40 bg-gray-100 border dark:border-white/5 border-gray-200 text-gray-400 text-sm cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                  {t('appSettings.payDay')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={payDay}
                  onChange={(e) => {
                    setPayDay(Number(e.target.value))
                    if (profileTouched.payDay) validateProfileField('payDay', e.target.value)
                  }}
                  onBlur={() => {
                    setProfileTouched((prev) => ({ ...prev, payDay: true }))
                    validateProfileField('payDay', payDay)
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl dark:bg-gray-900 bg-gray-50 border transition dark:text-white text-sm focus:outline-none ${
                    profileErrors.payDay
                      ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                      : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
                  }`}
                />
                {profileErrors.payDay && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" /> {profileErrors.payDay}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">
                  {t('appSettings.payDayHelp')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                  {t('appSettings.mainCurrency')}
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                  className="w-full py-2.5 px-3 rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  {AVAILABLE_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code} className="dark:bg-gray-900 bg-white">
                      {c.code} — {c.label} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="py-2.5 px-5 rounded-xl font-bold text-xs sm:text-sm text-gray-950 bg-emerald-400 hover:bg-emerald-300 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-950/20"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{t('appSettings.saveChanges')}</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. SECTION 2 : DEVISES AFRICAINES */}
      {activeSection === 'currency' && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 border dark:border-white/5 border-gray-200 space-y-4">
          <div>
            <h2 className="text-base font-bold dark:text-white text-gray-900">
              {t('appSettings.currencyTab')}
            </h2>
            <p className="text-xs text-gray-400">
              {t('appSettings.currencySectionSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AVAILABLE_CURRENCIES.map((c) => {
              const isSelected = selectedCurrency === c.code
              return (
                <div
                  key={c.code}
                  onClick={() => {
                    setSelectedCurrency(c.code)
                    if (onCurrencyChange) onCurrencyChange(c.code)
                  }}
                  className={`p-4 rounded-xl border transition cursor-pointer card-hover-effect ${
                    isSelected
                      ? 'border-emerald-500 dark:bg-emerald-950/30 bg-emerald-50 shadow-sm'
                      : 'dark:border-white/5 border-gray-200 dark:bg-gray-900/40 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold dark:text-white text-gray-900">{c.code}</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500">
                      {c.symbol}
                    </span>
                  </div>
                  <p className="text-xs font-semibold dark:text-gray-300 text-gray-700">{c.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{c.region}</p>
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-500 font-bold">
                      <Check className="w-3.5 h-3.5" /> {t('appSettings.activeCurrency')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 5. SECTION 3 : GESTION DES CATÉGORIES (CRUD: Ajout & Suppression) */}
      {activeSection === 'categories' && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 border dark:border-white/5 border-gray-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b dark:border-white/10 border-gray-200 pb-4">
            <div>
              <h2 className="text-base font-bold dark:text-white text-gray-900">
                {t('appSettings.categoriesTab')}
              </h2>
              <p className="text-xs text-gray-400">
                {t('appSettings.categoriesSectionSubtitle')}
              </p>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-0.5 rounded-xl border dark:border-white/5 border-gray-200">
              {(['all', 'expense', 'income'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCatFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    catFilter === filter
                      ? 'bg-emerald-500 text-gray-950 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {filter === 'all'
                    ? t('appSettings.allCategories')
                    : filter === 'expense'
                    ? t('appSettings.expenseCats')
                    : t('appSettings.incomeCats')}
                </button>
              ))}
            </div>
          </div>

          {/* Formulaire ajout catégorie */}
          <div>
            <form onSubmit={handleCreateCategory} noValidate className="flex gap-2 flex-wrap items-center">
              <input
                type="text"
                placeholder={t('appSettings.newCategory') + ' (ex: Frais Mobile Money...)'}
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value)
                  if (catError) setCatError(null)
                }}
                className={`flex-1 min-w-[200px] py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border transition dark:text-white ${
                  catError
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                    : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
                }`}
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as any)}
                className="py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white cursor-pointer"
              >
                <option value="expense">{t('modals.tx.expense', { defaultValue: 'Dépense' })}</option>
                <option value="income">{t('modals.tx.income', { defaultValue: 'Revenu' })}</option>
              </select>
              <button
                type="submit"
                disabled={creatingCat}
                className="py-2 px-4 rounded-xl text-xs font-bold text-gray-950 bg-emerald-400 hover:bg-emerald-300 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('appSettings.addCategoryBtn')}</span>
              </button>
            </form>
            {catError && (
              <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {catError}
              </p>
            )}
          </div>

          {/* Grille des catégories */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filteredCategories.map((cat) => {
              const isExpense = cat.type === 'expense'
              return (
                <div
                  key={cat.id}
                  className="p-2.5 rounded-xl border dark:border-white/5 border-gray-200 dark:bg-gray-900/40 bg-gray-50 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isExpense ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-xs font-semibold dark:text-white text-gray-900 truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        isExpense
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {isExpense ? t('modals.tx.expense', { defaultValue: 'Dépense' }) : t('modals.tx.income', { defaultValue: 'Revenu' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 sm:p-1 text-rose-500 sm:text-gray-400 hover:text-rose-500 active:scale-90 transition cursor-pointer"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 6. SECTION 4 : ABONNEMENT SAAS */}
      {activeSection === 'subscription' && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 border dark:border-white/5 border-gray-200 space-y-6">
          <div className="flex items-center justify-between border-b dark:border-white/10 border-gray-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold dark:text-white text-gray-900">
                  {t('appSettings.subscriptionTab')}
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  {t('appSettings.activePlan')} {currentPlan.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('appSettings.paymentSubtitle')}
              </p>
            </div>
            {planSuccess && (
              <span className="text-xs text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl">
                {t('appSettings.planUpdated')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plan Gratuit */}
            <div
              className={`p-5 rounded-2xl border transition relative ${
                currentPlan === 'free'
                  ? 'border-emerald-500/40 dark:bg-emerald-950/10 bg-emerald-50/50'
                  : 'dark:border-white/5 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold dark:text-white text-gray-900">
                  {t('appSettings.freePlan')}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-gray-800 bg-gray-200 text-gray-500">
                  0 FCFA
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-4">{t('appSettings.freeDesc')}</p>
              <ul className="text-xs space-y-2 mb-5 dark:text-gray-300 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('appSettings.freeF1')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('appSettings.freeF2')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('appSettings.freeF3')}
                </li>
              </ul>
              <button
                type="button"
                onClick={() => handleSelectPlan('free')}
                disabled={currentPlan === 'free'}
                className="w-full py-2.5 rounded-xl text-xs font-bold border dark:border-white/10 border-gray-300 dark:text-white text-gray-800 disabled:opacity-50 cursor-pointer"
              >
                {currentPlan === 'free' ? t('appSettings.currentPlan') : t('appSettings.switchToFree')}
              </button>
            </div>

            {/* Plan Premium / Pro */}
            <div
              className={`p-5 rounded-2xl border transition relative ${
                currentPlan === 'premium'
                  ? 'border-emerald-500 dark:bg-emerald-950/20 bg-emerald-50 shadow-lg'
                  : 'border-emerald-500/30'
              }`}
            >
              <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-emerald-400 to-teal-400 text-gray-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                {t('appSettings.recommended')}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold dark:text-white text-gray-900">
                  {t('appSettings.proPlan')}
                </span>
                <span className="text-sm font-extrabold text-emerald-500">{t('appSettings.proPrice')}</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                {t('appSettings.proDesc')}
              </p>
              <ul className="text-xs space-y-2 mb-5 dark:text-gray-300 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('appSettings.proF1')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('appSettings.proF2')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('appSettings.proF3')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t('appSettings.proF4')}
                </li>
              </ul>
              <button
                type="button"
                onClick={() => handleSelectPlan('premium')}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition shadow-md shadow-emerald-900/30 cursor-pointer"
              >
                {currentPlan === 'premium' ? t('appSettings.proActive') : t('appSettings.upgradeCta')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. SECTION 5 : SÉCURITÉ & AFFICHAGE */}
      {activeSection === 'security' && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 border dark:border-white/5 border-gray-200 space-y-6">
          <div className="border-b dark:border-white/10 border-gray-200 pb-4">
            <h2 className="text-base font-bold dark:text-white text-gray-900">
              {t('appSettings.securityTab')}
            </h2>
            <p className="text-xs text-gray-400">{t('appSettings.securitySubtitle')}</p>
          </div>

          <div className="space-y-4 max-w-lg">
            {/* Langue & Thème */}
            <div className="flex items-center justify-between p-3.5 rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/5 border-gray-200">
              <div>
                <span className="text-xs font-semibold dark:text-white text-gray-900 block">
                  {t('appSettings.langTitle')}
                </span>
                <span className="text-[11px] text-gray-400">{t('appSettings.langDesc')}</span>
              </div>
              <LanguageSelector />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/5 border-gray-200">
              <div>
                <span className="text-xs font-semibold dark:text-white text-gray-900 block">
                  {t('appSettings.themeTitle')}
                </span>
                <span className="text-[11px] text-gray-400">{t('appSettings.themeDesc')}</span>
              </div>
              <ThemeToggle />
            </div>

            {/* Sécurité Supabase & Mot de passe */}
            <div className="p-4 rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/5 border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold dark:text-white text-gray-900">
                    Mot de passe du compte
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  Renforcez votre compte (recommandé si vous aviez un mot de passe court ou numérique).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="py-2 px-3.5 rounded-xl text-xs font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                Modifier mon mot de passe
              </button>
            </div>

            <div className="p-3.5 rounded-xl dark:bg-emerald-950/20 bg-emerald-50 border border-emerald-500/20 flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-500 block">
                  {t('appSettings.rlsActive')}
                </span>
                <span className="text-[11px] text-gray-400">
                  {t('appSettings.rlsDesc')}
                </span>
              </div>
            </div>

            {/* Déconnexion */}
            <div className="pt-4 border-t dark:border-white/10 border-gray-200">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('appSettings.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHANGEMENT DE MOT DE PASSE */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  )
}
