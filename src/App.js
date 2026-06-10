import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Trades from './pages/Trades'
import Predictions from './pages/Predictions'
import Wallet from './pages/Wallet'
import Signals from './pages/Signals'
import Layout from './components/Layout'
import BrandingSplash from './components/BrandingSplash'
import './App.css'

export default function App() {
  const [session, setSession]       = useState(null)
  const [loading, setLoading]       = useState(true)
  // Only show splash on very first load of the browser tab
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown')
  })

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.hash || url.searchParams.get('error')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSplashComplete = () => {
    // Mark splash as shown for this browser session
    sessionStorage.setItem('splashShown', 'true')
    setShowSplash(false)
  }

  // Show splash only on first load
  if (showSplash) {
    return <BrandingSplash onComplete={handleSplashComplete} />
  }

  if (loading) return null

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <Layout session={session} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard session={session} />} />
          <Route path="trades" element={<Trades session={session} />} />
          <Route path="signals" element={<Signals />} />
          <Route path="predictions" element={<Predictions session={session} />} />
          <Route path="wallet" element={<Wallet session={session} />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}
