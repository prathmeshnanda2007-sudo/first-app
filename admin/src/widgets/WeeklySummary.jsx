import React from 'react'
import { Grid, Paper, Typography, Box, Chip } from '@mui/material'

function TrendIcon({ current, previous }) {
  if (previous == null) return '→'
  if (current > previous) return '↑'
  if (current < previous) return '↓'
  return '→'
}

export default function WeeklySummary({ summaries = [], loading = false, onClick = () => {} }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">Weekly Summary</Typography>
      {loading ? (
        <Typography sx={{ mt: 1 }}>Loading weekly summaries…</Typography>
      ) : (
        <Grid container spacing={1} sx={{ mt: 1 }}>
          {summaries.map(s => (
            <Grid item xs={12} sm={6} md={4} key={s.messId}>
              <Paper sx={{ p: 1, cursor: 'pointer' }} onClick={() => onClick(s.messId)}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2">{s.name}</Typography>
                  <Chip label={s.badge || '—'} size="small" />
                </Box>
                <Typography variant="caption">Week: {s.weekId}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                  <Typography variant="h6">{s.avg != null ? s.avg.toFixed(2) : '—'}</Typography>
                  <Typography variant="body2" color="text.secondary">({s.count || 0})</Typography>
                  <Typography variant="body2" sx={{ ml: 1 }}>{TrendIcon({ current: s.avg, previous: s.prevAvg })}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
