import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Mic, Upload, Send, Brain, DollarSign, Home, ShoppingCart, Car, Coffee, Heart, PiggyBank, MoreHorizontal, MicOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { analyzeFinancialInput, BudgetAnalysis } from '../lib/openai'

const categories = [
  { id: 'rent', name: 'Rent', icon: Home, color: 'bg-blue-500' },
  { id: 'groceries', name: 'Groceries', icon: ShoppingCart, color: 'bg-green-500' },
  { id: 'transportation', name: 'Transportation', icon: Car, color: 'bg-yellow-500' },
  { id: 'entertainment', name: 'Entertainment', icon: Coffee, color: 'bg-purple-500' },
  { id: 'healthcare', name: 'Healthcare', icon: Heart, color: 'bg-red-500' },
  { id: 'savings', name: 'Savings', icon: PiggyBank, color: 'bg-indigo-500' },
  { id: 'miscellaneous', name: 'Miscellaneous', icon: MoreHorizontal, color: 'bg-gray-500' }
]

const budgetSchema = yup.object({
  income: yup.number().required('Income is required').min(0, 'Income must be positive'),
  budgetName: yup.string().required('Budget name is required'),
  categoryBudgets: yup.object().shape(
    categories.reduce((acc, category) => {
      acc[category.id] = yup.number().min(0, 'Amount must be positive').required('Amount is required')
      return acc
    }, {} as any)
  )
})

interface BudgetFormData {
  income: number
  budgetName: string
  categoryBudgets: Record<string, number>
}

const BudgetManager: React.FC = () => {
  const { user } = useAuth()
  const [isListening, setIsListening] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [conversationHistory, setConversationHistory] = useState<Array<{type: 'user' | 'ai', message: string}>>([])
  const [currentBudgetContext, setCurrentBudgetContext] = useState<any>({})

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<BudgetFormData>({
    resolver: yupResolver(budgetSchema),
    defaultValues: {
      income: 0,
      budgetName: '',
      categoryBudgets: categories.reduce((acc, category) => {
        acc[category.id] = 0
        return acc
      }, {} as Record<string, number>)
    }
  })

  const income = watch('income')
  const categoryBudgets = watch('categoryBudgets')
  const totalBudget = Object.values(categoryBudgets).reduce((sum, amount) => sum + (amount || 0), 0)
  const remainingBudget = income - totalBudget

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setTextInput(transcript)
        processAIInput(transcript)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      if (isListening) {
        recognition.start()
      }
    }
  }, [isListening])

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      setIsListening(true)
    } else {
      alert('Speech recognition is not supported in this browser')
    }
  }

  const stopListening = () => {
    setIsListening(false)
  }

  const processAIInput = async (input: string) => {
    setIsProcessing(true)
    
    // Add user message to conversation
    const newConversation = [...conversationHistory, { type: 'user' as const, message: input }]
    setConversationHistory(newConversation)
    
    try {
      // Get current form values for context
      const currentValues = watch()
      const context = {
        currentIncome: currentValues.income,
        currentExpenses: currentValues.categoryBudgets,
        ...currentBudgetContext
      }
      
      const response = await analyzeFinancialInput(input, context)
      setAiResponse(response.message)
      
      // Add AI response to conversation
      setConversationHistory(prev => [...prev, { type: 'ai', message: response.message }])
      
      // Parse and populate form if budget data detected
      if (response.budgetData) {
        await populateFormFromAI(response.budgetData)
        setCurrentBudgetContext(prev => ({ ...prev, ...response.budgetData }))
      }
    } catch (error) {
      console.error('Error processing AI input:', error)
      const errorMessage = 'Sorry, I encountered an error processing your request. Please try again.'
      setAiResponse(errorMessage)
      setConversationHistory(prev => [...prev, { type: 'ai', message: errorMessage }])
    } finally {
      setIsProcessing(false)
    }
  }

  const populateFormFromAI = async (budgetData: any) => {
    if (budgetData.income) {
      setValue('income', budgetData.income)
    }
    
    if (budgetData.expenses) {
      Object.entries(budgetData.expenses).forEach(([category, amount]) => {
        if (categories.find(cat => cat.id === category)) {
          setValue(`categoryBudgets.${category}`, amount as number)
        }
      })
    }
    
    // Auto-generate budget name if not set
    const currentBudgetName = watch('budgetName')
    if (!currentBudgetName) {
      const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      setValue('budgetName', `${monthYear} Budget`)
    }
  }

  const onSubmit = async (data: BudgetFormData) => {
    if (!user) return

    setIsProcessing(true)
    try {
      // Save budget to database
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .insert([
          {
            user_id: user.id,
            name: data.budgetName,
            total_income: data.income,
            remaining_balance: remainingBudget,
            status: 'active'
          }
        ])
        .select()
        .single()

      if (budgetError) throw budgetError

      const successMessage = `Budget "${data.budgetName}" created successfully! You have $${remainingBudget.toLocaleString()} remaining. Great job planning your finances!`
      setAiResponse(successMessage)
      setConversationHistory(prev => [...prev, { type: 'ai', message: successMessage }])
      reset()
      setCurrentBudgetContext({})
      
      // Dispatch event to update other components
      window.dispatchEvent(new CustomEvent('budgetUpdated'))
    } catch (error) {
      console.error('Error creating budget:', error)
      const errorMessage = 'Sorry, there was an error creating your budget. Please try again.'
      setAiResponse(errorMessage)
      setConversationHistory(prev => [...prev, { type: 'ai', message: errorMessage }])
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Budget Manager</h2>
        <div className="text-sm text-gray-500">
          AI-powered budget creation
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Input Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Brain className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">WalletWise AI Assistant</h3>
          </div>

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <div className="mb-4 max-h-40 overflow-y-auto space-y-2">
              {conversationHistory.slice(-4).map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg text-sm ${
                    msg.type === 'user'
                      ? 'bg-blue-50 text-blue-800 ml-4'
                      : 'bg-gray-50 text-gray-800 mr-4'
                  }`}
                >
                  <span className="font-medium">{msg.type === 'user' ? 'You: ' : 'AI: '}</span>
                  {msg.message}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tell me about your budget
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="e.g., 'My income is $3000, rent is $1000, groceries are $300' or 'Reduce my entertainment budget by $100'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => processAIInput(textInput)}
                disabled={isProcessing || !textInput.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{isProcessing ? 'Processing...' : 'Send'}</span>
              </button>
              
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                  isListening
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isListening ? 'Listening...' : 'Voice'}</span>
              </button>
              
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>

            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <Brain className="w-5 h-5 text-blue-600 mt-0.5" />
                  <p className="text-blue-800">{aiResponse}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Budget Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Budget Details</h3>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Name
              </label>
              <input
                {...register('budgetName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., January 2024 Budget"
              />
              {errors.budgetName && (
                <p className="text-red-600 text-sm mt-1">{errors.budgetName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Income
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  {...register('income')}
                  type="number"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="3000"
                />
              </div>
              {errors.income && (
                <p className="text-red-600 text-sm mt-1">{errors.income.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Category Budgets
              </label>
              <div className="space-y-3">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <div key={category.id} className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${category.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {category.name}
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <input
                            {...register(`categoryBudgets.${category.id}`)}
                            type="number"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Total Budget:</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${totalBudget.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Remaining:</span>
                <span className={`text-sm font-semibold ${
                  remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${remainingBudget.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Creating Budget...' : 'Create Budget'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default BudgetManager