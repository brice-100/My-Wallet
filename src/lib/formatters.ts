import type { CurrencyCode, WalletType } from '../types/database'

/**
 * Formate un montant en devise africaine (ex: 250 000 FCFA)
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'XOF'): string {
  const formattedNumber = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount)

  const symbols: Record<CurrencyCode, string> = {
    XOF: 'FCFA',
    XAF: 'FCFA',
    GNF: 'GNF',
    CDF: 'CDF',
    MAD: 'MAD',
    DZD: 'DZD',
    TND: 'TND',
    NGN: '₦',
    GHS: 'GH₵',
    KES: 'KSh',
    EUR: '€',
    USD: '$',
  }

  const symbol = symbols[currency] || currency
  return `${formattedNumber} ${symbol}`
}

/**
 * Formate une date au format lisible français (ex: 8 oct. 2026)
 */
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return dateString
  }
}

/**
 * Retourne le style visuel et badge selon le type/opérateur de portefeuille
 */
export function getWalletStyle(type: WalletType, provider?: string | null): {
  color: string
  bg: string
  border: string
  label: string
} {
  const prov = provider?.toLowerCase() || ''

  if (prov.includes('wave')) {
    return {
      color: 'text-sky-400',
      bg: 'bg-sky-500/15',
      border: 'border-sky-500/30',
      label: 'Wave',
    }
  }
  if (prov.includes('orange')) {
    return {
      color: 'text-orange-400',
      bg: 'bg-orange-500/15',
      border: 'border-orange-500/30',
      label: 'Orange Money',
    }
  }
  if (prov.includes('mtn') || prov.includes('momo')) {
    return {
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/15',
      border: 'border-yellow-500/30',
      label: 'MTN MoMo',
    }
  }
  if (prov.includes('moov')) {
    return {
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
      border: 'border-blue-500/30',
      label: 'Moov Money',
    }
  }

  switch (type) {
    case 'cash':
      return {
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/15',
        border: 'border-emerald-500/30',
        label: 'Cash (Espèces)',
      }
    case 'mobile_money':
      return {
        color: 'text-amber-400',
        bg: 'bg-amber-500/15',
        border: 'border-amber-500/30',
        label: provider || 'Mobile Money',
      }
    case 'bank':
      return {
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/15',
        border: 'border-indigo-500/30',
        label: provider || 'Banque',
      }
    default:
      return {
        color: 'text-gray-400',
        bg: 'bg-gray-500/15',
        border: 'border-gray-500/30',
        label: 'Autre',
      }
  }
}
