import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Typography, Box, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, CircularProgress } from '@mui/material'
import NavBar from '../components/NavBar'
import { db } from '../services/firebase'
import { collection, query, orderBy, where, onSnapshot, doc } from 'firebase/firestore'
import { useNotify } from '../contexts/NotificationProvider'
import AlertsPanel from '../widgets/AlertsPanel'
import HygieneChart from '../widgets/HygieneChart'
import WeeklySummary from '../widgets/WeeklySummary'
import { useAuth } from '../services/auth'
import { doc } from 'firebase/firestore'

  function exportCsv(messes) {
    // synchronous export (small data)
    const header = ['messId', 'name', 'hygieneScore', 'badge']
    const rows = messes.map(m => [m.id, m.name, m.hygieneScore || 0, m.badge || ''])
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'messes.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function exportCsvBackground(messes) {
    // small placeholder for a background export; shows start/info and success/error notifications
    try {
      notify({ type: 'info', message: 'Export started' })
      // simulate async work for large exports
      await new Promise((res) => setTimeout(res, 800))
      exportCsv(messes)
      notify({ type: 'success', message: 'Export completed — CSV downloaded' })
    } catch (e) {
      console.error('Export failed', e)
      notify({ type: 'error', message: 'Export failed' })
    }
  }

export default function DashboardPage() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const notify = useNotify()

  const [messes, setMesses] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loadingMesses, setLoadingMesses] = useState(true)
  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [loadingWeekly, setLoadingWeekly] = useState(true)
  const [weeklySummaries, setWeeklySummaries] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoadingMesses(true)
    setError(null)
    const q = userProfile && userProfile.collegeId
      ? query(collection(db, 'messes'), where('collegeId', '==', userProfile.collegeId), orderBy('hygieneScore', 'desc'))
      : query(collection(db, 'messes'), orderBy('hygieneScore', 'desc'))

    const unsubscribe = onSnapshot(q, snap => {
      setMesses(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoadingMesses(false)
    }, (err) => {
      setError(err.message)
      setLoadingMesses(false)
    })

    return () => unsubscribe()
  }, [userProfile])

  useEffect(() => {
    setLoadingAlerts(true)
    const aQuery = query(collection(db, 'alerts'), where('resolved', '==', false))
    const unsubscribeAlerts = onSnapshot(aQuery, snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      if (userProfile && userProfile.collegeId) {
        const messIds = new Set(messes.map(m => m.id))
        setAlerts(arr.filter(a => messIds.has(a.messId)))
      } else {
        setAlerts(arr)
      }
      setLoadingAlerts(false)
    }, (err) => {
      setError(err.message)
      setLoadingAlerts(false)
    })

    return () => unsubscribeAlerts()
  }, [messes, userProfile])

  // Fetch dashboard summaries (one doc) to avoid N+1 reads
  useEffect(() => {
    let mounted = true
    setLoadingWeekly(true)
    const collegeId = userProfile && userProfile.collegeId ? userProfile.collegeId : 'global'
    const unsub = onSnapshot(doc(db, 'dashboardSummaries', collegeId), snap => {
      if (!mounted) return
      if (!snap.exists()) {
        setWeeklySummaries([])
        setLoadingWeekly(false)
        return
      }
      const data = snap.data()
      const msgs = data.messages ? Object.values(data.messages) : []
      // keep ordering like messes list if possible
      setWeeklySummaries(msgs)
      setLoadingWeekly(false)
    }, (err) => {
      console.error('Failed to load dashboard summaries', err)
      setWeeklySummaries([])
      setLoadingWeekly(false)
    })

    return () => { mounted = false; unsub() }
  }, [userProfile, messes])

  return (
    <>
      <NavBar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4">MessCheck Admin Dashboard</Typography>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Hygiene Scores</Typography>
            {loadingMesses ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
            ) : messes.length === 0 ? (
              <Box sx={{ p: 4 }}>No messes found.</Box>
            ) : (
              <>
                <HygieneChart messes={messes} />
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mess</TableCell>
                      <TableCell>Hygiene Score</TableCell>
                      <TableCell>Badge</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {messes.map(m => (
                      <TableRow key={m.id} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/messes/${m.id}`)}>
                        <TableCell>{m.name}</TableCell>
                        <TableCell>{(m.hygieneScore || 0).toFixed(2)}</TableCell>
                        <TableCell>{m.badge}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Paper>
          <WeeklySummary summaries={weeklySummaries} loading={loadingWeekly} onClick={(messId) => navigate(`/messes/${messId}`)} />
          <Button sx={{ mt: 2, mr: 1 }} variant="outlined" onClick={() => exportCsv(messes)}>Export CSV</Button>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => exportCsvBackground(messes)}>Export (background)</Button>
        </Grid>
        <Grid item xs={12} md={4}>
          <AlertsPanel alerts={alerts} loading={loadingAlerts} />
        </Grid>
      </Grid>    Get-Content .\downloaded-artifacts\backfill-dashboard-verbose-2026-W01\backfill-dashboard-verbose-2026-W01.json | ConvertFrom-Json | Select-Object -First 20 | Format-Table -AutoSize
    </Container>
    </>
  )
}
