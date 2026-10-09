import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './lib/i18n'
import { ThemeProvider } from './context/ThemeContext'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Enregistrement PWA automatique avec rechargement transparent lors des mises à jour
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
