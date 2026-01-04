import React, { createContext, useContext, useEffect, useState } from 'react'
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth'
import { auth, db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const docRef = doc(db, 'users', u.uid)
        const snap = await getDoc(docRef)
        setUserProfile(snap.exists() ? snap.data() : null)
      } else {
        setUserProfile(null)
      }
    })
  }, [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)

  return <AuthContext.Provider value={{ user, userProfile, login }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
