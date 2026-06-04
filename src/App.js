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
import './App.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="splash">
      <div className="splash-inner">
        <div className="logo-mark">A</div>
        <h1>AkiliTrade</h1>
        <div className="loader-bar"><div className="loader-fill"></div></div>
        <p>Akili ya Kenya, Faida ya Kweli</p>
      </div>
    </div>
  )

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
      </Routes>
    </Router>
  )
}
