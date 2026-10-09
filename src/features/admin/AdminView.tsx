import React, { useState, useMemo } from 'react'
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
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDate } from '../../lib/formatters'
import type { UserPlan, UserRole, UserStatus, CurrencyCode } from '../../types/database'

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

const INITIAL_MOCK_USERS: AdminUserRecord[] = [
  {
    id: 'usr-1',
    full_name: 'Mamadou Diallo',
    email: 'mamadou.diallo@orange.ci',
    currency: 'XOF',
    plan: 'premium',
    role: 'user',
    status: 'active',
    wallets_count: 4,
    total_volume: 4850000,
    created_at: '2026-06-12T10:00:00Z',
  },
  {
    id: 'usr-2',
    full_name: 'Aminata Diop',
    email: 'aminata.diop@wave.sn',
    currency: 'XOF',
    plan: 'free',
    role: 'user',
    status: 'active',
    wallets_count: 2,
    total_volume: 1250000,
    created_at: '2026-07-20T14:30:00Z',
  },
  {
    id: 'usr-3',
    full_name: 'Koffi Mensah',
    email: 'koffi.mensah@ecobank.tg',
    currency: 'XOF',
    plan: 'premium',
    role: 'user',
    status: 'active',
    wallets_count: 5,
    total_volume: 8900000,
    created_at: '2026-08-01T09:15:00Z',
  },
  {
    id: 'usr-4',
    full_name: 'Fatou Bamba',
    email: 'fatou.bamba@gmail.com',
    currency: 'XOF',
    plan: 'free',
    role: 'user',
    status: 'suspended',
    wallets_count: 1,
    total_volume: 150000,
    created_at: '2026-08-15T11:45:00Z',
  },
  {
    id: 'usr-5',
    full_name: 'Alexandre Admin',
    email: 'admin@mywallet-africa.com',
    currency: 'XOF',
    plan: 'premium',
    role: 'admin',
    status: 'active',
    wallets_count: 6,
    total_volume: 12400000,
    created_at: '2026-05-01T08:00:00Z',
  },
]

const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'log-1',
    admin_email: 'admin@mywallet-africa.com',
    action: 'UPGRADE_PLAN',
    target_user: 'Koffi Mensah',
    details: 'Passage au Pass Pro Illimité suite à paiement Mobile Money Wave (1 500 FCFA)',
    created_at: '2026-10-08T18:20:00Z',
  },
  {
    id: 'log-2',
    admin_email: 'admin@mywallet-africa.com',
    action: 'SUSPEND_USER',
    target_user: 'Fatou Bamba',
    details: 'Compte suspendu pour tentative d’activité suspecte sur transferts multiples',
    created_at: '2026-10-07T12:00:00Z',
  },
  {
    id: 'log-3',
    admin_email: 'admin@mywallet-africa.com',
    action: 'POLICY_AUDIT',
    target_user: 'Système',
    details: 'Vérification de conformité RLS Postgres : Isolation multi-tenant 100% opérationnelle',
    created_at: '2026-10-06T09:30:00Z',
  },
]

export const AdminView: React.FC = () => {
  const { t } = useTranslation()
  const [users, setUsers] = useState<AdminUserRecord[]>(INITIAL_MOCK_USERS)
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(INITIAL_AUDIT_LOGS)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'premium'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all')
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users')

  // Statistiques plateforme
  const platformStats = useMemo(() => {
    const totalUsers = 1428
    const totalVolume = 284500000 // 284.5M FCFA
    const totalPremium = 382
    const totalWallets = 3190
    return {
      totalUsers,
      totalVolume,
      totalPremium,
      totalWallets,
    }
  }, [])

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

  // Actions Admin
  const handleToggleStatus = (userRecord: AdminUserRecord) => {
    const nextStatus: UserStatus = userRecord.status === 'active' ? 'suspended' : 'active'
    setUsers((prev) =>
      prev.map((u) => (u.id === userRecord.id ? { ...u, status: nextStatus } : u))
    )

    // Enregistre dans le journal d'audit
    const newLog: AuditLogRecord = {
      id: `log-${Date.now()}`,
      admin_email: 'admin@mywallet-africa.com',
      action: nextStatus === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
      target_user: userRecord.full_name,
      details: `Statut utilisateur modifié vers ${nextStatus.toUpperCase()}`,
      created_at: new Date().toISOString(),
    }
    setAuditLogs([newLog, ...auditLogs])
  }

  const handleTogglePlan = (userRecord: AdminUserRecord) => {
    const nextPlan: UserPlan = userRecord.plan === 'free' ? 'premium' : 'free'
    setUsers((prev) =>
      prev.map((u) => (u.id === userRecord.id ? { ...u, plan: nextPlan } : u))
    )

    const newLog: AuditLogRecord = {
      id: `log-${Date.now()}`,
      admin_email: 'admin@mywallet-africa.com',
      action: nextPlan === 'premium' ? 'UPGRADE_PLAN' : 'DOWNGRADE_PLAN',
      target_user: userRecord.full_name,
      details: `Formule SaaS modifiée vers ${nextPlan.toUpperCase()}`,
      created_at: new Date().toISOString(),
    }
    setAuditLogs([newLog, ...auditLogs])
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

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-500 dark:text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            Accès Super-Administrateur
          </span>
        </div>
      </div>

      {/* 2. KPIs Globaux de la Plateforme */}
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
          <p className="text-[11px] text-gray-400 mt-1">+24 inscriptions aujourd'hui</p>
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
          <p className="text-[11px] text-gray-400 mt-1">Wave, OM, MoMo & Banques</p>
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
            {platformStats.totalPremium} <span className="text-xs font-normal text-gray-400">(26.7%)</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">MRR : ~573 000 FCFA/mois</p>
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
          <p className="text-[11px] text-gray-400 mt-1">Moyenne : 2.2 comptes / user</p>
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
                <option value="all">Tous les plans</option>
                <option value="free">Gratuit</option>
                <option value="premium">Pass Pro</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="py-2 px-3 text-xs rounded-xl dark:bg-gray-900 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>
          </div>

          {/* Table Responsive des Utilisateurs */}
          <div className="glass-card rounded-2xl border dark:border-white/5 border-gray-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b dark:border-white/10 border-gray-200 dark:bg-gray-900/60 bg-gray-50 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">{t('appAdmin.userCol')}</th>
                  <th className="p-3.5">{t('appAdmin.planCol')}</th>
                  <th className="p-3.5">{t('appAdmin.roleCol')}</th>
                  <th className="p-3.5">Portefeuilles</th>
                  <th className="p-3.5">Volume Cumulé</th>
                  <th className="p-3.5">{t('appAdmin.statusCol')}</th>
                  <th className="p-3.5 text-right">{t('appAdmin.actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/5 divide-gray-100">
                {filteredUsers.map((u) => {
                  const isActive = u.status === 'active'
                  const isPro = u.plan === 'premium'

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
                        <span className="font-medium text-gray-400">{u.wallets_count} comptes</span>
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
                          {isActive ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePlan(u)}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold dark:bg-gray-800 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-200 text-gray-800 transition cursor-pointer"
                            title="Basculer la formule de souscription"
                          >
                            {isPro ? 'Basculer Free' : 'Mettre en Pro'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
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
          </div>
        </div>
      )}

      {/* 5. CONTENU ONGLET JOURNAL D'AUDIT */}
      {activeTab === 'logs' && (
        <div className="glass-card rounded-2xl border dark:border-white/5 border-gray-200 p-4 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b dark:border-white/10 border-gray-200 pb-3">
            <div>
              <h3 className="text-sm font-bold dark:text-white text-gray-900">
                Traçabilité des Opérations Administratives
              </h3>
              <p className="text-xs text-gray-400">
                Chaque action sensible (changement de plan, suspension) est consignée dans `admin_audit_log`.
              </p>
            </div>
            <span className="text-xs text-gray-400">{auditLogs.length} événements</span>
          </div>

          <div className="divide-y dark:divide-white/5 divide-gray-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3.5 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      {log.action}
                    </span>
                    <span className="text-xs font-bold dark:text-white text-gray-900">
                      Cible : {log.target_user}
                    </span>
                    <span className="text-[11px] text-gray-400">• par {log.admin_email}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-300">{log.details}</p>
                </div>
                <span className="text-[11px] text-gray-400 flex-shrink-0">
                  {formatDate(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
