import OpenAI from 'openai'

const apiKey = import.meta.env.VITE_OPENAI_API_KEY

let openai: OpenAI | null = null

if (apiKey) {
  openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  })
} else {
  console.warn('OpenAI API key not found. AI features will use fallback responses.')
}

export interface BudgetAnalysis {
  message: string
  budgetData?: {
    income?: number
    expenses?: Record<string, number>
    suggestions?: string[]
  }
  action?: 'update_budget' | 'add_transaction' | 'set_category_limit'
}

export const analyzeFinancialInput = async (
  input: string,
  context?: {
    currentIncome?: number
    currentExpenses?: Record<string, number>
    recentTransactions?: Array<{ amount: number; category: string; description: string }>
  }
): Promise<BudgetAnalysis> => {
  try {
    if (!openai) {
      // Fallback when OpenAI is not available
      return {
        message: "AI assistant is currently unavailable. I can still help you parse your budget details manually.",
        budgetData: extractBudgetDataFallback(input)
      }
    }

    const systemPrompt = `You are WalletWise AI, a personal finance assistant. Help users manage their budgets by:
1. Parsing financial inputs (income, expenses, transactions)
2. Providing actionable budget advice
3. Suggesting optimizations
4. Extracting structured data from natural language

Current context:
- Income: $${context?.currentIncome || 0}
- Expenses: ${JSON.stringify(context?.currentExpenses || {})}
- Recent transactions: ${JSON.stringify(context?.recentTransactions || [])}

Respond with helpful advice and extract any budget data. Be conversational and supportive.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const response = completion.choices[0]?.message?.content || ''
    
    // Parse structured data from response
    const budgetData = extractBudgetData(input, response)
    
    return {
      message: response,
      budgetData,
      action: determineAction(input)
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return {
      message: "I'm having trouble processing your request right now. Please try again or enter your budget details manually.",
      budgetData: extractBudgetDataFallback(input)
    }
  }
}

const extractBudgetData = (input: string, aiResponse: string) => {
  const lowerInput = input.toLowerCase()
  const budgetData: any = {}
  
  // Extract income
  const incomeMatch = lowerInput.match(/income[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/)
  if (incomeMatch) {
    budgetData.income = parseFloat(incomeMatch[1].replace(',', ''))
  }
  
  // Extract expenses by category
  const categories = ['rent', 'groceries', 'transportation', 'entertainment', 'healthcare', 'savings', 'utilities']
  const expenses: Record<string, number> = {}
  
  categories.forEach(category => {
    const regex = new RegExp(`${category}[:\\s]*\\$?(\\d+(?:,\\d{3})*(?:\\.\\d{2})?)`, 'i')
    const match = lowerInput.match(regex)
    if (match) {
      expenses[category] = parseFloat(match[1].replace(',', ''))
    }
  })
  
  if (Object.keys(expenses).length > 0) {
    budgetData.expenses = expenses
  }
  
  // Extract suggestions from AI response
  const suggestions = []
  if (aiResponse.includes('save') || aiResponse.includes('reduce')) {
    suggestions.push('Consider reducing discretionary spending')
  }
  if (aiResponse.includes('emergency') || aiResponse.includes('fund')) {
    suggestions.push('Build an emergency fund')
  }
  
  if (suggestions.length > 0) {
    budgetData.suggestions = suggestions
  }
  
  return Object.keys(budgetData).length > 0 ? budgetData : undefined
}

const extractBudgetDataFallback = (input: string) => {
  // Fallback parsing without AI
  return extractBudgetData(input, '')
}

const determineAction = (input: string): BudgetAnalysis['action'] => {
  const lowerInput = input.toLowerCase()
  
  if (lowerInput.includes('transaction') || lowerInput.includes('spent') || lowerInput.includes('bought')) {
    return 'add_transaction'
  }
  if (lowerInput.includes('budget') || lowerInput.includes('limit')) {
    return 'set_category_limit'
  }
  if (lowerInput.includes('income') || lowerInput.includes('salary')) {
    return 'update_budget'
  }
  
  return 'update_budget'
}