import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LandingPage } from './features/landing/LandingPage'
import { Dashboard } from './features/dashboard/Dashboard'
import { AuthModal } from './features/auth/AuthModal'
import { ProtectedRoute } from './components/ProtectedRoute'

function MainApp() {
  const { user } = useAuth()
  const [view, setView] = useState<'landing' | 'dashboard'>(() => {
    return window.location.hash === '#dashboard' ? 'dashboard' : 'landing'
  })
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#dashboard') {
        setView('dashboard')
      } else if (window.location.hash === '' || window.location.hash === '#home') {
        setView('landing')
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigateToDashboard = () => {
    if (!user) {
      setIsAuthOpen(true)
      return
    }
    window.location.hash = '#dashboard'
    setView('dashboard')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToLanding = () => {
    window.location.hash = ''
    setView('landing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {view === 'landing' ? (
        <LandingPage
          onOpenDashboard={navigateToDashboard}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      ) : (
        <ProtectedRoute onBackToLanding={navigateToLanding}>
          <Dashboard onBackToLanding={navigateToLanding} />
        </ProtectedRoute>
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false)
          window.location.hash = '#dashboard'
          setView('dashboard')
        }}
      />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}

export default App
