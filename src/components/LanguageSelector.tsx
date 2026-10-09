import React, { useState, useRef, useEffect } from 'react'
import { Languages, ChevronDown, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { i18n } = useTranslation()
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'fr'

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ]

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setIsOpen(false)
  }

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        title="Changer de langue / Change language"
        className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
          theme === 'dark'
            ? 'bg-gray-900/80 hover:bg-gray-800 text-gray-200 border-white/10 hover:border-emerald-500/40'
            : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200 shadow-sm'
        }`}
      >
        <Languages className="w-3.5 h-3.5 text-emerald-500" />
        <span className="uppercase tracking-wider">{currentLang}</span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-36 rounded-xl border p-1 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 ${
            theme === 'dark'
              ? 'bg-[#0f172a] border-white/10 text-white'
              : 'bg-white border-gray-200 text-gray-800'
          }`}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition cursor-pointer ${
                currentLang === lang.code
                  ? theme === 'dark'
                    ? 'bg-emerald-500/15 text-emerald-400 font-bold'
                    : 'bg-emerald-50 text-emerald-700 font-bold'
                  : theme === 'dark'
                  ? 'hover:bg-white/5 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
              {currentLang === lang.code && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
