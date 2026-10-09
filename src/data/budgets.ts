import { supabase } from '../lib/supabase'
import type { Budget, BudgetPeriod, BudgetProgressView } from '../types/database'

export const budgetsApi = {
  /**
   * Récupère la progression des budgets via la vue SQL `budget_progress`
   */
  async getBudgetProgress(): Promise<BudgetProgressView[]> {
    const { data, error } = await supabase
      .from('budget_progress')
      .select('*')
      .order('percent_used', { ascending: false })

    if (error) {
      console.error('[budgetsApi.getBudgetProgress] Erreur:', error)
      throw error
    }
    return (data as BudgetProgressView[]) || []
  },

  /**
   * Liste des budgets configurés
   */
  async list(): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, category:categories(id, name, type, icon)')
      .is('deleted_at', null)

    if (error) {
      console.error('[budgetsApi.list] Erreur:', error)
      throw error
    }
    return (data as Budget[]) || []
  },

  /**
   * Crée ou met à jour une enveloppe budgétaire
   */
  async upsert(params: {
    categoryId: string
    amount: number
    period?: BudgetPeriod
  }): Promise<Budget> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Utilisateur non connecté')

    const period = params.period || 'monthly'

    // Vérifie s'il existe déjà un budget pour cette catégorie et période
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('category_id', params.categoryId)
      .eq('period', period)
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from('budgets')
        .update({
          amount: Math.round(params.amount),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data as Budget
    } else {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          id: crypto.randomUUID(),
          user_id: user.user.id,
          category_id: params.categoryId,
          amount: Math.round(params.amount),
          period: period,
        })
        .select()
        .single()

      if (error) throw error
      return data as Budget
    }
  },

  /**
   * Suppression logique d'un budget
   */
  async softDelete(budgetId: string): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', budgetId)

    if (error) throw error
  },
}
