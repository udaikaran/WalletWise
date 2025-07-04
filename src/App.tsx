import React, { useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import BudgetManager from './components/BudgetManager'
import Analytics from './components/Analytics'
import EMIManager from './components/EMIManager'
import AuthForm from './components/AuthForm'

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Listen for navigation events from components
  React.useEffect(() => {
    const handleNavigate = (event: any) => {
      setActiveTab(event.detail)
    }
    
    window.addEventListener('navigate', handleNavigate)
    return () => window.removeEventListener('navigate', handleNavigate)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'budget':
        return <BudgetManager />
      case 'analytics':
        return <Analytics />
      case 'emis':
        return <EMIManager />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App