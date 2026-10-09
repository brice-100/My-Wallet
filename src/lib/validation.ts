/**
 * Utilitaires de validation pour les formulaires MY-Wallet
 * Regex et règles strictes pour les champs de saisie
 */

// Regex RFC 5322 simplifiée et robuste pour les adresses emails
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Regex pour les noms complets (lettres avec accents, espaces, tirets, apostrophes, 2 à 50 caractères)
export const FULL_NAME_REGEX = /^[a-zA-ZÀ-ÿ\u00C0-\u017F]+([ '-][a-zA-ZÀ-ÿ\u00C0-\u017F]+)+$/

// Regex pour mot de passe : au moins 8 caractères, au moins une lettre et au moins un chiffre
export const PASSWORD_STRONG_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&_\-+=~.,;:<>^/\\()[\]{}]{8,}$/

// Regex pour montants financiers (chiffres positifs, décimales optionnelles avec point ou virgule jusqu'à 2 chiffres)
export const AMOUNT_REGEX = /^\d+([.,]\d{1,2})?$/

// Regex pour numéros de téléphone africains / internationaux (Mobile Money Wave, OM, MTN)
export const PHONE_REGEX = /^(\+?[1-9]\d{0,3})?[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}$/

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export const validateEmail = (email: string): ValidationResult => {
  const trimmed = email.trim()
  if (!trimmed) {
    return { isValid: false, error: "L'adresse email est requise." }
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Format d’email invalide (ex: nom@domaine.com).' }
  }
  return { isValid: true }
}

export const validatePassword = (password: string, isSignUp: boolean = false): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Le mot de passe est requis.' }
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Le mot de passe doit comporter au moins 8 caractères.' }
  }
  if (isSignUp && !PASSWORD_STRONG_REGEX.test(password)) {
    return {
      isValid: false,
      error: 'Le mot de passe doit contenir au moins une lettre et un chiffre.',
    }
  }
  return { isValid: true }
}

export const validateFullName = (name: string): ValidationResult => {
  const trimmed = name.trim()
  if (!trimmed) {
    return { isValid: false, error: 'Le nom complet est requis.' }
  }
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Le nom doit comporter au moins 3 caractères.' }
  }
  if (!FULL_NAME_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: 'Veuillez renseigner votre prénom et votre nom (ex: Aminata Diallo).',
    }
  }
  return { isValid: true }
}

export const validateAmount = (
  amountStr: string,
  min: number = 1,
  fieldName: string = 'montant'
): ValidationResult => {
  const trimmed = amountStr.trim().replace(',', '.')
  if (!trimmed) {
    return { isValid: false, error: `Le ${fieldName} est requis.` }
  }
  if (!AMOUNT_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: `Format invalide. Le ${fieldName} doit être un nombre positif (ex: 15000).`,
    }
  }
  const val = parseFloat(trimmed)
  if (isNaN(val) || val < min) {
    return {
      isValid: false,
      error: `Le ${fieldName} minimum doit être de ${min.toLocaleString('fr-FR')}.`,
    }
  }
  return { isValid: true }
}

export const validateText = (
  text: string,
  minLen: number = 2,
  fieldName: string = 'Ce champ'
): ValidationResult => {
  const trimmed = text.trim()
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} est requis.` }
  }
  if (trimmed.length < minLen) {
    return {
      isValid: false,
      error: `${fieldName} doit comporter au moins ${minLen} caractères.`,
    }
  }
  return { isValid: true }
}
