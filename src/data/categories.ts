import { supabase } from '../lib/supabase'
import type { Category, CategoryType } from '../types/database'

export const categoriesApi = {
  /**
   * Récupère la liste des catégories de l'utilisateur
   */
  async list(type?: CategoryType): Promise<Category[]> {
    let query = supabase
      .from('categories')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('[categoriesApi.list] Erreur:', error)
      throw error
    }

    // Auto-seeding pour un nouvel utilisateur connecté sans catégories
    if ((!data || data.length === 0) && !type) {
      const { data: userAuth } = await supabase.auth.getUser()
      if (userAuth?.user) {
        const defaultCats = [
          { name: 'Alimentation & Courses', type: 'expense' as const, icon: 'utensils' },
          { name: 'Transport & Carburant', type: 'expense' as const, icon: 'bus' },
          { name: 'Loyer & Logement', type: 'expense' as const, icon: 'home' },
          { name: 'Factures (CIE / Senelec / Eau)', type: 'expense' as const, icon: 'receipt' },
          { name: 'Cotisations Tontines', type: 'expense' as const, icon: 'users' },
          { name: 'Santé & Pharmacie', type: 'expense' as const, icon: 'heart-pulse' },
          { name: 'Loisirs & Sorties', type: 'expense' as const, icon: 'coffee' },
          { name: 'Salaire', type: 'income' as const, icon: 'briefcase' },
          { name: 'Ventes & Activité freelance', type: 'income' as const, icon: 'store' },
          { name: 'Tontine perçue (Gain)', type: 'income' as const, icon: 'gift' },
        ]

        try {
          const toInsert = defaultCats.map((c) => ({
            id: crypto.randomUUID(),
            user_id: userAuth.user.id,
            name: c.name,
            type: c.type,
            icon: c.icon,
          }))

          const { data: seeded, error: seedErr } = await supabase
            .from('categories')
            .insert(toInsert)
            .select()

          if (!seedErr && seeded) {
            return seeded as Category[]
          }
        } catch (e) {
          console.warn('[categoriesApi] Erreur auto-seed catégories:', e)
        }
      }
    }

    return (data as Category[]) || []
  },

  /**
   * Crée une nouvelle catégorie
   */
  async create(params: {
    name: string
    type: CategoryType
    icon?: string
    parentId?: string
  }): Promise<Category> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Utilisateur non connecté')

    const { data, error } = await supabase
      .from('categories')
      .insert({
        id: crypto.randomUUID(),
        user_id: user.user.id,
        name: params.name,
        type: params.type,
        icon: params.icon || null,
        parent_id: params.parentId || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[categoriesApi.create] Erreur:', error)
      throw error
    }
    return data as Category
  },

  /**
   * Suppression logique d'une catégorie
   */
  async softDelete(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', categoryId)

    if (error) {
      console.error('[categoriesApi.softDelete] Erreur:', error)
      throw error
    }
  },
}
