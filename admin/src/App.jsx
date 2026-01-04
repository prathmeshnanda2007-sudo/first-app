import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MessDetailPage from './pages/MessDetailPage'
import { AuthProvider, useAuth } from './services/auth'
import { NotificationProvider } from './contexts/NotificationProvider'

const theme = createTheme({ palette: { mode: 'light' } })

function ProtectedRoute({ children }) {
  const { user, userProfile } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!userProfile || userProfile.role !== 'admin') return <div>Access denied</div>
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/messes/:messId" element={<ProtectedRoute><MessDetailPage /></ProtectedRoute>} />
          </Routes>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}
