import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck, Lock, Loader2, ArrowLeft, LogIn } from 'lucide-react'
import { AuthModal } from '../features/auth/AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
  onBackToLanding?: () => void
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onBackToLanding }) => {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  // 1. Écran de chargement élégant pendant la vérification du token Supabase
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 dark:bg-[#070b14] bg-gray-50 text-gray-900 dark:text-gray-100 transition-colors">
        <div className="glass-card p-8 rounded-3xl border dark:border-white/10 border-gray-200 shadow-2xl max-w-sm w-full text-center space-y-4 animate-in fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-500 p-0.5 shadow-lg shadow-emerald-950/40">
            <div className="w-full h-full dark:bg-[#0b0f19] bg-white rounded-[14px] flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold dark:text-white text-gray-900">MY-Wallet</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('protected.checkingAuth', { defaultValue: 'Vérification de la session sécurisée...' })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 2. Écran d'accès protégé si aucun utilisateur n'est connecté
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 dark:bg-[#070b14] bg-gray-50 text-gray-900 dark:text-gray-100 transition-colors">
        <div className="glass-card p-6 sm:p-8 rounded-3xl border dark:border-white/10 border-gray-200 shadow-2xl max-w-md w-full text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[11px] font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('protected.badge', { defaultValue: 'Accès Réservé' })}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold dark:text-white text-gray-900">
              {t('protected.title', { defaultValue: 'Espace Privé & Sécurisé' })}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              {t('protected.subtitle', {
                defaultValue:
                  'Cet espace est strictement réservé aux utilisateurs authentifiés. Connectez-vous ou créez un compte pour accéder à vos portefeuilles et transactions réelles.',
              })}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full py-3 px-4 rounded-xl font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.99] transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <LogIn className="w-4 h-4 text-gray-950" />
              {t('protected.loginBtn', { defaultValue: 'Se connecter à mon espace' })}
            </button>

            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold dark:text-gray-300 text-gray-600 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('protected.backHome', { defaultValue: "Retour à l'accueil" })}
              </button>
            )}
          </div>
        </div>

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => {
            setIsAuthOpen(false)
          }}
        />
      </div>
    )
  }

  // 3. Utilisateur authentifié : accès autorisé aux données privées
  return <>{children}</>
}
