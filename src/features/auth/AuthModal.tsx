import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { Lock, Mail, User, X, Loader2, Sparkles } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation()
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      if (isSignUp) {
        const { needEmailConfirm } = await signUp(email, password, fullName)
        if (needEmailConfirm) {
          setSuccessMsg(
            'Compte créé avec succès ! Si la confirmation par email est activée, veuillez vérifier votre boîte mail.'
          )
        } else {
          onSuccess()
          onClose()
        }
      } else {
        await signIn(email, password)
        onSuccess()
        onClose()
      }
    } catch (err: any) {
      const msg = err.message || ''
      if (
        msg.toLowerCase().includes('rate limit') ||
        err.code === 'over_email_send_rate_limit' ||
        err.status === 429
      ) {
        setErrorMsg(
          "Limite d'envoi d'emails Supabase atteinte. Veuillez désactiver l'option 'Confirm email' dans votre tableau de bord Supabase (Authentication > Providers > Email > décocher 'Confirm email' > Save) pour permettre la création instantanée sans blocage."
        )
      } else if (msg.toLowerCase().includes('already registered')) {
        setErrorMsg('Un compte existe déjà avec cette adresse email. Veuillez basculer sur Se connecter.')
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        setErrorMsg('Adresse email ou mot de passe incorrect.')
      } else {
        setErrorMsg(msg || t('common.errorOccurred', { defaultValue: 'Une erreur est survenue lors de la connexion.' }))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl glass-card p-5 sm:p-6 shadow-2xl border dark:border-white/10 border-gray-200">
        <button
          onClick={onClose}
          type="button"
          aria-label={t('common.close', { defaultValue: 'Fermer' })}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold dark:text-white text-gray-900">
            {isSignUp ? t('modals.auth.createAccount', { defaultValue: 'Créer un Compte' }) : t('modals.auth.welcomeBack', { defaultValue: 'Bon retour parmi nous' })}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5">
          {t('modals.auth.authSubtitle', { defaultValue: 'Synchronisez vos données sur tous vos appareils en toute sécurité.' })}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs sm:text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                {t('modals.auth.fullName', { defaultValue: 'Nom complet' })}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder={t('modals.auth.fullNamePlaceholder', { defaultValue: 'ex. Mamadou Diallo' })}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.auth.email', { defaultValue: 'Adresse Email' })}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="votre-email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.auth.password', { defaultValue: 'Mot de passe' })}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-gray-900/60 bg-gray-50 border dark:border-white/10 border-gray-200 dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.99] transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-950" />}
            {isSignUp ? t('modals.auth.signUpButton', { defaultValue: 'Créer mon Compte' }) : t('modals.auth.signInButton', { defaultValue: 'Se Connecter' })}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className="text-xs text-emerald-500 hover:underline cursor-pointer font-medium"
          >
            {isSignUp
              ? `${t('modals.auth.haveAccount', { defaultValue: 'Déjà inscrit ?' })} ${t('modals.auth.switchSignIn', { defaultValue: 'Se connecter' })}`
              : `${t('modals.auth.noAccount', { defaultValue: 'Pas encore de compte ?' })} ${t('modals.auth.switchSignUp', { defaultValue: 'Créer un compte' })}`}
          </button>
        </div>
      </div>
    </div>
  )
}
