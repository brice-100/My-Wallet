import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { Lock, Mail, User, X, Loader2, Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { validateEmail, validatePassword, validateFullName } from '../../lib/validation'

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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  if (!isOpen) return null

  const validateField = (field: string, value: string) => {
    let err: string | undefined

    if (field === 'email') {
      const res = validateEmail(value)
      if (!res.isValid) err = res.error
    } else if (field === 'password') {
      const res = validatePassword(value, isSignUp)
      if (!res.isValid) err = res.error
    } else if (field === 'confirmPassword' && isSignUp) {
      if (!value) {
        err = 'Veuillez confirmer votre mot de passe.'
      } else if (value !== password) {
        err = 'Les mots de passe ne correspondent pas.'
      }
    } else if (field === 'fullName' && isSignUp) {
      const res = validateFullName(value)
      if (!res.isValid) err = res.error
    }

    setFieldErrors((prev) => {
      const copy = { ...prev }
      if (err) copy[field] = err
      else delete copy[field]
      return copy
    })

    return !err
  }

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateField(field, value)
  }

  const validateAll = () => {
    const errors: Record<string, string> = {}

    if (isSignUp) {
      const nameRes = validateFullName(fullName)
      if (!nameRes.isValid) errors.fullName = nameRes.error!
    }

    const emailRes = validateEmail(email)
    if (!emailRes.isValid) errors.email = emailRes.error!

    const passRes = validatePassword(password, isSignUp)
    if (!passRes.isValid) errors.password = passRes.error!

    if (isSignUp) {
      if (!confirmPassword) {
        errors.confirmPassword = 'Veuillez confirmer votre mot de passe.'
      } else if (confirmPassword !== password) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas.'
      }
    }

    setFieldErrors(errors)
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    })

    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!validateAll()) {
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const { needEmailConfirm } = await signUp(email.trim(), password, fullName.trim())
        if (needEmailConfirm) {
          setSuccessMsg(
            'Compte créé avec succès ! Si la confirmation par email est activée, veuillez vérifier votre boîte mail.'
          )
        } else {
          onSuccess()
          onClose()
        }
      } else {
        await signIn(email.trim(), password)
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
          "Limite d'envoi d'emails Supabase atteinte. Veuillez désactiver l'option 'Confirm email' dans votre tableau de bord Supabase (Authentication > Providers > Email) pour permettre la création directe."
        )
      } else if (msg.toLowerCase().includes('already registered')) {
        setErrorMsg('Un compte existe déjà avec cette adresse email. Veuillez basculer sur Se connecter.')
        setFieldErrors((prev) => ({ ...prev, email: 'Cette adresse email est déjà utilisée.' }))
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
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                {t('modals.auth.fullName', { defaultValue: 'Nom complet' })} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('modals.auth.fullNamePlaceholder', { defaultValue: 'ex. Mamadou Diallo' })}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (touched.fullName) validateField('fullName', e.target.value)
                  }}
                  onBlur={() => handleBlur('fullName', fullName)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-gray-900/60 bg-gray-50 border transition dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none text-sm ${fieldErrors.fullName
                      ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                      : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
                    }`}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" /> {fieldErrors.fullName}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.auth.email', { defaultValue: 'Adresse Email' })} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="votre-email@exemple.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (touched.email) validateField('email', e.target.value)
                }}
                onBlur={() => handleBlur('email', email)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-gray-900/60 bg-gray-50 border transition dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none text-sm ${fieldErrors.email
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                    : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
                  }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              {t('modals.auth.password', { defaultValue: 'Mot de passe' })} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (touched.password) validateField('password', e.target.value)
                  if (isSignUp && touched.confirmPassword) {
                    if (confirmPassword && confirmPassword !== e.target.value) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Les mots de passe ne correspondent pas.' }))
                    } else if (confirmPassword) {
                      setFieldErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.confirmPassword
                        return copy
                      })
                    }
                  }
                }}
                onBlur={() => handleBlur('password', password)}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl dark:bg-gray-900/60 bg-gray-50 border transition dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none text-sm ${fieldErrors.password
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                    : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {fieldErrors.password}
              </p>
            )}
            {isSignUp && !fieldErrors.password && (
              <p className="text-[10px] text-gray-400 mt-1">
                Au moins 8 caractères avec au moins une lettre et un chiffre.
              </p>
            )}
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
                Confirmer le mot de passe <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (touched.confirmPassword) validateField('confirmPassword', e.target.value)
                  }}
                  onBlur={() => handleBlur('confirmPassword', confirmPassword)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl dark:bg-gray-900/60 bg-gray-50 border transition dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none text-sm ${fieldErrors.confirmPassword
                      ? 'border-rose-500 focus:ring-1 focus:ring-rose-500/30'
                      : 'dark:border-white/10 border-gray-200 focus:border-emerald-500'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" /> {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          )}

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
              setFieldErrors({})
              setTouched({})
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
