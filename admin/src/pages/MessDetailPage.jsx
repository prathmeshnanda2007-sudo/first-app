import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Typography, Paper, Box, ButtonGroup, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material'
import NavBar from '../components/NavBar'
import TrendChart from '../widgets/TrendChart'
import { db } from '../services/firebase'
import { collection, query, orderBy, onSnapshot, doc, getDocs, deleteDoc } from 'firebase/firestore'
import { useNotify } from '../contexts/NotificationProvider'

function computeMovingAverage(points, windowSize = 7) {
  // points: [{label, value}] with label ascending
  const res = []
  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const slice = points.slice(start, i + 1)
    const avg = slice.reduce((s, p) => s + p.value, 0) / slice.length
    res.push({ label: points[i].label, value: Number(avg.toFixed(2)) })
  }
  return res
}

export default function MessDetailPage() {
  const { messId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [daily, setDaily] = useState([])
  const [weekly, setWeekly] = useState([])
  const [mode, setMode] = useState('daily') // 'daily' or 'weekly'
  const [messName, setMessName] = useState('')
  const notify = useNotify()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!messId) return

    // fetch mess name (modular style)
    const unsubMess = onSnapshot(doc(db, 'messes', messId), snap => {
      if (snap.exists()) setMessName(snap.data().name || '')
    })

    // subscribe based on mode
    setLoading(true)
    let unsubscribe = () => {}
    if (mode === 'daily') {
      const q = query(collection(db, 'aggregates', messId, 'daily'), orderBy('date', 'asc'))
      unsubscribe = onSnapshot(q, snap => {
        const arr = snap.docs.map(d => {
          const data = d.data()
          const avg = data.count ? (data.hygieneSum / data.count) : 0
          return { label: data.date, value: Number(avg.toFixed(2)) }
        })
        setDaily(arr)
        setLoading(false)
      }, (err) => {
        console.error('Failed to load daily aggregates', err)
        setDaily([])
        setLoading(false)
      })
    } else {
      const q = query(collection(db, 'aggregates', messId, 'weekly'), orderBy('weekStart', 'asc'))
      unsubscribe = onSnapshot(q, snap => {
        const arr = snap.docs.map(d => {
          const data = d.data()
          return { label: data.weekId || d.id, value: Number((data.hygieneAvg || 0).toFixed(2)), weekId: data.weekId || d.id, badge: data.badge || '', count: data.count || 0 }
        })
        setWeekly(arr)
        setLoading(false)
      }, (err) => {
        console.error('Failed to load weekly aggregates', err)
        setWeekly([])
        setLoading(false)
      })
    }

    return () => { unsubscribe(); unsubMess(); }
  }, [messId, mode])

  const dataPoints = mode === 'daily' ? daily : weekly

  return (
    <>
      <NavBar />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <ButtonGroup sx={{ mb: 2 }}>
          <Button onClick={() => navigate(-1)}>Back</Button>
          <Button color="error" onClick={() => setConfirmDeleteOpen(true)}>Delete Mess</Button>
          <Button variant="outlined" onClick={async () => {
            notify({ type: 'info', message: 'Export started' })
            try {
              // fetch daily aggregates
              const snap = await getDocs(collection(db, 'aggregates', messId, 'daily'))
              const rows = snap.docs.map(d => ({ date: d.id, ...d.data() }))
              const header = ['date','hygieneAvg','count']
              const csvRows = rows.map(r => [r.date, r.hygieneSum && r.count ? (r.hygieneSum / r.count).toFixed(2) : '', r.count || 0])
              const csv = [header.join(','), ...csvRows.map(r => r.join(','))].join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${messId}-aggregates.csv`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
              notify({ type: 'success', message: 'Export completed — CSV downloaded' })
            } catch (e) {
              console.error('Export failed', e)
              notify({ type: 'error', message: 'Export failed' })
            }
          }}>Export Aggregates</Button>
        </ButtonGroup>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5">{messName || 'Mess Details'}</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 2 }}>
            <Button variant={mode === 'daily' ? 'contained' : 'outlined'} onClick={() => setMode('daily')}>Daily</Button>
            <Button variant={mode === 'weekly' ? 'contained' : 'outlined'} onClick={() => setMode('weekly')}>Weekly</Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : dataPoints.length === 0 ? (
            <Box sx={{ p: 4 }}>No aggregate data available for this mess.</Box>
          ) : (
            <>
              <TrendChart dataPoints={dataPoints} label={mode === 'daily' ? 'Daily Hygiene Score' : 'Weekly Hygiene Average'} />
              {mode === 'weekly' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">Weekly summary</Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {weekly.map(w => (
                      <li key={w.weekId}>{w.weekId}: Avg {w.value} (count: {w.count}) — {w.badge}</li>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Paper>
        <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-desc">
          <DialogTitle id="delete-dialog-title">Delete mess?</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-dialog-desc">Are you sure you want to delete this mess? This will remove the mess document and may affect aggregates and reports.</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={async () => {
              setDeleting(true)
              try {
                await deleteDoc(doc(db, 'messes', messId))
                notify({ type: 'success', message: 'Mess deleted' })
                navigate(-1)
              } catch (e) {
                console.error('Delete failed', e)
                notify({ type: 'error', message: 'Delete failed' })
              } finally {
                setDeleting(false)
                setConfirmDeleteOpen(false)
              }
            }} disabled={deleting}>{deleting ? <CircularProgress size={18} /> : 'Delete'}</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  )
}
