import { supabase } from '../lib/supabase'
import type {
  CurrencyCode,
  GlobalBalanceView,
  MonthlyFlowView,
  Profile,
  SpendingByCategoryMonthView,
} from '../types/database'

export const profileApi = {
  /**
   * Récupère le profil de l'utilisateur connecté
   */
  async getProfile(): Promise<Profile | null> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .maybeSingle()

    if (error) {
      console.error('[profileApi.getProfile] Erreur:', error)
      throw error
    }

    if (!data && user.user) {
      try {
        const { data: created } = await supabase
          .from('profiles')
          .upsert({
            id: user.user.id,
            full_name: user.user.user_metadata?.full_name || user.user.email?.split('@')[0] || 'Utilisateur',
            currency: 'XOF',
            pay_day: 1,
            plan: 'free',
            role: 'user',
            status: 'active',
          })
          .select()
          .maybeSingle()
        if (created) return created as Profile
      } catch (upsertErr) {
        console.warn('Fallback profile creation failed:', upsertErr)
      }
    }

    return data as Profile | null
  },

  /**
   * Met à jour les paramètres de profil autorisés par la RLS
   */
  async updateProfile(params: {
    fullName?: string
    currency?: CurrencyCode
    payDay?: number
  }): Promise<Profile> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Utilisateur non connecté')

    const updates: Partial<Profile> = {
      updated_at: new Date().toISOString(),
    }
    if (params.fullName !== undefined) updates.full_name = params.fullName
    if (params.currency !== undefined) updates.currency = params.currency
    if (params.payDay !== undefined) updates.pay_day = params.payDay

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.user.id)
      .select()
      .single()

    if (error) {
      console.error('[profileApi.updateProfile] Erreur:', error)
      throw error
    }
    return data as Profile
  },

  /**
   * Récupère le solde net global consolidé via la vue SQL `global_balance`
   */
  async getGlobalBalance(): Promise<number> {
    const { data, error } = await supabase
      .from('global_balance')
      .select('balance')
      .maybeSingle()

    if (error) {
      console.error('[profileApi.getGlobalBalance] Erreur:', error)
      return 0
    }
    const row = data as GlobalBalanceView | null
    return row?.balance || 0
  },

  /**
   * Récupère les flux mensuels (histogramme) via la vue SQL `monthly_flows`
   */
  async getMonthlyFlows(): Promise<MonthlyFlowView[]> {
    const { data, error } = await supabase
      .from('monthly_flows')
      .select('*')
      .order('month', { ascending: true })

    if (error) {
      console.error('[profileApi.getMonthlyFlows] Erreur:', error)
      return []
    }
    return (data as MonthlyFlowView[]) || []
  },

  /**
   * Récupère les dépenses par catégorie du mois en cours via la vue SQL `spending_by_category_month`
   */
  async getSpendingByCategoryMonth(): Promise<SpendingByCategoryMonthView[]> {
    const { data, error } = await supabase
      .from('spending_by_category_month')
      .select('*')
      .order('total', { ascending: false })

    if (error) {
      console.error('[profileApi.getSpendingByCategoryMonth] Erreur:', error)
      return []
    }
    return (data as SpendingByCategoryMonthView[]) || []
  },
}
