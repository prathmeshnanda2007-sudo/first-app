import React, { useState } from 'react'
import { Paper, Typography, List, ListItem, ListItemText, Chip, Box, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material'
import { db } from '../services/firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { useNotify } from '../contexts/NotificationProvider'

export default function AlertsPanel({ alerts, loading }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [resolvingId, setResolvingId] = useState(null)
  const notify = useNotify()

  const openConfirm = (alertObj) => {
    setSelectedAlert(alertObj)
    setConfirmOpen(true)
  }

  const closeConfirm = () => {
    setConfirmOpen(false)
    setSelectedAlert(null)
  }

  const resolveAlert = async (id) => {
    setResolvingId(id)
    try {
      await updateDoc(doc(db, 'alerts', id), { resolved: true })
      notify({ type: 'success', message: 'Alert resolved' })
    } catch (e) {
      console.error('Failed to resolve alert', e)
      notify({ type: 'error', message: 'Failed to resolve alert' })
    } finally {
      setResolvingId(null)
      closeConfirm()
    }
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Alerts</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} aria-label="loading-alerts" /></Box>
      ) : (
        <List>
          {alerts.length === 0 && <Typography>No alerts</Typography>}
          {alerts.map(a => (
            <ListItem key={a.id} secondaryAction={
              <Button aria-label={`resolve-alert-${a.id}`} variant="outlined" size="small" onClick={() => openConfirm(a)}>
                Resolve
              </Button>
            }>
              <ListItemText id={`alert-${a.id}`} primary={a.message} secondary={a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString() : ''} />
              <Chip label={a.type} />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog
        open={confirmOpen}
        onClose={closeConfirm}
        aria-labelledby={selectedAlert ? `dialog-title-${selectedAlert.id}` : undefined}
        aria-describedby={selectedAlert ? `dialog-desc-${selectedAlert.id}` : undefined}
      >
        <DialogTitle id={selectedAlert ? `dialog-title-${selectedAlert.id}` : undefined}>Resolve alert?</DialogTitle>
        <DialogContent>
          <DialogContentText id={selectedAlert ? `dialog-desc-${selectedAlert.id}` : undefined}>
            Are you sure you want to mark this alert as resolved? This action can be reverted by re-opening an alert manually.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} aria-label="cancel-resolve">Cancel</Button>
          <Button onClick={() => resolveAlert(selectedAlert.id)} aria-label="confirm-resolve" variant="contained" disabled={resolvingId === (selectedAlert && selectedAlert.id)}>
            {resolvingId === (selectedAlert && selectedAlert.id) ? <CircularProgress size={18} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications handled by global NotificationProvider */}
    </Paper>
  )
}
