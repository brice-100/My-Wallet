import { supabase } from '../lib/supabase'
import type { Transaction, TransactionType } from '../types/database'

export interface CreateTransactionParams {
  walletId: string
  categoryId?: string
  amount: number
  type: TransactionType
  note?: string
  occurredAt?: string
}

export interface CreateTransferParams {
  fromWalletId: string
  toWalletId: string
  amount: number
  note?: string
  occurredAt?: string
}

export const transactionsApi = {
  /**
   * Récupère la liste des transactions avec filtres optionnels
   */
  async list(filters?: {
    walletId?: string
    categoryId?: string
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<Transaction[]> {
    let query = supabase
      .from('transactions')
      .select('*, wallet:wallets(id, name, type, provider), category:categories(id, name, type, icon)')
      .is('deleted_at', null)
      .order('occurred_at', { ascending: false })

    if (filters?.walletId) {
      query = query.eq('wallet_id', filters.walletId)
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }
    if (filters?.startDate) {
      query = query.gte('occurred_at', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('occurred_at', filters.endDate)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('[transactionsApi.list] Erreur:', error)
      throw error
    }
    return (data as Transaction[]) || []
  },

  /**
   * Crée une transaction classique (revenu, dépense)
   */
  async create(params: CreateTransactionParams): Promise<Transaction> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Utilisateur non connecté')

    const txId = crypto.randomUUID()
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        id: txId,
        user_id: user.user.id,
        wallet_id: params.walletId,
        category_id: params.categoryId || null,
        amount: Math.round(params.amount),
        type: params.type,
        occurred_at: params.occurredAt || new Date().toISOString(),
        note: params.note || null,
        source: 'manual',
      })
      .select('*, wallet:wallets(id, name, type, provider), category:categories(id, name, type, icon)')
      .single()

    if (error) {
      console.error('[transactionsApi.create] Erreur:', error)
      throw error
    }
    return data as Transaction
  },

  /**
   * Crée un transfert entre deux portefeuilles (deux écritures liées par transfer_group_id)
   */
  async createTransfer(params: CreateTransferParams): Promise<{ outId: string; inId: string }> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('Utilisateur non connecté')

    const transferGroupId = crypto.randomUUID()
    const outId = crypto.randomUUID()
    const inId = crypto.randomUUID()
    const timestamp = params.occurredAt || new Date().toISOString()
    const noteText = params.note || 'Transfert interne'

    // Sortie (transfer_out)
    const outTx = {
      id: outId,
      user_id: user.user.id,
      wallet_id: params.fromWalletId,
      category_id: null,
      amount: Math.round(params.amount),
      type: 'transfer_out',
      occurred_at: timestamp,
      note: noteText,
      transfer_group_id: transferGroupId,
      source: 'manual',
    }

    // Entrée (transfer_in)
    const inTx = {
      id: inId,
      user_id: user.user.id,
      wallet_id: params.toWalletId,
      category_id: null,
      amount: Math.round(params.amount),
      type: 'transfer_in',
      occurred_at: timestamp,
      note: noteText,
      transfer_group_id: transferGroupId,
      source: 'manual',
    }

    const { error } = await supabase.from('transactions').insert([outTx, inTx])

    if (error) {
      console.error('[transactionsApi.createTransfer] Erreur:', error)
      throw error
    }

    return { outId, inId }
  },

  /**
   * Suppression logique d'une transaction
   * Si c'est un transfert, supprime également l'autre jambe du transfert
   */
  async softDelete(transaction: Transaction): Promise<void> {
    const now = new Date().toISOString()

    if (transaction.transfer_group_id) {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: now })
        .eq('transfer_group_id', transaction.transfer_group_id)

      if (error) {
        console.error('[transactionsApi.softDelete] Erreur transfert:', error)
        throw error
      }
    } else {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: now })
        .eq('id', transaction.id)

      if (error) {
        console.error('[transactionsApi.softDelete] Erreur:', error)
        throw error
      }
    }
  },
}
