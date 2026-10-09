import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Lock, X, Loader2, Check, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { PASSWORD_STRONG_REGEX } from '../../lib/validation'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  if (!isOpen) return null

  const validateField = (field: string, val: string) => {
    let err: string | undefined

    if (field === 'newPassword') {
      if (!val) {
        err = 'Veuillez saisir votre nouveau mot de passe.'
      } else if (val.length < 8) {
        err = 'Le mot de passe doit comporter au moins 8 caractères.'
      } else if (!PASSWORD_STRONG_REGEX.test(val)) {
        err = 'Le mot de passe doit contenir au moins une lettre et un chiffre.'
      }
    } else if (field === 'confirmPassword') {
      if (!val) {
        err = 'Veuillez confirmer votre nouveau mot de passe.'
      } else if (val !== newPassword) {
        err = 'Les mots de passe ne correspondent pas.'
      }
    }

    setFieldErrors((prev) => {
      const copy = { ...prev }
      if (err) copy[field] = err
      else delete copy[field]
      return copy
    })
    return !err
  }

  const validateAll = () => {
    const errors: Record<string, string> = {}

    if (!newPassword) {
      errors.newPassword = 'Veuillez saisir votre nouveau mot de passe.'
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Le mot de passe doit comporter au moins 8 caractères.'
    } else if (!PASSWORD_STRONG_REGEX.test(newPassword)) {
      errors.newPassword = 'Le mot de passe doit contenir au moins une lettre et un chiffre.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer votre nouveau mot de passe.'
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas.'
    }

    setFieldErrors(errors)
    setTouched({ newPassword: true, confirmPassword: true })
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccess(false)

    if (!validateAll()) return

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setFieldErrors({})
      setTouched({})
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2200)
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la mise à jour du mot de passe.')
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
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold dark:text-white text-gray-900">
            Modifier mon mot de passe
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5">
          Sécurisez votre compte en définissant un mot de passe fort d'au moins 8 caractères avec lettres et chiffres.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Mot de passe mis à jour avec succès ! Fermeture...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              Nouveau mot de passe <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (touched.newPassword) validateField('newPassword', e.target.value)
                  if (touched.confirmPassword && confirmPassword) {
                    if (confirmPassword !== e.target.value) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: 'Les mots de passe ne correspondent pas.' }))
                    } else {
                      setFieldErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.confirmPassword
                        return copy
                      })
                    }
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, newPassword: true }))
                  validateField('newPassword', newPassword)
                }}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl dark:bg-gray-900/60 bg-gray-50 border transition dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none text-sm ${
                  fieldErrors.newPassword
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
            {fieldErrors.newPassword ? (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {fieldErrors.newPassword}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 mt-1">
                Minimum 8 caractères, incluant au moins une lettre et un chiffre.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium dark:text-gray-300 text-gray-700 mb-1">
              Confirmer le nouveau mot de passe <span className="text-rose-500">*</span>
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
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, confirmPassword: true }))
                  validateField('confirmPassword', confirmPassword)
                }}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl dark:bg-gray-900/60 bg-gray-50 border transition dark:text-white text-gray-900 placeholder-gray-400 focus:outline-none text-sm ${
                  fieldErrors.confirmPassword
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-[0.99] transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-gray-950" />}
            <span>Mettre à jour le mot de passe</span>
          </button>
        </form>
      </div>
    </div>
  )
}
