import React from 'react'
import { AppBar, Toolbar, Typography, Button } from '@mui/material'
import { auth } from '../services/firebase'
import { signOut } from 'firebase/auth'
import { useNotify } from '../contexts/NotificationProvider'

export default function NavBar() {
  const notify = useNotify()
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>MessCheck Admin</Typography>
        <Button color="inherit" onClick={() => signOut(auth).then(() => notify({ type: 'info', message: 'Signed out' })).catch(() => notify({ type: 'error', message: 'Sign out failed' }))}>Sign out</Button>
      </Toolbar>
    </AppBar>
  )
}
