import type { Transaction } from '../types/database'

export type ComparisonGranularity = 'week' | 'month' | 'year'

export interface PeriodSummary {
  label: string
  key: string
  income: number
  expense: number
  net: number
  savingsRate: number
  txCount: number
}

export interface GranularComparisonResult {
  granularity: ComparisonGranularity
  selectedYear: number
  selectedMonth: number // 0-11
  currentPeriod: PeriodSummary
  previousPeriod: PeriodSummary
  diff: {
    income: number
    incomePercent: number | null
    expense: number
    expensePercent: number | null
    net: number
  }
  chartData: PeriodSummary[]
}

/**
 * Retourne le numéro de semaine ISO (1-53) et l'année pour une date donnée
 */
export function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { week: weekNo, year: d.getUTCFullYear() }
}

/**
 * Calcule la comparaison granulaire selon la granularité demandée (semaine, mois, année)
 */
export function computeGranularComparison(
  transactions: Transaction[],
  granularity: ComparisonGranularity,
  selectedYear: number,
  selectedMonth: number, // 0 - 11
  locale: string = 'fr'
): GranularComparisonResult {
  const isEn = locale.startsWith('en')

  // Filtrer les transactions valides (non supprimées)
  const validTx = transactions.filter((t) => !t.deleted_at)

  if (granularity === 'year') {
    // 1. COMPARATIF ANNUEL
    // Collecte des années disponibles
    const yearsSet = new Set<number>()
    validTx.forEach((tx) => {
      const y = new Date(tx.occurred_at).getFullYear()
      if (!isNaN(y)) yearsSet.add(y)
    })
    yearsSet.add(selectedYear)
    yearsSet.add(selectedYear - 1)

    const sortedYears = Array.from(yearsSet).sort((a, b) => a - b)
    // Ne garder que les dernières années jusqu'à selectedYear (ex: 4-5 ans max)
    const targetYears = sortedYears.filter((y) => y <= selectedYear).slice(-5)
    if (!targetYears.includes(selectedYear)) targetYears.push(selectedYear)

    const chartData: PeriodSummary[] = targetYears.map((y) => {
      let income = 0
      let expense = 0
      let txCount = 0

      validTx.forEach((tx) => {
        const d = new Date(tx.occurred_at)
        if (d.getFullYear() === y) {
          if (tx.type === 'income') income += tx.amount
          if (tx.type === 'expense') expense += tx.amount
          txCount++
        }
      })

      const net = income - expense
      const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0

      return {
        label: `${y}`,
        key: `${y}`,
        income,
        expense,
        net,
        savingsRate,
        txCount,
      }
    })

    const currentPeriod = chartData.find((p) => p.key === `${selectedYear}`) || {
      label: `${selectedYear}`,
      key: `${selectedYear}`,
      income: 0,
      expense: 0,
      net: 0,
      savingsRate: 0,
      txCount: 0,
    }

    const prevYearKey = `${selectedYear - 1}`
    let previousPeriod = chartData.find((p) => p.key === prevYearKey)
    if (!previousPeriod) {
      let prevInc = 0
      let prevExp = 0
      let prevCount = 0
      validTx.forEach((tx) => {
        const d = new Date(tx.occurred_at)
        if (d.getFullYear() === selectedYear - 1) {
          if (tx.type === 'income') prevInc += tx.amount
          if (tx.type === 'expense') prevExp += tx.amount
          prevCount++
        }
      })
      previousPeriod = {
        label: `${selectedYear - 1}`,
        key: prevYearKey,
        income: prevInc,
        expense: prevExp,
        net: prevInc - prevExp,
        savingsRate: prevInc > 0 ? Math.round(((prevInc - prevExp) / prevInc) * 100) : 0,
        txCount: prevCount,
      }
    }

    const diffIncome = currentPeriod.income - previousPeriod.income
    const diffExpense = currentPeriod.expense - previousPeriod.expense
    const incomePercent =
      previousPeriod.income > 0
        ? Math.round((diffIncome / previousPeriod.income) * 100)
        : currentPeriod.income > 0
        ? 100
        : 0
    const expensePercent =
      previousPeriod.expense > 0
        ? Math.round((diffExpense / previousPeriod.expense) * 100)
        : currentPeriod.expense > 0
        ? 100
        : 0

    return {
      granularity: 'year',
      selectedYear,
      selectedMonth,
      currentPeriod,
      previousPeriod,
      diff: {
        income: diffIncome,
        incomePercent,
        expense: diffExpense,
        expensePercent,
        net: currentPeriod.net - previousPeriod.net,
      },
      chartData,
    }
  }

  if (granularity === 'month') {
    // 2. COMPARATIF MENSUEL : 12 MOIS DE L'ANNÉE SÉLECTIONNÉE
    const monthNamesFr = [
      'Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
    ]
    const monthNamesEn = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]
    const names = isEn ? monthNamesEn : monthNamesFr

    const chartData: PeriodSummary[] = Array.from({ length: 12 }, (_, m) => {
      let income = 0
      let expense = 0
      let txCount = 0

      validTx.forEach((tx) => {
        const d = new Date(tx.occurred_at)
        if (d.getFullYear() === selectedYear && d.getMonth() === m) {
          if (tx.type === 'income') income += tx.amount
          if (tx.type === 'expense') expense += tx.amount
          txCount++
        }
      })

      const net = income - expense
      const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0

      return {
        label: names[m],
        key: `${selectedYear}-${String(m + 1).padStart(2, '0')}`,
        income,
        expense,
        net,
        savingsRate,
        txCount,
      }
    })

    const currentPeriod = chartData[selectedMonth]

    // Mois précédent : si selectedMonth === 0, c'est décembre de l'année précédente
    let previousPeriod: PeriodSummary
    if (selectedMonth > 0) {
      previousPeriod = chartData[selectedMonth - 1]
    } else {
      let prevInc = 0
      let prevExp = 0
      let prevCount = 0
      validTx.forEach((tx) => {
        const d = new Date(tx.occurred_at)
        if (d.getFullYear() === selectedYear - 1 && d.getMonth() === 11) {
          if (tx.type === 'income') prevInc += tx.amount
          if (tx.type === 'expense') prevExp += tx.amount
          prevCount++
        }
      })
      previousPeriod = {
        label: `${names[11]} ${selectedYear - 1}`,
        key: `${selectedYear - 1}-12`,
        income: prevInc,
        expense: prevExp,
        net: prevInc - prevExp,
        savingsRate: prevInc > 0 ? Math.round(((prevInc - prevExp) / prevInc) * 100) : 0,
        txCount: prevCount,
      }
    }

    const diffIncome = currentPeriod.income - previousPeriod.income
    const diffExpense = currentPeriod.expense - previousPeriod.expense
    const incomePercent =
      previousPeriod.income > 0
        ? Math.round((diffIncome / previousPeriod.income) * 100)
        : currentPeriod.income > 0
        ? 100
        : 0
    const expensePercent =
      previousPeriod.expense > 0
        ? Math.round((diffExpense / previousPeriod.expense) * 100)
        : currentPeriod.expense > 0
        ? 100
        : 0

    return {
      granularity: 'month',
      selectedYear,
      selectedMonth,
      currentPeriod,
      previousPeriod,
      diff: {
        income: diffIncome,
        incomePercent,
        expense: diffExpense,
        expensePercent,
        net: currentPeriod.net - previousPeriod.net,
      },
      chartData,
    }
  }

  // 3. COMPARATIF PAR SEMAINE (Découpage en semaines du mois sélectionné)
  // Déterminer le nombre de jours dans le mois
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  
  // Découpage en tranches de 4 à 5 semaines (ex: S1: 1-7, S2: 8-14, S3: 15-21, S4: 22-28, S5: 29-fin)
  const weekSlices = [
    { start: 1, end: 7, label: isEn ? 'Week 1' : 'Semaine 1', short: 'S1' },
    { start: 8, end: 14, label: isEn ? 'Week 2' : 'Semaine 2', short: 'S2' },
    { start: 15, end: 21, label: isEn ? 'Week 3' : 'Semaine 3', short: 'S3' },
    { start: 22, end: 28, label: isEn ? 'Week 4' : 'Semaine 4', short: 'S4' },
  ]
  if (daysInMonth > 28) {
    weekSlices.push({
      start: 29,
      end: daysInMonth,
      label: isEn ? 'Week 5' : 'Semaine 5',
      short: 'S5',
    })
  }

  const chartData: PeriodSummary[] = weekSlices.map((slice) => {
    let income = 0
    let expense = 0
    let txCount = 0

    validTx.forEach((tx) => {
      const d = new Date(tx.occurred_at)
      if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
        const day = d.getDate()
        if (day >= slice.start && day <= slice.end) {
          if (tx.type === 'income') income += tx.amount
          if (tx.type === 'expense') expense += tx.amount
          txCount++
        }
      }
    })

    const net = income - expense
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0

    return {
      label: `${slice.short} (${slice.start}-${slice.end})`,
      key: slice.short,
      income,
      expense,
      net,
      savingsRate,
      txCount,
    }
  })

  // Identifier la semaine courante (si même année et même mois)
  const now = new Date()
  let currentWeekIndex = 0
  if (now.getFullYear() === selectedYear && now.getMonth() === selectedMonth) {
    const currentDay = now.getDate()
    currentWeekIndex = weekSlices.findIndex(
      (s) => currentDay >= s.start && currentDay <= s.end
    )
    if (currentWeekIndex === -1) currentWeekIndex = chartData.length - 1
  } else {
    // Si on regarde un mois passé, comparer la dernière semaine avec l'avant-dernière
    currentWeekIndex = chartData.length - 1
  }

  const currentPeriod = chartData[currentWeekIndex]
  const previousPeriod =
    currentWeekIndex > 0 ? chartData[currentWeekIndex - 1] : chartData[0]

  const diffIncome = currentPeriod.income - previousPeriod.income
  const diffExpense = currentPeriod.expense - previousPeriod.expense
  const incomePercent =
    previousPeriod.income > 0
      ? Math.round((diffIncome / previousPeriod.income) * 100)
      : currentPeriod.income > 0
      ? 100
      : 0
  const expensePercent =
    previousPeriod.expense > 0
      ? Math.round((diffExpense / previousPeriod.expense) * 100)
      : currentPeriod.expense > 0
      ? 100
      : 0

  return {
    granularity: 'week',
    selectedYear,
    selectedMonth,
    currentPeriod,
    previousPeriod,
    diff: {
      income: diffIncome,
      incomePercent,
      expense: diffExpense,
      expensePercent,
      net: currentPeriod.net - previousPeriod.net,
    },
    chartData,
  }
}
