import { useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { LandingPage } from '@/components/LandingPage'
import { AppLayout } from '@/components/AppLayout'
import { CheckInForm } from '@/components/CheckInForm'
import { Dashboard } from '@/components/Dashboard'
import { History } from '@/components/History'
import { Toaster } from '@/components/ui/sonner'

function AppContent() {
  const { user, isLoading } = useAuth()
  const [currentView, setCurrentView] = useState('home')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  const renderView = () => {
    switch (currentView) {
      case 'checkin':
        return (
          <div className="max-w-2xl mx-auto">
            <CheckInForm onSuccess={() => setCurrentView('dashboard')} />
          </div>
        )
      case 'dashboard':
        return <Dashboard />
      case 'history':
        return <History />
      default:
        return (
          <div className="text-center py-12 space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Welcome to MindTrack</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Track your mental wellness journey with daily check-ins and AI-powered insights
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button
                onClick={() => setCurrentView('checkin')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:opacity-90 transition-opacity"
              >
                Daily Check-In
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-6 py-3 bg-accent text-accent-foreground rounded-md font-semibold hover:opacity-90 transition-opacity"
              >
                View Dashboard
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <AppLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </AppLayout>
  )
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App 