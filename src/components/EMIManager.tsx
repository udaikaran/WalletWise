import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Plus, Calendar, DollarSign, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, addMonths } from 'date-fns'

interface EMI {
  id: string
  name: string
  amount: number
  due_date: string
  remaining_months: number
  created_at: string
}

const emiSchema = yup.object({
  name: yup.string().required('EMI name is required'),
  amount: yup.number().required('Amount is required').min(0, 'Amount must be positive'),
  due_date: yup.string().required('Due date is required'),
  remaining_months: yup.number().required('Remaining months is required').min(1, 'Must be at least 1 month')
})

interface EMIFormData {
  name: string
  amount: number
  due_date: string
  remaining_months: number
}

const EMIManager: React.FC = () => {
  const { user } = useAuth()
  const [emis, setEmis] = useState<EMI[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EMIFormData>({
    resolver: yupResolver(emiSchema)
  })

  useEffect(() => {
    fetchEMIs()
  }, [user])

  const fetchEMIs = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('emis')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })

      if (error) {
        console.error('Error fetching EMIs:', error)
        setEmis([])
        return
      }
      setEmis(data || [])
    } catch (error) {
      console.error('Error fetching EMIs:', error)
      setEmis([])
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: EMIFormData) => {
    if (!user) return

    try {
      const { error } = await supabase.from('emis').insert([
        {
          user_id: user.id,
          name: data.name,
          amount: data.amount,
          due_date: data.due_date,
          remaining_months: data.remaining_months
        }
      ])

      if (error) throw error

      reset()
      setShowForm(false)
      fetchEMIs()
    } catch (error) {
      console.error('Error creating EMI:', error)
    }
  }

  const getStatusColor = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'text-red-600 bg-red-50'
    if (diffDays <= 7) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getStatusIcon = (dueDate: string) => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return <AlertCircle className="w-4 h-4" />
    if (diffDays <= 7) return <Clock className="w-4 h-4" />
    return <CheckCircle className="w-4 h-4" />
  }

  const totalEMIAmount = emis.reduce((sum, emi) => sum + emi.amount, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
        <h2 className="text-3xl font-bold text-gray-900">EMI Manager</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add EMI</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total EMI</h3>
              <p className="text-3xl font-bold text-gray-900">${totalEMIAmount.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Monthly payment</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Active EMIs</h3>
              <p className="text-3xl font-bold text-gray-900">{emis.length}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Total count</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Due This Week</h3>
              <p className="text-3xl font-bold text-gray-900">
                {emis.filter(emi => {
                  const due = new Date(emi.due_date)
                  const today = new Date()
                  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  return diffDays <= 7 && diffDays >= 0
                }).length}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Upcoming payments</p>
        </motion.div>
      </div>

      {/* EMI Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New EMI</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EMI Name
                </label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Car Loan"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    {...register('amount')}
                    type="number"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="500"
                  />
                </div>
                {errors.amount && (
                  <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  {...register('due_date')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.due_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.due_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remaining Months
                </label>
                <input
                  {...register('remaining_months')}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12"
                />
                {errors.remaining_months && (
                  <p className="text-red-600 text-sm mt-1">{errors.remaining_months.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add EMI
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* EMI List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {emis.map((emi, index) => (
          <motion.div
            key={emi.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{emi.name}</h3>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(emi.due_date)}`}>
                {getStatusIcon(emi.due_date)}
                <span>
                  {(() => {
                    const due = new Date(emi.due_date)
                    const today = new Date()
                    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    
                    if (diffDays < 0) return 'Overdue'
                    if (diffDays === 0) return 'Due Today'
                    if (diffDays <= 7) return `Due in ${diffDays} days`
                    return 'On Track'
                  })()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Amount</span>
                <span className="font-semibold text-gray-900">${emi.amount.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Due Date</span>
                <span className="font-semibold text-gray-900">
                  {format(new Date(emi.due_date), 'MMM dd, yyyy')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Remaining</span>
                <span className="font-semibold text-gray-900">{emi.remaining_months} months</span>
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Remaining</span>
                  <span className="font-semibold text-gray-900">
                    ${(emi.amount * emi.remaining_months).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {emis.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No EMIs Found</h3>
          <p className="text-gray-600 mb-4">Start by adding your first EMI to track your loan payments.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First EMI</span>
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default EMIManager