import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Basculer le thème"
      title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
      className={`p-2 rounded-xl transition duration-200 border cursor-pointer flex items-center justify-center ${
        theme === 'dark'
          ? 'bg-gray-900/80 hover:bg-gray-800 text-amber-300 border-white/10 hover:border-amber-400/40'
          : 'bg-white hover:bg-gray-100 text-indigo-600 border-gray-200 shadow-sm'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform hover:-rotate-12" />
      )}
    </button>
  )
}
