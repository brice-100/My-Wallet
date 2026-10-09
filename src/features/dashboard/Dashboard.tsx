import React, { useState, useEffect, useMemo } from 'react'
import {
  Wallet,
  Plus,
  Settings as SettingsIcon,
  LogIn,
  ShieldCheck,
  Calendar,
  Loader2,
  ArrowLeft,
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  ShieldAlert,
  LogOut,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { walletsApi } from '../../data/wallets'
import { transactionsApi } from '../../data/transactions'
import { categoriesApi } from '../../data/categories'
import { budgetsApi } from '../../data/budgets'
import { profileApi } from '../../data/profile'
import { computeFlows, groupByCategory, calculateDailyRemaining } from '../../kpi'
import { ThemeToggle } from '../../components/ThemeToggle'
import { LanguageSelector } from '../../components/LanguageSelector'
import type {
  Category,
  Profile,
  Transaction,
  WalletBalanceView,
  BudgetProgressView,
  MonthlyFlowView,
  CurrencyCode,
} from '../../types/database'

// Vues des Onglets
import { DashboardOverview } from './DashboardOverview'
import { TransactionsView } from '../transactions/TransactionsView'
import { TontinesView } from '../tontines/TontinesView'
import { SettingsView } from '../settings/SettingsView'
import { AdminView } from '../admin/AdminView'

// Modals
import { AuthModal } from '../auth/AuthModal'
import { WalletModal } from '../wallets/WalletModal'
import { TransactionModal } from '../transactions/TransactionModal'
import { BudgetModal } from '../budgets/BudgetModal'
import { SettingsModal } from '../settings/SettingsModal'

export type AppTab = 'dashboard' | 'transactions' | 'tontines' | 'settings' | 'admin'

interface TabConfig {
  id: AppTab
  labelKey: string
  mobileKey: string
  defaultLabel: string
  defaultMobile: string
  icon: string
  lucideIcon: React.ComponentType<{ className?: string }>
}

const APP_TABS: TabConfig[] = [
  { id: 'dashboard', labelKey: 'appTabs.dashboard', mobileKey: 'appTabs.dashboardShort', defaultLabel: 'Tableau de bord', defaultMobile: 'Bord', icon: '📊', lucideIcon: LayoutDashboard },
  { id: 'transactions', labelKey: 'appTabs.transactions', mobileKey: 'appTabs.transactionsShort', defaultLabel: 'Transactions', defaultMobile: 'Transactions', icon: '💸', lucideIcon: ArrowLeftRight },
  { id: 'tontines', labelKey: 'appTabs.tontines', mobileKey: 'appTabs.tontinesShort', defaultLabel: 'Tontines & Dettes', defaultMobile: 'Tontines', icon: '🤝', lucideIcon: Users },
  { id: 'settings', labelKey: 'appTabs.settings', mobileKey: 'appTabs.settingsShort', defaultLabel: 'Paramètres', defaultMobile: 'Paramètres', icon: '⚙️', lucideIcon: SettingsIcon },
  { id: 'admin', labelKey: 'appTabs.admin', mobileKey: 'appTabs.adminShort', defaultLabel: 'Administration', defaultMobile: 'Admin', icon: '🛡️', lucideIcon: ShieldAlert },
]

interface DashboardProps {
  onBackToLanding?: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onBackToLanding }) => {
  const { t } = useTranslation()
  const { user, profile: authProfile, refreshProfile, signOut } = useAuth()
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard')
  const [profile, setProfile] = useState<Profile | null>(authProfile)
  const [wallets, setWallets] = useState<WalletBalanceView[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgressView[]>([])
  const [monthlyFlows, setMonthlyFlows] = useState<MonthlyFlowView[]>([])
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [isTxOpen, setIsTxOpen] = useState(false)
  const [isBudgetOpen, setIsBudgetOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    if (authProfile) {
      setProfile(authProfile)
    }
  }, [authProfile])

  // Charge les données de l'utilisateur ou données démo
  const loadData = async () => {
    setLoading(true)
    try {
      if (user) {
        // Mode Connecté Supabase - chargement robuste
        const [profRes, walletsRes, txRes, catsRes, bProgressRes, flowsRes] = await Promise.allSettled([
          profileApi.getProfile(),
          walletsApi.getWalletsWithBalances(),
          transactionsApi.list({ limit: 100 }),
          categoriesApi.list(),
          budgetsApi.getBudgetProgress(),
          profileApi.getMonthlyFlows(),
        ])

        const prof = profRes.status === 'fulfilled' ? profRes.value : null
        setProfile(
          prof || authProfile || {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
            currency: 'XOF',
            pay_day: 1,
            plan: 'free',
            role: 'user',
            status: 'active',
            created_at: user.created_at,
            updated_at: user.created_at,
          }
        )

        setWallets(walletsRes.status === 'fulfilled' ? walletsRes.value : [])
        setTransactions(txRes.status === 'fulfilled' ? txRes.value : [])
        setCategories(catsRes.status === 'fulfilled' ? catsRes.value : [])
        setBudgetProgress(bProgressRes.status === 'fulfilled' ? bProgressRes.value : [])
        setMonthlyFlows(flowsRes.status === 'fulfilled' ? flowsRes.value : [])
      } else {
        // Mode Démo enrichi
        loadDemoData()
      }
    } catch (err) {
      console.error('Erreur chargement Supabase:', err)
      loadDemoData()
    } finally {
      setLoading(false)
    }
  }

  const loadDemoData = () => {
    const demoWallets: WalletBalanceView[] = [
      {
        wallet_id: 'w-wave',
        user_id: 'demo',
        name: 'Compte Wave',
        type: 'mobile_money',
        provider: 'Wave',
        archived: false,
        balance: 145000,
      },
      {
        wallet_id: 'w-om',
        user_id: 'demo',
        name: 'Orange Money',
        type: 'mobile_money',
        provider: 'Orange Money',
        archived: false,
        balance: 62500,
      },
      {
        wallet_id: 'w-cash',
        user_id: 'demo',
        name: 'Cash (Porte-monnaie)',
        type: 'cash',
        provider: null,
        archived: false,
        balance: 38000,
      },
      {
        wallet_id: 'w-bank',
        user_id: 'demo',
        name: 'Compte Ecobank',
        type: 'bank',
        provider: 'Ecobank',
        archived: false,
        balance: 420000,
      },
    ]

    const demoCategories: Category[] = [
      { id: 'c1', user_id: 'demo', name: 'Alimentation', type: 'expense', icon: 'utensils', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      { id: 'c2', user_id: 'demo', name: 'Transport', type: 'expense', icon: 'bus', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      { id: 'c3', user_id: 'demo', name: 'Loyer', type: 'expense', icon: 'home', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      { id: 'c4', user_id: 'demo', name: 'Tontines', type: 'expense', icon: 'users', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      { id: 'c5', user_id: 'demo', name: 'Factures (CIE / Senelec)', type: 'expense', icon: 'receipt', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      { id: 'c6', user_id: 'demo', name: 'Salaire', type: 'income', icon: 'briefcase', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      { id: 'c7', user_id: 'demo', name: 'Activité / Business', type: 'income', icon: 'store', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
    ]

    const demoTx: Transaction[] = [
      {
        id: 't1',
        user_id: 'demo',
        wallet_id: 'w-wave',
        category_id: 'c1',
        amount: 12500,
        type: 'expense',
        occurred_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        note: 'Courses Supermarché & Garba',
        transfer_group_id: null,
        source: 'manual',
        created_at: '',
        updated_at: '',
        deleted_at: null,
        wallet: { id: 'w-wave', user_id: 'demo', name: 'Compte Wave', type: 'mobile_money', provider: 'Wave', archived: false, created_at: '', updated_at: '', deleted_at: null },
        category: { id: 'c1', user_id: 'demo', name: 'Alimentation', type: 'expense', icon: 'utensils', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      },
      {
        id: 't2',
        user_id: 'demo',
        wallet_id: 'w-om',
        category_id: 'c2',
        amount: 3000,
        type: 'expense',
        occurred_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        note: 'Yango / Taxi ville',
        transfer_group_id: null,
        source: 'manual',
        created_at: '',
        updated_at: '',
        deleted_at: null,
        wallet: { id: 'w-om', user_id: 'demo', name: 'Orange Money', type: 'mobile_money', provider: 'Orange Money', archived: false, created_at: '', updated_at: '', deleted_at: null },
        category: { id: 'c2', user_id: 'demo', name: 'Transport', type: 'expense', icon: 'bus', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      },
      {
        id: 't3',
        user_id: 'demo',
        wallet_id: 'w-bank',
        category_id: 'c6',
        amount: 650000,
        type: 'income',
        occurred_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        note: 'Virement Salaire Mensuel',
        transfer_group_id: null,
        source: 'manual',
        created_at: '',
        updated_at: '',
        deleted_at: null,
        wallet: { id: 'w-bank', user_id: 'demo', name: 'Compte Ecobank', type: 'bank', provider: 'Ecobank', archived: false, created_at: '', updated_at: '', deleted_at: null },
        category: { id: 'c6', user_id: 'demo', name: 'Salaire', type: 'income', icon: 'briefcase', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      },
      {
        id: 't4',
        user_id: 'demo',
        wallet_id: 'w-wave',
        category_id: 'c4',
        amount: 50000,
        type: 'expense',
        occurred_at: new Date(Date.now() - 86400000 * 6).toISOString(),
        note: 'Cotisation Tontine des Cadres',
        transfer_group_id: null,
        source: 'manual',
        created_at: '',
        updated_at: '',
        deleted_at: null,
        wallet: { id: 'w-wave', user_id: 'demo', name: 'Compte Wave', type: 'mobile_money', provider: 'Wave', archived: false, created_at: '', updated_at: '', deleted_at: null },
        category: { id: 'c4', user_id: 'demo', name: 'Tontines', type: 'expense', icon: 'users', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      },
      {
        id: 't5',
        user_id: 'demo',
        wallet_id: 'w-om',
        category_id: 'c5',
        amount: 28000,
        type: 'expense',
        occurred_at: new Date(Date.now() - 86400000 * 8).toISOString(),
        note: 'Facture CIE Électricité',
        transfer_group_id: null,
        source: 'manual',
        created_at: '',
        updated_at: '',
        deleted_at: null,
        wallet: { id: 'w-om', user_id: 'demo', name: 'Orange Money', type: 'mobile_money', provider: 'Orange Money', archived: false, created_at: '', updated_at: '', deleted_at: null },
        category: { id: 'c5', user_id: 'demo', name: 'Factures (CIE / Senelec)', type: 'expense', icon: 'receipt', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      },
      {
        id: 't6',
        user_id: 'demo',
        wallet_id: 'w-cash',
        category_id: 'c7',
        amount: 45000,
        type: 'income',
        occurred_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        note: 'Paiement client freelance',
        transfer_group_id: null,
        source: 'manual',
        created_at: '',
        updated_at: '',
        deleted_at: null,
        wallet: { id: 'w-cash', user_id: 'demo', name: 'Cash (Porte-monnaie)', type: 'cash', provider: null, archived: false, created_at: '', updated_at: '', deleted_at: null },
        category: { id: 'c7', user_id: 'demo', name: 'Activité / Business', type: 'income', icon: 'store', parent_id: null, created_at: '', updated_at: '', deleted_at: null },
      },
    ]

    const demoBudgets: BudgetProgressView[] = [
      {
        budget_id: 'b1',
        user_id: 'demo',
        category_id: 'c1',
        category_name: 'Alimentation',
        period: 'monthly',
        budget_amount: 100000,
        spent: 54000,
        percent_used: 54,
      },
      {
        budget_id: 'b2',
        user_id: 'demo',
        category_id: 'c2',
        category_name: 'Transport & Yango',
        period: 'monthly',
        budget_amount: 40000,
        spent: 34500,
        percent_used: 86,
      },
      {
        budget_id: 'b3',
        user_id: 'demo',
        category_id: 'c3',
        category_name: 'Loyer & Logement',
        period: 'monthly',
        budget_amount: 150000,
        spent: 150000,
        percent_used: 100,
      },
    ]

    const demoFlows: MonthlyFlowView[] = [
      { user_id: 'demo', month: '2026-05-01', income: 600000, expense: 410000 },
      { user_id: 'demo', month: '2026-06-01', income: 620000, expense: 480000 },
      { user_id: 'demo', month: '2026-07-01', income: 650000, expense: 390000 },
      { user_id: 'demo', month: '2026-08-01', income: 710000, expense: 520000 },
      { user_id: 'demo', month: '2026-09-01', income: 680000, expense: 430000 },
      { user_id: 'demo', month: '2026-10-01', income: 695000, expense: 243500 },
    ]

    setProfile({
      id: 'demo',
      full_name: 'Mamadou Diallo',
      currency: 'XOF',
      pay_day: 28,
      plan: 'free',
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    setWallets(demoWallets)
    setTransactions(demoTx)
    setCategories(demoCategories)
    setBudgetProgress(demoBudgets)
    setMonthlyFlows(demoFlows)
  }

  useEffect(() => {
    loadData()
  }, [user])

  const isAdmin = profile?.role === 'admin'

  // Filtrer les onglets : seuls les admins voient l'onglet et l'icône Administration
  const visibleTabs = useMemo(() => {
    return APP_TABS.filter((tab) => tab.id !== 'admin' || isAdmin)
  }, [isAdmin])

  // Sécurité : redirection si un non-admin essaie d'accéder à l'onglet admin
  useEffect(() => {
    if (currentTab === 'admin' && !isAdmin) {
      setCurrentTab('dashboard')
    }
  }, [currentTab, isAdmin])

  // Calculs financiers
  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0)
  const flows = computeFlows(transactions)
  const spendingCategories = groupByCategory(transactions)
  const dailyRemaining = calculateDailyRemaining(totalBalance, profile?.pay_day || 1)
  const currency: CurrencyCode = profile?.currency || 'XOF'

  const handleDeleteWallet = async (walletId: string) => {
    if (!window.confirm(t('common.confirmDelete', { defaultValue: 'Voulez-vous vraiment supprimer ce portefeuille ?' }))) return
    try {
      if (user) {
        await walletsApi.softDelete(walletId)
      }
      setWallets((prev) => prev.filter((w) => w.wallet_id !== walletId))
    } catch (err) {
      console.error('Erreur suppression portefeuille:', err)
      alert(t('common.errorOccurred', { defaultValue: 'Une erreur est survenue lors de la suppression.' }))
    }
  }

  const handleDeleteTransaction = async (txId: string) => {
    if (!window.confirm(t('appTransactions.deleteConfirm', { defaultValue: 'Voulez-vous supprimer cette opération ?' }))) return
    try {
      const tx = transactions.find((t) => t.id === txId)
      if (user && tx) {
        await transactionsApi.softDelete(tx)
      }
      setTransactions((prev) => prev.filter((t) => t.id !== txId))
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert(t('common.errorOccurred', { defaultValue: 'Impossible de supprimer la transaction.' }))
    }
  }

  const handleCategoryDeleted = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  const handleRecordTontineTx = (txData: {
    wallet_id: string
    amount: number
    type: 'expense' | 'income'
    note: string
  }) => {
    const newTx: Transaction = {
      id: `tontine-tx-${Date.now()}`,
      user_id: user?.id || 'demo',
      wallet_id: txData.wallet_id,
      category_id: categories.find((c) => c.name.toLowerCase().includes('tontine'))?.id || null,
      amount: txData.amount,
      type: txData.type,
      occurred_at: new Date().toISOString(),
      note: txData.note,
      transfer_group_id: null,
      source: 'manual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      wallet: wallets.find((w) => w.wallet_id === txData.wallet_id) as any,
    }

    setTransactions((prev) => [newTx, ...prev])

    // Met à jour le solde du portefeuille concerné
    setWallets((prev) =>
      prev.map((w) => {
        if (w.wallet_id === txData.wallet_id) {
          const delta = txData.type === 'income' ? txData.amount : -txData.amount
          return { ...w, balance: w.balance + delta }
        }
        return w
      })
    )
  }

  return (
    <div className="min-h-screen flex flex-col dark:bg-[#070b14] bg-gray-50 text-gray-900 dark:text-gray-100 transition-colors">
      {/* 1. Header Principal avec Navigation 4 Onglets + Admin */}
      <header className="sticky top-0 z-40 backdrop-blur-md border-b dark:border-white/10 border-gray-200 dark:bg-[#070b14]/90 bg-white/90">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="p-1.5 sm:p-2 rounded-xl border dark:border-white/10 border-gray-200 dark:text-gray-300 text-gray-700 hover:text-emerald-500 hover:border-emerald-500/40 transition cursor-pointer"
                title="Retour à l'accueil vitrine"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer"
              onClick={() => setCurrentTab('dashboard')}
              title="Tableau de bord"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-500 p-0.5 shadow-lg shadow-emerald-950/40 flex-shrink-0">
                <div className="w-full h-full dark:bg-[#0b0f19] bg-white rounded-[10px] flex items-center justify-center">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight dark:text-white text-gray-900">
                    MY-Wallet
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Onglets Principaux (Desktop & Tablette) - Filtrés selon les droits */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-900/90 p-1.5 rounded-2xl border dark:border-white/5 border-gray-200 shadow-inner">
            {visibleTabs.map((tab) => {
              const Icon = tab.lucideIcon
              const isActive = currentTab === tab.id
              const isAdminTab = tab.id === 'admin'
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center gap-1.5 lg:gap-2 py-2 px-2.5 lg:px-3.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-950/20'
                      : isAdminTab
                      ? 'dark:text-amber-400 text-amber-600 hover:bg-amber-500/10'
                      : 'dark:text-gray-300 text-gray-600 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t(tab.labelKey, { defaultValue: tab.defaultLabel })}</span>
                  {isAdminTab && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-500 font-black uppercase">
                      Admin
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Actions d'en-tête à droite */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Traduction & Thème sur grand écran */}
            <div className="hidden lg:flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>

            {/* Statut utilisateur */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full dark:bg-gray-900/80 bg-gray-100 border dark:border-white/5 border-gray-200 text-xs dark:text-gray-300 text-gray-700">
              {loading ? (
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                  {t('common.sync', { defaultValue: 'Sync...' })}
                </span>
              ) : (
                <>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]' : 'bg-amber-400 shadow-[0_0_8px_#F59E0B]'
                    }`}
                  />
                  {user ? (
                    <span className="truncate max-w-[110px]">{profile?.full_name || user.email}</span>
                  ) : (
                    <span className="text-amber-500 dark:text-amber-300 font-medium">{t('common.demoMode', { defaultValue: 'Mode Démo' })}</span>
                  )}
                </>
              )}
            </div>

            {/* Bouton Rapide Nouvelle Opération */}
            <button
              onClick={() => setIsTxOpen(true)}
              className="flex items-center gap-1.5 py-2 px-2.5 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition active:scale-95 shadow-md shadow-emerald-900/30 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">{t('appTransactions.newOperation', { defaultValue: 'Nouvelle Opération' })}</span>
            </button>

            {/* Bouton Connexion si non connecté */}
            {!user && (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="p-2 sm:p-2.5 rounded-xl dark:bg-gray-900/80 bg-gray-100 border dark:border-white/10 border-gray-200 dark:text-gray-300 text-gray-700 hover:text-emerald-500 transition cursor-pointer"
                title={t('nav.login')}
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}

            {/* Bouton de Déconnexion visible quand l'utilisateur est connecté */}
            {user && (
              <button
                type="button"
                onClick={async () => {
                  if (
                    window.confirm(
                      t('common.confirmLogout', {
                        defaultValue: 'Voulez-vous vraiment vous déconnecter de votre compte ?',
                      })
                    )
                  ) {
                    await signOut()
                    if (onBackToLanding) {
                      onBackToLanding()
                    } else {
                      window.location.hash = ''
                    }
                  }
                }}
                className="p-2 sm:p-2.5 rounded-xl dark:bg-rose-500/10 bg-rose-50 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 hover:border-rose-500/40 transition cursor-pointer flex items-center gap-1.5"
                title={t('common.logout', { defaultValue: 'Se déconnecter' })}
                aria-label={t('common.logout', { defaultValue: 'Se déconnecter' })}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline text-xs font-semibold">
                  {t('common.logout', { defaultValue: 'Déconnexion' })}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Contenu Dynamique de l'Onglet Actif */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 pb-24 md:pb-8">
        {/* Bandeau de période temporelle pour Tableau de bord */}
        {currentTab === 'dashboard' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:bg-gray-900/40 bg-white p-3 rounded-2xl border dark:border-white/5 border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span className="text-xs font-medium dark:text-gray-300 text-gray-700">{t('appDashboard.period', { defaultValue: 'Période' })} :</span>
              <div className="inline-flex rounded-xl dark:bg-gray-900 bg-gray-100 p-0.5 border dark:border-white/5 border-gray-200">
                {(['day', 'month', 'year'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      period === p
                        ? 'bg-emerald-500 text-gray-950 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {p === 'day' ? t('appDashboard.day', { defaultValue: 'Jour' }) : p === 'month' ? t('appDashboard.month', { defaultValue: 'Mois' }) : t('appDashboard.year', { defaultValue: 'Année' })}
                  </button>
                ))}
              </div>
            </div>

            {!user && (
              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-amber-600 dark:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="truncate">{t('appDashboard.demoActive', { defaultValue: 'Données démo actives. Connectez-vous pour vos vraies données.' })}</span>
                </span>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="font-bold underline text-amber-600 dark:text-amber-200 hover:opacity-80 ml-2 cursor-pointer flex-shrink-0"
                >
                  {t('nav.login', { defaultValue: 'Connexion' })}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ONGLET 1 : Tableau de bord */}
        {currentTab === 'dashboard' && (
          <DashboardOverview
            profile={profile}
            wallets={wallets}
            transactions={transactions}
            categories={categories}
            budgetProgress={budgetProgress}
            monthlyFlows={monthlyFlows}
            totalBalance={totalBalance}
            flows={flows}
            dailyRemaining={dailyRemaining}
            spendingCategories={spendingCategories}
            currency={currency}
            onOpenWalletModal={() => setIsWalletOpen(true)}
            onDeleteWallet={handleDeleteWallet}
            onOpenBudgetModal={() => setIsBudgetOpen(true)}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* ONGLET 2 : Transactions */}
        {currentTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            wallets={wallets}
            categories={categories}
            currency={currency}
            onOpenTxModal={() => setIsTxOpen(true)}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {/* ONGLET 3 : Tontines & Dettes */}
        {currentTab === 'tontines' && (
          <TontinesView
            user={user}
            wallets={wallets}
            currency={currency}
            onRecordTransaction={handleRecordTontineTx}
          />
        )}

        {/* ONGLET 4 : Paramètres */}
        {currentTab === 'settings' && (
          <SettingsView
            user={user}
            profile={profile}
            categories={categories}
            transactions={transactions}
            currency={currency}
            onProfileUpdated={loadData}
            onCategoryAdded={(cat) => setCategories((prev) => [...prev, cat])}
            onCategoryDeleted={handleCategoryDeleted}
            onCurrencyChange={(curr) => {
              if (profile) setProfile({ ...profile, currency: curr })
            }}
            onNavigateToAdmin={isAdmin ? () => setCurrentTab('admin') : undefined}
          />
        )}

        {/* ONGLET 5 : Administration Plateforme (Strictement réservé aux admins) */}
        {currentTab === 'admin' && isAdmin && <AdminView />}
      </main>

      {/* 3. Barre de Navigation Fixe sur Mobile (Bottom Navigation Bar) - Filtrée selon les droits */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-xl border-t dark:border-white/10 border-gray-200 px-2 py-2 flex items-center justify-around shadow-2xl safe-area-pb">
        {visibleTabs.map((tab) => {
          const Icon = tab.lucideIcon
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer relative ${
                isActive
                  ? 'text-emerald-500 font-extrabold'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition ${
                  isActive ? 'bg-emerald-500/15 text-emerald-500 scale-110' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {t(tab.mobileKey, { defaultValue: tab.defaultMobile })}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-500 absolute -bottom-0.5" />
              )}
            </button>
          )
        })}
      </nav>

      {/* 4. Modals Modulaires */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false)
          loadData()
        }}
      />

      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        onCreated={loadData}
      />

      <TransactionModal
        isOpen={isTxOpen}
        onClose={() => setIsTxOpen(false)}
        wallets={wallets}
        categories={categories}
        onSuccess={loadData}
      />

      <BudgetModal
        isOpen={isBudgetOpen}
        onClose={() => setIsBudgetOpen(false)}
        categories={categories}
        onSuccess={loadData}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        transactions={transactions}
        onProfileUpdated={() => {
          refreshProfile()
          loadData()
        }}
      />
    </div>
  )
}
