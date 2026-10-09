import type { Transaction } from '../types/database'

/**
 * Calcul pur du solde total à partir d'une liste de transactions
 */
export function computeBalance(transactions: Transaction[]): number {
  return transactions.reduce((acc, tx) => {
    if (tx.deleted_at) return acc
    switch (tx.type) {
      case 'income':
      case 'opening':
      case 'transfer_in':
        return acc + tx.amount
      case 'expense':
      case 'transfer_out':
        return acc - tx.amount
      default:
        return acc
    }
  }, 0)
}

/**
 * Calcul pur des flux d'entrées et de sorties
 * (exclut les soldes d'ouverture et transferts internes)
 */
export function computeFlows(transactions: Transaction[]): {
  income: number
  expense: number
  net: number
  savingsRate: number
} {
  let income = 0
  let expense = 0

  for (const tx of transactions) {
    if (tx.deleted_at) continue
    if (tx.type === 'income') {
      income += tx.amount
    } else if (tx.type === 'expense') {
      expense += tx.amount
    }
  }

  const net = income - expense
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0

  return { income, expense, net, savingsRate }
}

/**
 * Regroupe les dépenses par catégorie
 */
export function groupByCategory(
  transactions: Transaction[],
  categoriesMap?: Record<string, string>
): { categoryId: string; name: string; total: number; percentage: number }[] {
  const totals: Record<string, { name: string; total: number }> = {}
  let totalExpenses = 0

  for (const tx of transactions) {
    if (tx.deleted_at || tx.type !== 'expense') continue
    const catId = tx.category_id || 'uncategorized'
    const catName =
      (categoriesMap && categoriesMap[catId]) ||
      tx.category?.name ||
      'Sans catégorie'

    if (!totals[catId]) {
      totals[catId] = { name: catName, total: 0 }
    }
    totals[catId].total += tx.amount
    totalExpenses += tx.amount
  }

  return Object.entries(totals)
    .map(([categoryId, data]) => ({
      categoryId,
      name: data.name,
      total: data.total,
      percentage: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

/**
 * Calcule le "Reste à vivre quotidien"
 * (Budget ou solde restant - charges fixes à venir) / Jours restants jusqu'au jour de paie
 */
export function calculateDailyRemaining(
  currentBalance: number,
  upcomingFixedCharges = 0,
  payDay = 1,
  referenceDate = new Date()
): { dailyRemaining: number; daysRemaining: number } {
  const currentDay = referenceDate.getDate()
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()

  let nextPayDate: Date
  if (currentDay < payDay) {
    nextPayDate = new Date(year, month, payDay)
  } else {
    nextPayDate = new Date(year, month + 1, payDay)
  }

  const diffTime = nextPayDate.getTime() - referenceDate.getTime()
  const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  const disposable = Math.max(0, currentBalance - upcomingFixedCharges)
  const dailyRemaining = Math.round(disposable / daysRemaining)

  return { dailyRemaining, daysRemaining }
}

export * from './comparison'
