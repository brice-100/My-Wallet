import { supabase } from '../lib/supabase'

export interface AuditLog {
  id: string
  admin_id: string
  admin_email: string
  action: string
  target_user_id: string | null
  target_user: string
  details: string
  created_at: string
}

const LOCAL_STORAGE_KEY = 'mywallet_admin_audit_logs'

export const auditApi = {
  /**
   * Récupère le journal d'audit système combinant Supabase et le stockage local résilient
   */
  async getLogs(currentUserEmail?: string): Promise<AuditLog[]> {
    const localLogs: AuditLog[] = []
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          localLogs.push(...parsed)
        }
      }
    } catch (e) {
      console.warn('[AuditApi] Erreur lecture localStorage:', e)
    }

    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.warn('[AuditApi] Table admin_audit_log distante inaccessible, utilisation du fallback local:', error.message)
        return localLogs
      }

      const remoteLogs: AuditLog[] = (data || []).map((row: any) => {
        let detailsStr = ''
        if (typeof row.details === 'string') {
          detailsStr = row.details
        } else if (row.details && typeof row.details === 'object') {
          if (row.details.description) {
            detailsStr = row.details.description
          } else {
            detailsStr = JSON.stringify(row.details)
          }
        }

        const targetUser =
          row.details?.target ||
          row.target_user_id ||
          'Utilisateur'

        return {
          id: String(row.id),
          admin_id: row.admin_id,
          admin_email: currentUserEmail || 'admin@mywallet.app',
          action: row.action,
          target_user_id: row.target_user_id,
          target_user: targetUser,
          details: detailsStr || `Action ${row.action} exécutée`,
          created_at: row.created_at,
        }
      })

      // Fusion et déduplication
      const allLogs = [...remoteLogs]
      for (const localLog of localLogs) {
        if (!allLogs.some((l) => l.id === localLog.id || (l.action === localLog.action && l.created_at === localLog.created_at))) {
          allLogs.push(localLog)
        }
      }

      allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      return allLogs
    } catch (err) {
      console.error('[AuditApi] Exception chargement audit logs:', err)
      return localLogs
    }
  },

  /**
   * Enregistre une action sensible dans le journal d'audit (Supabase + LocalStorage)
   */
  async logAction(params: {
    adminId: string
    adminEmail: string
    action: string
    targetUserId?: string | null
    targetUserName?: string
    details: string
    metadata?: Record<string, any>
  }): Promise<AuditLog> {
    const timestamp = new Date().toISOString()
    const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const newLog: AuditLog = {
      id: logId,
      admin_id: params.adminId,
      admin_email: params.adminEmail,
      action: params.action,
      target_user_id: params.targetUserId || null,
      target_user: params.targetUserName || 'Utilisateur',
      details: params.details,
      created_at: timestamp,
    }

    // 1. Sauvegarde locale immédiate garantie
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      const list: AuditLog[] = stored ? JSON.parse(stored) : []
      const updated = [newLog, ...list.slice(0, 99)]
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.warn('[AuditApi] Erreur écriture localStorage:', e)
    }

    // 2. Enregistrement distant dans Supabase
    try {
      const { error } = await supabase.from('admin_audit_log').insert({
        admin_id: params.adminId,
        action: params.action,
        target_user_id: params.targetUserId || null,
        details: {
          target: params.targetUserName,
          description: params.details,
          ...(params.metadata || {}),
        },
        created_at: timestamp,
      })

      if (error) {
        console.warn('[AuditApi] Notice: insertion admin_audit_log Supabase (RLS ou migration):', error.message)
      }
    } catch (err) {
      console.warn('[AuditApi] Exception insertion Supabase:', err)
    }

    return newLog
  },
}
