import React, { useState } from 'react'
import { Container, TextField, Button, Typography, Box } from '@mui/material'
import { useAuth } from '../services/auth'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const nav = useNavigate()

  const onSubmit = async () => {
    try {
      await login(email, password)
      nav('/')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5">Admin Login</Typography>
        <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <Typography color="error">{error}</Typography>}
        <Button variant="contained" onClick={onSubmit}>Sign in</Button>
      </Box>
    </Container>
  )
}
