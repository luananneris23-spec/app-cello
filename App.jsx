import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Scales from './pages/Scales'
import ScalePractice from './pages/ScalePractice'
import Tuner from './pages/Tuner'
import Rhythm from './pages/Rhythm'
import Theory from './pages/Theory'
import Dotzauer from './pages/Dotzauer'
import Recordings from './pages/Recordings'
import Progress from './pages/Progress'
import EarTraining from './pages/EarTraining'
import PracticeRoom from './pages/PracticeRoom'
import Auth from './pages/Auth'

// Auth Context
export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <AuthContext.Provider value={{ user, supabase }}>
      <Routes>
        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
        <Route element={user ? <Layout /> : <Navigate to="/auth" />}>
          <Route index element={<Dashboard />} />
          <Route path="scales" element={<Scales />} />
          <Route path="scales/:scaleId" element={<ScalePractice />} />
          <Route path="tuner" element={<Tuner />} />
          <Route path="rhythm" element={<Rhythm />} />
          <Route path="theory" element={<Theory />} />
          <Route path="dotzauer" element={<Dotzauer />} />
          <Route path="recordings" element={<Recordings />} />
          <Route path="progress" element={<Progress />} />
          <Route path="ear-training" element={<EarTraining />} />
          <Route path="practice-room" element={<PracticeRoom />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  )
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: '1.5rem'
    }}>
      <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
        <path d="M30 5 C15 5 5 20 5 38 C5 58 18 72 30 75 C42 72 55 58 55 38 C55 20 45 5 30 5Z"
          stroke="#c9a227" strokeWidth="1.5" fill="none" opacity="0.6"/>
        <path d="M30 15 L30 65 M20 35 Q30 28 40 35" stroke="#c9a227" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="30" cy="70" r="3" fill="#c9a227" opacity="0.8"/>
      </svg>
      <p style={{ fontFamily: 'Playfair Display, serif', color: '#c9a227', fontSize: '0.85rem',
        letterSpacing: '0.2em', textTransform: 'uppercase' }}>Afinando...</p>
    </div>
  )
}
