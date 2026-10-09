import type { Tontine, Debt } from '../types/database'

const DEMO_TONTINES: Tontine[] = [
  {
    id: 'tontine-1',
    user_id: 'demo',
    name: 'Tontine des Cadres & Collègues',
    contribution_amount: 50000,
    frequency: 'monthly',
    members_count: 10,
    my_turn_month: 'Novembre 2026',
    total_pool: 500000,
    contributed_so_far: 200000,
    next_due_date: '2026-11-05',
    status: 'active',
    wallet_id: 'w-wave',
    created_at: '2026-07-01T10:00:00Z',
  },
  {
    id: 'tontine-2',
    user_id: 'demo',
    name: 'Tontine Familiale Mutuelle',
    contribution_amount: 25000,
    frequency: 'monthly',
    members_count: 8,
    my_turn_month: 'Janvier 2027',
    total_pool: 200000,
    contributed_so_far: 75000,
    next_due_date: '2026-11-10',
    status: 'active',
    wallet_id: 'w-om',
    created_at: '2026-08-01T10:00:00Z',
  },
]

const DEMO_DEBTS: Debt[] = [
  {
    id: 'debt-1',
    user_id: 'demo',
    type: 'lent',
    person_name: 'Moussa Traoré (Cousin)',
    amount: 35000,
    paid_amount: 10000,
    due_date: '2026-11-15',
    note: 'Dépannage urgence transport & ordonnance',
    status: 'pending',
    wallet_id: 'w-wave',
    created_at: '2026-10-01T14:30:00Z',
  },
  {
    id: 'debt-2',
    user_id: 'demo',
    type: 'lent',
    person_name: 'Awa Diop (Collègue)',
    amount: 20000,
    paid_amount: 0,
    due_date: '2026-10-30',
    note: 'Avance déjeuner et courses bureau',
    status: 'pending',
    wallet_id: 'w-om',
    created_at: '2026-10-04T12:00:00Z',
  },
  {
    id: 'debt-3',
    user_id: 'demo',
    type: 'borrowed',
    person_name: 'Koffi Mensah (Frère)',
    amount: 50000,
    paid_amount: 0,
    due_date: '2026-11-28',
    note: 'Prêt participation achat équipement',
    status: 'pending',
    wallet_id: 'w-bank',
    created_at: '2026-09-20T16:00:00Z',
  },
  {
    id: 'debt-4',
    user_id: 'demo',
    type: 'lent',
    person_name: 'Ibrahim Koné',
    amount: 15000,
    paid_amount: 15000,
    due_date: '2026-09-30',
    note: 'Remboursement carburant week-end',
    status: 'settled',
    wallet_id: 'w-cash',
    created_at: '2026-09-15T09:00:00Z',
  },
]

export const tontinesAndDebtsApi = {
  getTontines(userId: string | null): Tontine[] {
    const isRealUser = Boolean(userId && userId !== 'demo')
    const key = `mywallet_tontines_${userId || 'demo'}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Nettoyer si un compte réel a reçu les données de démonstration
        if (isRealUser && Array.isArray(parsed) && parsed.some((t: any) => t.id === 'tontine-1' || t.user_id === 'demo')) {
          localStorage.setItem(key, JSON.stringify([]))
          return []
        }
        return parsed
      } catch {
        // fallback
      }
    }
    // Pour un utilisateur réel connecté, la liste commence strictement vide
    if (isRealUser) {
      localStorage.setItem(key, JSON.stringify([]))
      return []
    }
    localStorage.setItem(key, JSON.stringify(DEMO_TONTINES))
    return DEMO_TONTINES
  },

  saveTontines(userId: string | null, tontines: Tontine[]): void {
    const key = `mywallet_tontines_${userId || 'demo'}`
    localStorage.setItem(key, JSON.stringify(tontines))
  },

  addTontine(userId: string | null, newTontine: Omit<Tontine, 'id' | 'created_at'>): Tontine {
    const list = this.getTontines(userId)
    const created: Tontine = {
      ...newTontine,
      id: `tontine-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    const updated = [created, ...list]
    this.saveTontines(userId, updated)
    return created
  },

  contributeTontine(userId: string | null, tontineId: string, amount: number): Tontine | null {
    const list = this.getTontines(userId)
    let modified: Tontine | null = null
    const updated = list.map((t) => {
      if (t.id === tontineId) {
        const nextContributed = t.contributed_so_far + amount
        modified = {
          ...t,
          contributed_so_far: nextContributed,
        }
        return modified
      }
      return t
    })
    this.saveTontines(userId, updated)
    return modified
  },

  deleteTontine(userId: string | null, tontineId: string): void {
    const list = this.getTontines(userId)
    const updated = list.filter((t) => t.id !== tontineId)
    this.saveTontines(userId, updated)
  },

  getDebts(userId: string | null): Debt[] {
    const isRealUser = Boolean(userId && userId !== 'demo')
    const key = `mywallet_debts_${userId || 'demo'}`
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Nettoyer si un compte réel a reçu les données de démonstration
        if (isRealUser && Array.isArray(parsed) && parsed.some((d: any) => d.id === 'debt-1' || d.user_id === 'demo')) {
          localStorage.setItem(key, JSON.stringify([]))
          return []
        }
        return parsed
      } catch {
        // fallback
      }
    }
    // Pour un utilisateur réel connecté, la liste commence strictement vide
    if (isRealUser) {
      localStorage.setItem(key, JSON.stringify([]))
      return []
    }
    localStorage.setItem(key, JSON.stringify(DEMO_DEBTS))
    return DEMO_DEBTS
  },

  saveDebts(userId: string | null, debts: Debt[]): void {
    const key = `mywallet_debts_${userId || 'demo'}`
    localStorage.setItem(key, JSON.stringify(debts))
  },

  addDebt(userId: string | null, newDebt: Omit<Debt, 'id' | 'created_at'>): Debt {
    const list = this.getDebts(userId)
    const created: Debt = {
      ...newDebt,
      id: `debt-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    const updated = [created, ...list]
    this.saveDebts(userId, updated)
    return created
  },

  settleDebt(userId: string | null, debtId: string): Debt | null {
    const list = this.getDebts(userId)
    let modified: Debt | null = null
    const updated = list.map((d) => {
      if (d.id === debtId) {
        modified = {
          ...d,
          paid_amount: d.amount,
          status: 'settled',
        }
        return modified
      }
      return d
    })
    this.saveDebts(userId, updated)
    return modified
  },

  deleteDebt(userId: string | null, debtId: string): void {
    const list = this.getDebts(userId)
    const updated = list.filter((d) => d.id !== debtId)
    this.saveDebts(userId, updated)
  },
}
