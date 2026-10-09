import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { offlineStorage } from '../lib/offlineStorage'

interface NetworkContextType {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  triggerSync: () => Promise<void>
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  triggerSync: async () => {},
})

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [pendingCount, setPendingCount] = useState<number>(0)

  const refreshPendingCount = useCallback(async () => {
    const count = await offlineStorage.getPendingCount()
    setPendingCount(count)
  }, [])

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return
    setIsSyncing(true)
    try {
      await offlineStorage.processSyncQueue()
    } finally {
      await refreshPendingCount()
      setIsSyncing(false)
    }
  }, [isSyncing, refreshPendingCount])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Dès que le réseau revient, lancer la synchronisation automatique
      triggerSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    refreshPendingCount()

    // Vérification périodique toutes les 30s
    const interval = setInterval(() => {
      refreshPendingCount()
      if (navigator.onLine && pendingCount > 0) {
        triggerSync()
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [triggerSync, refreshPendingCount, pendingCount])

  return (
    <NetworkContext.Provider value={{ isOnline, isSyncing, pendingCount, triggerSync }}>
      {children}
    </NetworkContext.Provider>
  )
}

export const useNetwork = () => useContext(NetworkContext)
