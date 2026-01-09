import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { Moon, Sun, LogOut, Menu, X, BarChart3, PlusCircle, History as HistoryIcon, Home } from 'lucide-react'
import { useTheme } from 'next-themes'

interface AppLayoutProps {
  children: React.ReactNode
  currentView: string
  onViewChange: (view: string) => void
}

export function AppLayout({ children, currentView, onViewChange }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Home', icon: Home, view: 'home' },
    { name: 'Check-In', icon: PlusCircle, view: 'checkin' },
    { name: 'Dashboard', icon: BarChart3, view: 'dashboard' },
    { name: 'History', icon: HistoryIcon, view: 'history' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                M
              </div>
              <span className="text-xl font-bold">MindTrack</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.view}
                    onClick={() => onViewChange(item.view)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      currentView === item.view
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <div className="hidden md:flex items-center gap-2 ml-2">
                <span className="text-sm text-muted-foreground">{user?.displayName || user?.email}</span>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.view}
                    onClick={() => {
                      onViewChange(item.view)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      currentView === item.view
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              <strong>MindTrack</strong> - Your Mental Wellness Companion
            </p>
            <p className="mt-2">
              Not a substitute for professional mental health care. If you're in crisis, please contact a healthcare provider.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
