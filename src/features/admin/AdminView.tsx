import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  ShieldAlert,
  Users,
  TrendingUp,
  CreditCard,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDate } from '../../lib/formatters'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import type { UserPlan, UserRole, UserStatus, CurrencyCode, Profile } from '../../types/database'

interface AdminUserRecord {
  id: string
  full_name: string
  email: string
  currency: CurrencyCode
  plan: UserPlan
  role: UserRole
  status: UserStatus
  wallets_count: number
  total_volume: number
  created_at: string
}

interface AuditLogRecord {
  id: string
  admin_email: string
  action: string
  target_user: string
  details: string
  created_at: string
}

export const AdminView: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'premium'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all')
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  // Chargement des données réelles depuis Supabase
  const loadRealAdminData = useCallback(async () => {
    setLoading(true)
    try {
      if (user) {
        // 1. Récupération des profils réels
        const { data: profilesData, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (profErr) {
          console.warn('[AdminView] Erreur lecture profils:', profErr)
        }

        // 2. Récupération des portefeuilles et transactions pour les métriques
        const [walletsRes, txRes, logsRes] = await Promise.allSettled([
          supabase.from('wallets').select('id, user_id').is('deleted_at', null),
          supabase.from('transactions').select('id, user_id, amount').is('deleted_at', null),
          supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(50),
        ])

        const allWallets = walletsRes.status === 'fulfilled' ? walletsRes.value.data || [] : []
        const allTransactions = txRes.status === 'fulfilled' ? txRes.value.data || [] : []
        const allLogs = logsRes.status === 'fulfilled' ? logsRes.value.data || [] : []

        // Construction de la liste des utilisateurs réels
        const rawProfiles: Profile[] = (profilesData as Profile[]) || []
        
        // Si aucun profil retourné mais utilisateur connecté (admin), on s'assure qu'au moins l'admin est présent
        const profilesList: Profile[] = rawProfiles.length > 0 ? rawProfiles : [
          {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Super Admin',
            currency: 'XOF',
            pay_day: 1,
            plan: 'premium',
            role: 'admin',
            status: 'active',
            created_at: user.created_at || new Date().toISOString(),
            updated_at: user.created_at || new Date().toISOString(),
          }
        ]

        const mappedUsers: AdminUserRecord[] = profilesList.map((p) => {
          const userWallets = allWallets.filter((w) => w.user_id === p.id)
          const userTxs = allTransactions.filter((tx) => tx.user_id === p.id)
          const userVolume = userTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)

          const email =
            p.id === user.id
              ? user.email || 'admin@mywallet.app'
              : (p as any).email || `${(p.full_name || 'user').toLowerCase().replace(/\s+/g, '.') || 'utilisateur'}@compte.app`

          return {
            id: p.id,
            full_name: p.full_name || (p.id === user.id ? 'Administrateur' : 'Utilisateur'),
            email,
            currency: p.currency || 'XOF',
            plan: p.plan || 'free',
            role: p.role || 'user',
            status: p.status || 'active',
            wallets_count: userWallets.length,
            total_volume: userVolume,
            created_at: p.created_at || new Date().toISOString(),
          }
        })

        setUsers(mappedUsers)

        // Traitement du journal d'audit réel
        if (allLogs.length > 0) {
          setAuditLogs(
            allLogs.map((log: any) => ({
              id: String(log.id),
              admin_email: user.email || 'admin@mywallet.app',
              action: log.action || 'ACTION',
              target_user: log.target_user_id || 'Utilisateur',
              details:
                typeof log.details === 'string'
                  ? log.details
                  : JSON.stringify(log.details || ''),
              created_at: log.created_at || new Date().toISOString(),
            }))
          )
        } else {
          setAuditLogs([])
        }
      } else {
        // Hors connexion : aucune fausse donnée
        setUsers([])
        setAuditLogs([])
      }
    } catch (err) {
      console.error('[AdminView] Erreur chargement admin:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadRealAdminData()
  }, [loadRealAdminData])

  // Statistiques plateforme calculées dynamiquement sur les données réelles
  const platformStats = useMemo(() => {
    const totalUsers = users.length
    const totalVolume = users.reduce((acc, u) => acc + (u.total_volume || 0), 0)
    const totalPremium = users.filter((u) => u.plan === 'premium').length
    const totalWallets = users.reduce((acc, u) => acc + (u.wallets_count || 0), 0)
    return {
      totalUsers,
      totalVolume,
      totalPremium,
      totalWallets,
    }
  }, [users])

  // Filtrage des utilisateurs
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = u.full_name.toLowerCase().includes(q)
        const matchEmail = u.email.toLowerCase().includes(q)
        if (!matchName && !matchEmail) return false
      }
      if (filterPlan !== 'all' && u.plan !== filterPlan) return false
      if (filterStatus !== 'all' && u.status !== filterStatus) return false
      return true
    })
  }, [users, search, filterPlan, filterStatus])

  // Actions Admin réelles (connectées à Supabase)
  const handleToggleStatus = async (userRecord: AdminUserRecord) => {
    const nextStatus: UserStatus = userRecord.status === 'active' ? 'suspended' : 'active'
    setActionLoadingId(userRecord.id)
    
    // Mise à jour optimiste
    setUsers((prev) =>
      prev.map((u) => (u.id === userRecord.id ? { ...u, status: nextStatus } : u))
    )

    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', userRecord.id)

        if (error) {
          console.error('[AdminView] Erreur mise à jour statut:', error)
        }

        // Enregistre dans admin_audit_log
        try {
          await supabase
            .from('admin_audit_log')
            .insert({
              admin_id: user.id,
              action: nextStatus === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
              target_user_id: userRecord.id,
              details: { target: userRecord.full_name, new_status: nextStatus },
            })
        } catch {
          // Table optionnelle selon la migration
        }
      }

      // Ajout au journal d'audit local
      const newLog: AuditLogRecord = {
        id: `log-${Date.now()}`,
        admin_email: user?.email || 'admin@mywallet.app',
        action: nextStatus === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
        target_user: userRecord.full_name,
        details: `Statut utilisateur modifié vers ${nextStatus.toUpperCase()}`,
        created_at: new Date().toISOString(),
      }
      setAuditLogs((prev) => [newLog, ...prev])
    } catch (err) {
      console.error('[AdminView] Erreur action statut:', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleTogglePlan = async (userRecord: AdminUserRecord) => {
    const nextPlan: UserPlan = userRecord.plan === 'free' ? 'premium' : 'free'
    setActionLoadingId(userRecord.id)

    // Mise à jour optimiste
    setUsers((prev) =>
      prev.map((u) => (u.id === userRecord.id ? { ...u, plan: nextPlan } : u))
    )

    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ plan: nextPlan, updated_at: new Date().toISOString() })
          .eq('id', userRecord.id)

        if (error) {
          console.error('[AdminView] Erreur mise à jour formule:', error)
        }

        // Enregistre dans admin_audit_log
        try {
          await supabase
            .from('admin_audit_log')
            .insert({
              admin_id: user.id,
              action: nextPlan === 'premium' ? 'UPGRADE_PLAN' : 'DOWNGRADE_PLAN',
              target_user_id: userRecord.id,
              details: { target: userRecord.full_name, new_plan: nextPlan },
            })
        } catch {
          // Table optionnelle selon la migration
        }
      }

      const newLog: AuditLogRecord = {
        id: `log-${Date.now()}`,
        admin_email: user?.email || 'admin@mywallet.app',
        action: nextPlan === 'premium' ? 'UPGRADE_PLAN' : 'DOWNGRADE_PLAN',
        target_user: userRecord.full_name,
        details: `Formule SaaS modifiée vers ${nextPlan.toUpperCase()}`,
        created_at: new Date().toISOString(),
      }
      setAuditLogs((prev) => [newLog, ...prev])
    } catch (err) {
      console.error('[AdminView] Erreur action plan:', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. En-tête Administration */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-4 sm:p-6 rounded-2xl border border-rose-500/20 dark:bg-rose-950/10 bg-rose-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/15 text-rose-500 dark:text-rose-400 font-bold">
              🛡️
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold dark:text-white text-gray-900 tracking-tight">
              {t('appAdmin.title')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('appAdmin.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadRealAdminData}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold dark:bg-gray-800 bg-white hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-white/10 border-gray-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('appAdmin.refresh')}</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-500 dark:text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            {t('appAdmin.superAdmin')}
          </span>
        </div>
      </div>

      {/* 2. KPIs Globaux de la Plateforme (Données Réelles) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Utilisateurs */}
        <div className="glass-card card-hover-effect p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-emerald-500 uppercase">
              {t('appAdmin.totalUsers')}
            </span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black dark:text-white text-gray-900">
            {platformStats.totalUsers.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {platformStats.totalUsers <= 1 ? t('appAdmin.activeUserCount') : t('appAdmin.activeUsersCount')}
          </p>
        </div>

        {/* Volume Global Transigé */}
        <div className="glass-card card-hover-effect p-4 rounded-2xl border border-sky-500/20 bg-sky-500/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-sky-500 uppercase">
              {t('appAdmin.activeVolume')}
            </span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black dark:text-white text-gray-900">
            {formatCurrency(platformStats.totalVolume, 'XOF')}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{t('appAdmin.realFlows')}</p>
        </div>

        {/* Abonnements Premium */}
        <div className="glass-card card-hover-effect p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-amber-500 uppercase">
              {t('appAdmin.premiumSubscriptions')}
            </span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-500">
            {platformStats.totalPremium}{' '}
            <span className="text-xs font-normal text-gray-400">
              ({platformStats.totalUsers > 0 ? Math.round((platformStats.totalPremium / platformStats.totalUsers) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {t('appAdmin.mrrMonth', { amount: formatCurrency(platformStats.totalPremium * 1500, 'XOF') })}
          </p>
        </div>

        {/* Portefeuilles Créés */}
        <div className="glass-card card-hover-effect p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-purple-500 uppercase">
              {t('appAdmin.totalWallets')}
            </span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black dark:text-white text-gray-900">
            {platformStats.totalWallets.toLocaleString()}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {platformStats.totalUsers > 0
              ? `${(platformStats.totalWallets / platformStats.totalUsers).toFixed(1)} ${t('appAdmin.accountsPerUser')}`
              : t('appAdmin.zeroAccounts')}
          </p>
        </div>
      </div>

      {/* 3. Onglets Internes : Gestion Utilisateurs vs Journal d'Audit */}
      <div className="flex items-center gap-2 border-b dark:border-white/10 border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'users'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-950/20'
              : 'dark:text-gray-300 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('appAdmin.usersManagement')} ({filteredUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-950/20'
              : 'dark:text-gray-300 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t('appAdmin.auditLog')} ({auditLogs.length})</span>
        </button>
      </div>

      {/* 4. CONTENU ONGLET UTILISATEURS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Barre de filtres de la table utilisateurs */}
          <div className="glass-card p-3.5 rounded-2xl border dark:border-white/5 border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={t('appAdmin.filterUsers')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value as any)}
                className="py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white cursor-pointer"
              >
                <option value="all">{t('appAdmin.allPlans')}</option>
                <option value="free">{t('appAdmin.freePlan')}</option>
                <option value="premium">{t('appAdmin.proPlan')}</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white cursor-pointer"
              >
                <option value="all">{t('appAdmin.allStatuses')}</option>
                <option value="active">{t('appAdmin.activeStatus')}</option>
                <option value="suspended">{t('appAdmin.suspendedStatus')}</option>
              </select>
            </div>
          </div>

          {/* Table Responsive des Utilisateurs */}
          <div className="glass-card rounded-2xl border dark:border-white/5 border-gray-200 overflow-x-auto shadow-sm">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
                <p className="text-xs text-gray-400">{t('appAdmin.loadingRealUsers')}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs">
                {t('appAdmin.noFilteredUsers')}
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b dark:border-white/10 border-gray-200 dark:bg-gray-900/60 bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wider">
                    <th className="p-3.5">{t('appAdmin.userCol')}</th>
                    <th className="p-3.5">{t('appAdmin.planCol')}</th>
                    <th className="p-3.5">{t('appAdmin.roleCol')}</th>
                    <th className="p-3.5">{t('appDashboard.dedicatedWallets')}</th>
                    <th className="p-3.5">{t('appAdmin.activeVolume')}</th>
                    <th className="p-3.5">{t('appAdmin.statusCol')}</th>
                    <th className="p-3.5 text-right">{t('appAdmin.actionsCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/5 divide-gray-100">
                  {filteredUsers.map((u) => {
                    const isActive = u.status === 'active'
                    const isPro = u.plan === 'premium'
                    const isUpdating = actionLoadingId === u.id

                    return (
                      <tr key={u.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center text-xs">
                              {u.full_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold dark:text-white text-gray-900 block">
                                {u.full_name}
                              </span>
                              <span className="text-[11px] text-gray-400">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              isPro
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                            }`}
                          >
                            {isPro ? 'PRO ⚡' : 'FREE'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="capitalize font-semibold dark:text-gray-300 text-gray-700">
                            {u.role}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="font-medium text-gray-400">{u.wallets_count} {t('appTontines.members', { defaultValue: 'comptes' })}</span>
                        </td>

                        <td className="p-3.5 font-bold dark:text-white text-gray-900">
                          {formatCurrency(u.total_volume, u.currency)}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {isActive ? t('appAdmin.activeStatus') : t('appAdmin.suspendedStatus')}
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleTogglePlan(u)}
                              disabled={isUpdating}
                              className="px-2 py-1 rounded-lg text-[11px] font-semibold dark:bg-gray-800 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-200 text-gray-800 transition cursor-pointer disabled:opacity-50"
                              title="Toggle subscription plan"
                            >
                              {isPro ? t('appAdmin.downgradeToFree') : t('appAdmin.upgradeToPro')}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              disabled={isUpdating}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 ${
                                isActive
                                  ? 'text-rose-500 hover:bg-rose-500/10'
                                  : 'text-emerald-500 hover:bg-emerald-500/10'
                              }`}
                            >
                              {isActive ? t('appAdmin.suspend') : t('appAdmin.activate')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 5. CONTENU ONGLET JOURNAL D'AUDIT */}
      {activeTab === 'logs' && (
        <div className="glass-card rounded-2xl border dark:border-white/5 border-gray-200 p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b dark:border-white/10 border-gray-200 pb-3">
            <div>
              <h3 className="text-sm font-bold dark:text-white text-gray-900">
                {t('appAdmin.auditLog')}
              </h3>
              <p className="text-xs text-gray-400">
                {t('appAdmin.auditAuditDesc')}
              </p>
            </div>
            <span className="text-xs text-gray-400">{auditLogs.length} {t('appAdmin.eventsCount')}</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              {t('appAdmin.noAuditLogs')}
            </div>
          ) : (
            <div className="divide-y dark:divide-white/5 divide-gray-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        {log.action}
                      </span>
                      <span className="text-xs font-bold dark:text-white text-gray-900">
                        {t('appAdmin.targetUser')} {log.target_user}
                      </span>
                      <span className="text-[11px] text-gray-400">• {t('appAdmin.byAdmin')} {log.admin_email}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-300">{log.details}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
