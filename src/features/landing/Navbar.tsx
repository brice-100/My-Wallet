import React, { useState } from 'react'
import { Wallet, ArrowRight, Menu, X, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { ThemeToggle } from '../../components/ThemeToggle'
import { LanguageSelector } from '../../components/LanguageSelector'

interface NavbarProps {
  onOpenDashboard: () => void
  onOpenAuth: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDashboard, onOpenAuth }) => {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '#features', label: t('nav.features') },
    { href: '#how-it-works', label: t('nav.howItWorks') },
    { href: '#pricing', label: t('nav.pricing') },
    { href: '#testimonials', label: t('nav.testimonials') },
  ]

  return (
    <header className="sticky top-0 z-50 transition-colors backdrop-blur-md border-b dark:border-white/10 border-gray-200 dark:bg-[#070b14]/85 bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-500 p-0.5 shadow-lg shadow-emerald-950/40">
            <div className="w-full h-full dark:bg-[#0b0f19] bg-white rounded-[10px] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight dark:text-white text-gray-900">
                MY-Wallet
              </span>
            </div>
            <p className="text-[10px] text-gray-400 -mt-0.5 hidden xs:block">
              {t('nav.brandTag', { defaultValue: 'Gestion de budget SaaS' })}
            </p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="dark:text-gray-300 text-gray-600 hover:text-emerald-400 transition"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions : Theme Toggle, Language Selector, CTAs */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Traduction / Language */}
          <LanguageSelector />

          {/* Changement de Thème */}
          <ThemeToggle />

          {/* Statut Utilisateur ou Connexion */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full dark:bg-emerald-500/10 bg-emerald-50 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                <span className="truncate max-w-[120px]">{profile?.full_name || user.email}</span>
              </div>
              <button
                type="button"
                onClick={onOpenDashboard}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 transition shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <span>{t('nav.dashboard')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (
                    window.confirm(
                      t('common.confirmLogout', {
                        defaultValue: 'Voulez-vous vraiment vous déconnecter de votre compte ?',
                      })
                    )
                  ) {
                    await signOut()
                  }
                }}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
                title={t('common.logout', { defaultValue: 'Se déconnecter' })}
                aria-label={t('common.logout', { defaultValue: 'Se déconnecter' })}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenAuth}
                className="text-xs font-semibold px-3 py-2 rounded-xl dark:text-gray-300 text-gray-700 hover:text-emerald-400 transition cursor-pointer"
              >
                {t('nav.login')}
              </button>

              <button
                type="button"
                onClick={onOpenDashboard}
                className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 transition shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <span>{t('nav.dashboard')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu de navigation"
            className="p-2 rounded-xl dark:text-gray-300 text-gray-700 border dark:border-white/10 border-gray-200 hover:border-emerald-500/40 transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-3 pb-6 border-t dark:border-white/10 border-gray-200 dark:bg-[#0b0f19] bg-white space-y-4 animate-in slide-in-from-top-4 shadow-2xl">
          <nav className="flex flex-col gap-1 pt-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-xl text-sm font-semibold dark:text-gray-200 text-gray-800 hover:bg-emerald-500/10 hover:text-emerald-500 transition"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Préférences Langue et Thème dans le menu mobile */}
          <div className="flex items-center justify-between p-3 rounded-2xl dark:bg-gray-900/60 bg-gray-100 border dark:border-white/5 border-gray-200">
            <span className="text-xs font-semibold dark:text-gray-300 text-gray-700">
              {t('nav.langAndTheme', { defaultValue: 'Langue & Affichage' })}
            </span>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>

          <div className="pt-2 border-t dark:border-white/10 border-gray-200 flex flex-col gap-2">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                  <span className="truncate">{profile?.full_name || user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      onOpenDashboard()
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-center text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-900/30 cursor-pointer"
                  >
                    {t('nav.dashboard')}
                  </button>
                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false)
                      if (
                        window.confirm(
                          t('common.confirmLogout', {
                            defaultValue: 'Voulez-vous vraiment vous déconnecter de votre compte ?',
                          })
                        )
                      ) {
                        await signOut()
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                    title={t('common.logout', { defaultValue: 'Se déconnecter' })}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('common.logout', { defaultValue: 'Déconnexion' })}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenAuth()
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-center border dark:border-white/10 border-gray-200 dark:text-white text-gray-800 cursor-pointer"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenDashboard()
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-center text-gray-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-md shadow-emerald-900/30 cursor-pointer"
                >
                  {t('nav.dashboard')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
