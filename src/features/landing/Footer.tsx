import React from 'react'
import { Wallet, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const Footer: React.FC = () => {
  const { t } = useTranslation()

  return (
    <footer className="border-t dark:border-white/8 border-gray-200 dark:bg-[#070b14] bg-gray-50 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Pitch */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-500 p-0.5">
                <div className="w-full h-full dark:bg-[#0b0f19] bg-white rounded-[10px] flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                </div>
              </div>
              <span className="text-lg font-bold dark:text-white text-gray-900">
                MY-Wallet PFM
              </span>
            </div>
            <p className="text-xs dark:text-gray-400 text-gray-600 max-w-sm leading-relaxed">
              {t('footer.desc')}
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
              <span>{t('footer.currenciesSupported', { defaultValue: 'Devises prises en charge :' })}</span>
              <span className="text-gray-400 font-normal">
                FCFA (XOF/XAF), GNF, CDF, EUR, USD
              </span>
            </div>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider dark:text-white text-gray-900 mb-3">
              {t('footer.product')}
            </h4>
            <ul className="space-y-2 text-xs dark:text-gray-400 text-gray-600">
              <li>
                <a href="#features" className="hover:text-emerald-400 transition">
                  {t('footer.multiWallets', { defaultValue: 'Multi-Portefeuilles' })}
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-emerald-400 transition">
                  {t('footer.dailyRest', { defaultValue: 'Reste à Vivre Quotidien' })}
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-emerald-400 transition">
                  {t('footer.tontinesDebts', { defaultValue: 'Tontines & Dettes' })}
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-emerald-400 transition">
                  {t('footer.pricingMobile', { defaultValue: 'Tarifs & Pass Mobile Money' })}
                </a>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider dark:text-white text-gray-900 mb-3">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-2 text-xs dark:text-gray-400 text-gray-600">
              <li>
                <a href="#" className="hover:text-emerald-400 transition">
                  {t('footer.privacy')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400 transition">
                  {t('footer.terms')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-emerald-400 transition">
                  {t('footer.securityRls', { defaultValue: 'Sécurité & Chiffrement RLS' })}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t dark:border-white/5 border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs dark:text-gray-500 text-gray-500">
          <p>© {new Date().getFullYear()} MY-Wallet PFM. {t('footer.rights')}</p>
          <div className="flex items-center gap-1">
            <span>{t('footer.builtWith', { defaultValue: 'Développé avec' })}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>{t('footer.forAfrica', { defaultValue: 'pour l’Afrique' })}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
