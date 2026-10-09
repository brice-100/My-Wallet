import { supabase } from '../lib/supabase'
import type { Wallet, WalletBalanceView, WalletType } from '../types/database'

export const walletsApi = {
  /**
   * Récupère la liste des portefeuilles actifs avec leurs soldes calculés (via la vue SQL)
   */
  async getWalletsWithBalances(): Promise<WalletBalanceView[]> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('[walletsApi.getWalletsWithBalances] Erreur:', error)
      throw error
    }
    return (data as WalletBalanceView[]) || []
  },

  /**
   * Récupère les portefeuilles bruts de l'utilisateur
   */
  async list(): Promise<Wallet[]> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[walletsApi.list] Erreur:', error)
      throw error
    }
    return (data as Wallet[]) || []
  },

  /**
   * Crée un nouveau portefeuille avec solde initial optionnel
   */
  async create(params: {
    name: string
    type: WalletType
    provider?: string
    initialBalance?: number
  }): Promise<Wallet> {
    const walletId = crypto.randomUUID()
    const { data: user } = await supabase.auth.getUser()

    if (!user.user) throw new Error('Utilisateur non connecté')

    const { data: wallet, error } = await supabase
      .from('wallets')
      .insert({
        id: walletId,
        user_id: user.user.id,
        name: params.name,
        type: params.type,
        provider: params.provider || null,
        archived: false,
      })
      .select()
      .single()

    if (error) {
      console.error('[walletsApi.create] Erreur:', error)
      throw error
    }

    // Si un solde initial positif a été précisé, on crée la transaction d'ouverture
    if (params.initialBalance && params.initialBalance > 0) {
      const { error: txError } = await supabase.from('transactions').insert({
        id: crypto.randomUUID(),
        user_id: user.user.id,
        wallet_id: walletId,
        amount: Math.round(params.initialBalance),
        type: 'opening',
        note: "Solde d'ouverture",
        source: 'manual',
      })
      if (txError) {
        console.error("[walletsApi.create] Erreur création solde d'ouverture:", txError)
      }
    }

    return wallet as Wallet
  },

  /**
   * Archive un portefeuille
   */
  async archive(walletId: string): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', walletId)

    if (error) {
      console.error('[walletsApi.archive] Erreur:', error)
      throw error
    }
  },

  /**
   * Suppression logique d'un portefeuille
   */
  async softDelete(walletId: string): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', walletId)

    if (error) {
      console.error('[walletsApi.softDelete] Erreur:', error)
      throw error
    }
  },
}
