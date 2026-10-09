import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Transaction, WalletBalanceView } from '../types/database'
import { transactionsApi } from '../data/transactions'

export interface PendingSyncAction {
  id: string // UUID local
  action: 'CREATE_TRANSACTION' | 'UPDATE_TRANSACTION' | 'DELETE_TRANSACTION'
  payload: any
  createdAt: string
  retryCount: number
}

interface MyWalletOfflineDB extends DBSchema {
  transactions: {
    key: string
    value: Transaction
    indexes: { 'by-occurred': string }
  }
  wallets: {
    key: string
    value: WalletBalanceView
  }
  syncQueue: {
    key: string
    value: PendingSyncAction
    indexes: { 'by-created': string }
  }
}

const DB_NAME = 'my-wallet-offline-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<MyWalletOfflineDB>> | null = null

function getDB(): Promise<IDBPDatabase<MyWalletOfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MyWalletOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Table locale des transactions
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' })
          txStore.createIndex('by-occurred', 'occurred_at')
        }
        // Table locale des portefeuilles
        if (!db.objectStoreNames.contains('wallets')) {
          db.createObjectStore('wallets', { keyPath: 'wallet_id' })
        }
        // File d'attente de synchronisation
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          queueStore.createIndex('by-created', 'createdAt')
        }
      },
    })
  }
  return dbPromise
}

export const offlineStorage = {
  /**
   * Sauvegarde les transactions reçues du serveur en cache local
   */
  async cacheTransactions(txList: Transaction[]): Promise<void> {
    try {
      const db = await getDB()
      const tx = db.transaction('transactions', 'readwrite')
      for (const item of txList) {
        await tx.store.put(item)
      }
      await tx.done
    } catch (e) {
      console.warn('[OfflineStorage] Cache transactions error:', e)
    }
  },

  /**
   * Récupère les transactions stockées localement
   */
  async getCachedTransactions(): Promise<Transaction[]> {
    try {
      const db = await getDB()
      return await db.getAllFromIndex('transactions', 'by-occurred')
    } catch (e) {
      console.warn('[OfflineStorage] Get cached transactions error:', e)
      return []
    }
  },

  /**
   * Ajoute une action en file d'attente pour synchronisation ultérieure
   */
  async enqueueAction(action: PendingSyncAction['action'], payload: any): Promise<void> {
    try {
      const db = await getDB()
      const item: PendingSyncAction = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        action,
        payload,
        createdAt: new Date().toISOString(),
        retryCount: 0,
      }
      await db.put('syncQueue', item)

      // Si c'est une création de transaction, on la met aussi en cache local immédiatement
      if (action === 'CREATE_TRANSACTION' && payload) {
        await db.put('transactions', payload)
      }
    } catch (e) {
      console.error('[OfflineStorage] Enqueue error:', e)
    }
  },

  /**
   * Récupère le nombre d'éléments en attente de synchronisation
   */
  async getPendingCount(): Promise<number> {
    try {
      const db = await getDB()
      return await db.count('syncQueue')
    } catch {
      return 0
    }
  },

  /**
   * Exécute la synchronisation de toutes les actions en attente
   */
  async processSyncQueue(): Promise<{ synced: number; failed: number }> {
    if (!navigator.onLine) {
      return { synced: 0, failed: 0 }
    }

    let synced = 0
    let failed = 0

    try {
      const db = await getDB()
      const queue = await db.getAllFromIndex('syncQueue', 'by-created')

      for (const item of queue) {
        try {
          if (item.action === 'CREATE_TRANSACTION') {
            await transactionsApi.create({
              walletId: item.payload.walletId || item.payload.wallet_id,
              categoryId: item.payload.categoryId || item.payload.category_id,
              amount: item.payload.amount,
              type: item.payload.type,
              occurredAt: item.payload.occurredAt || item.payload.occurred_at,
              note: item.payload.note,
            })
          }
          // Action réussie : retrait de la file d'attente
          await db.delete('syncQueue', item.id)
          synced++
        } catch (err) {
          console.error(`[OfflineStorage] Erreur sync action ${item.id}:`, err)
          item.retryCount += 1
          if (item.retryCount >= 5) {
            // Trop d'échecs, abandonner pour ne pas bloquer indéfiniment
            await db.delete('syncQueue', item.id)
          } else {
            await db.put('syncQueue', item)
          }
          failed++
        }
      }
    } catch (e) {
      console.error('[OfflineStorage] Sync queue processing error:', e)
    }

    return { synced, failed }
  },
}
