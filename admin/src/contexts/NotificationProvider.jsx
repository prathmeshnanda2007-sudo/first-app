import React, { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react'
import { Snackbar, Alert as MuiAlert } from '@mui/material'

const NotificationContext = createContext(null)

// types: 'success' | 'error' | 'warning' | 'info'
export function NotificationProvider({ children }) {
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const recentRef = useRef(new Map())

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0])
      setQueue(q => q.slice(1))
    }
  }, [queue, current])

  const notify = ({ type = 'info', message = '', key = null, ttl = 5000 }) => {
    if (!message) return
    const mk = key || `${type}:${message}`
    const now = Date.now()
    const recent = recentRef.current
    const last = recent.get(mk) || 0
    // dedupe within ttl window
    if (now - last < ttl) return
    recent.set(mk, now)
    // clear old entries
    for (const [k, t] of recent.entries()) {
      if (now - t > 60000) recent.delete(k)
    }
    setQueue(q => [...q, { key: mk, type, message, ttl }])
  }

  const handleClose = () => {
    setCurrent(null)
  }

  // auto-dismiss
  useEffect(() => {
    if (!current) return
    const t = setTimeout(() => setCurrent(null), current.ttl || 4000)
    return () => clearTimeout(t)
  }, [current])

  const value = useMemo(() => ({ notify }), [])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={!!current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        aria-live={current && current.type === 'error' ? 'assertive' : 'polite'}
      >
        {current ? (
          <MuiAlert onClose={handleClose} severity={current.type} variant="filled" sx={{ width: '100%' }} role="alert">
            {current.message}
          </MuiAlert>
        ) : null}
      </Snackbar>
    </NotificationContext.Provider>
  )
}

export function useNotify() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider')
  return ctx.notify
}
