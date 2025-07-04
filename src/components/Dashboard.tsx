import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, Plus, PieChart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  remainingBalance: number
  monthlyChange: number
  upcomingEmis: number
  categoriesOverBudget: number
}

interface QuickActionProps {
  icon: React.ComponentType<any>
  title: string
  description: string
  color: string
  onClick: () => void
}

const QuickActionCard: React.FC<QuickActionProps> = ({ icon: Icon, title, description, color, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 text-left ${color} rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md w-full`}
  >
    <Icon className="w-6 h-6 text-blue-600 mb-2" />
    <h4 className="font-medium text-gray-900">{title}</h4>
    <p className="text-sm text-gray-600">{description}</p>
  </button>
)

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    remainingBalance: 0,
    monthlyChange: 0,
    upcomingEmis: 0,
    categoriesOverBudget: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardStats()
    }
  }, [user])

  const fetchDashboardStats = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch user's budgets
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)

      if (budgetsError) {
        console.error('Error fetching budgets:', budgetsError)
      }

      // Fetch current month's transactions if we have budgets
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      let transactions = []
      if (budgets && budgets.length > 0) {
        const budgetIds = budgets.map(b => b.id)
        const { data: transactionData, error: transactionsError } = await supabase
          .from('transactions')
          .select('amount')
          .in('budget_id', budgetIds)
          .gte('transaction_date', startOfMonth.toISOString().split('T')[0])

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError)
        } else {
          transactions = transactionData || []
        }
      }

      // Fetch upcoming EMIs
      const { data: emis, error: emisError } = await supabase
        .from('emis')
        .select('*')
        .eq('user_id', user.id)
        .gt('remaining_months', 0)

      if (emisError) {
        console.error('Error fetching EMIs:', emisError)
      }

      const totalIncome = budgets?.reduce((sum, budget) => sum + budget.total_income, 0) || 0
      const totalExpenses = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
      const remainingBalance = totalIncome - totalExpenses
      const upcomingEmis = emis?.length || 0

      setStats({
        totalIncome,
        totalExpenses,
        remainingBalance,
        monthlyChange: 5.2, // Mock data - would calculate from previous month
        upcomingEmis,
        categoriesOverBudget: 1 // Mock data
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Set default values when there's an error
      setStats({
        totalIncome: 0,
        totalExpenses: 0,
        remainingBalance: 0,
        monthlyChange: 0,
        upcomingEmis: 0,
        categoriesOverBudget: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add_transaction':
        // Navigate to budget manager for now since we don't have a separate transaction form
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'budget' }))
        break
      case 'set_budget':
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'budget' }))
        break
      case 'view_analytics':
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'analytics' }))
        break
    }
  }

  const statCards = [
    {
      title: 'Total Income',
      value: `$${stats.totalIncome.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: `+${stats.monthlyChange}%`,
      positive: true
    },
    {
      title: 'Total Expenses',
      value: `$${stats.totalExpenses.toLocaleString()}`,
      icon: TrendingDown,
      color: 'bg-red-500',
      change: '-2.3%',
      positive: false
    },
    {
      title: 'Remaining Balance',
      value: `$${stats.remainingBalance.toLocaleString()}`,
      icon: Target,
      color: 'bg-blue-500',
      change: `${stats.remainingBalance > 0 ? '+' : ''}${((stats.remainingBalance / stats.totalIncome) * 100).toFixed(1)}%`,
      positive: stats.remainingBalance > 0
    },
    {
      title: 'Upcoming EMIs',
      value: stats.upcomingEmis.toString(),
      icon: Calendar,
      color: 'bg-purple-500',
      change: 'Next 7 days',
      positive: true
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center space-x-1 text-sm ${
                  card.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.positive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{card.change}</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Alerts */}
      {(stats.remainingBalance < stats.totalIncome * 0.1 || stats.categoriesOverBudget > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <h3 className="text-lg font-semibold text-amber-900">Budget Alerts</h3>
          </div>
          <div className="space-y-3">
            {stats.remainingBalance < stats.totalIncome * 0.1 && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <p className="text-amber-800">
                  Low balance alert: Only ${stats.remainingBalance.toLocaleString()} remaining this month
                </p>
              </div>
            )}
            {stats.categoriesOverBudget > 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-amber-800">
                  {stats.categoriesOverBudget} category over budget limit
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            icon={Plus}
            title="Add Transaction"
            description="Record a new expense"
            color="bg-blue-50 hover:bg-blue-100"
            onClick={() => handleQuickAction('add_transaction')}
          />
          <QuickActionCard
            icon={Target}
            title="Set Budget"
            description="Create new budget plan"
            color="bg-green-50 hover:bg-green-100"
            onClick={() => handleQuickAction('set_budget')}
          />
          <QuickActionCard
            icon={PieChart}
            title="View Analytics"
            description="See spending insights"
            color="bg-purple-50 hover:bg-purple-100"
            onClick={() => handleQuickAction('view_analytics')}
          />
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard