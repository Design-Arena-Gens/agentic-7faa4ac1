'use client'

import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'

interface Message {
  id: string
  type: 'user' | 'agent'
  text: string
  timestamp: Date
}

interface Meal {
  id: string
  type: string
  food: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  timestamp: Date
}

interface DailyStats {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  mealCount: number
}

export default function DietTrackerAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      text: "👋 Hello! I'm your Diet Tracker Agent. I can help you log meals, track calories, and provide insights about your eating habits. Try saying things like 'I had oatmeal for breakfast' or 'Log my lunch: chicken salad'",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [meals, setMeals] = useState<Meal[]>([])
  const [stats, setStats] = useState<DailyStats>({
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealCount: 0
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load data from localStorage
    const savedMeals = localStorage.getItem('dietMeals')
    if (savedMeals) {
      const parsed = JSON.parse(savedMeals)
      const mealsWithDates = parsed.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }))
      setMeals(mealsWithDates)
      calculateStats(mealsWithDates)
    }
  }, [])

  useEffect(() => {
    // Save meals to localStorage
    if (meals.length > 0) {
      localStorage.setItem('dietMeals', JSON.stringify(meals))
    }
  }, [meals])

  const calculateStats = (mealList: Meal[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayMeals = mealList.filter(m => {
      const mealDate = new Date(m.timestamp)
      mealDate.setHours(0, 0, 0, 0)
      return mealDate.getTime() === today.getTime()
    })

    const newStats = todayMeals.reduce((acc, meal) => ({
      totalCalories: acc.totalCalories + (meal.calories || 0),
      totalProtein: acc.totalProtein + (meal.protein || 0),
      totalCarbs: acc.totalCarbs + (meal.carbs || 0),
      totalFat: acc.totalFat + (meal.fat || 0),
      mealCount: acc.mealCount + 1
    }), {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      mealCount: 0
    })

    setStats(newStats)
  }

  const parseNutritionInfo = (food: string): Partial<Meal> => {
    const nutritionDB: Record<string, any> = {
      'oatmeal': { calories: 300, protein: 10, carbs: 54, fat: 6 },
      'chicken salad': { calories: 350, protein: 35, carbs: 15, fat: 15 },
      'salmon': { calories: 400, protein: 40, carbs: 0, fat: 24 },
      'rice': { calories: 200, protein: 4, carbs: 45, fat: 0.5 },
      'broccoli': { calories: 50, protein: 4, carbs: 10, fat: 0.5 },
      'eggs': { calories: 140, protein: 12, carbs: 1, fat: 10 },
      'avocado': { calories: 240, protein: 3, carbs: 12, fat: 22 },
      'banana': { calories: 105, protein: 1, carbs: 27, fat: 0.4 },
      'greek yogurt': { calories: 150, protein: 15, carbs: 8, fat: 8 },
      'apple': { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
      'almonds': { calories: 160, protein: 6, carbs: 6, fat: 14 },
      'pasta': { calories: 350, protein: 12, carbs: 70, fat: 2 },
      'burger': { calories: 550, protein: 30, carbs: 45, fat: 28 },
      'pizza': { calories: 450, protein: 20, carbs: 50, fat: 18 },
      'steak': { calories: 500, protein: 50, carbs: 0, fat: 30 }
    }

    const lowerFood = food.toLowerCase()
    for (const [key, value] of Object.entries(nutritionDB)) {
      if (lowerFood.includes(key)) {
        return value
      }
    }

    return { calories: 250, protein: 10, carbs: 30, fat: 10 }
  }

  const processMessage = (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])

    setTimeout(() => {
      let agentResponse = ''
      let newMeal: Meal | null = null

      const lowerText = text.toLowerCase()

      // Meal logging patterns
      if (lowerText.includes('breakfast') || lowerText.includes('lunch') ||
          lowerText.includes('dinner') || lowerText.includes('snack') ||
          lowerText.includes('ate') || lowerText.includes('had')) {

        let mealType = 'snack'
        if (lowerText.includes('breakfast')) mealType = 'breakfast'
        else if (lowerText.includes('lunch')) mealType = 'lunch'
        else if (lowerText.includes('dinner')) mealType = 'dinner'

        const food = text.replace(/i (had|ate)|for (breakfast|lunch|dinner)|log my (breakfast|lunch|dinner):/gi, '').trim()
        const nutrition = parseNutritionInfo(food)

        newMeal = {
          id: Date.now().toString(),
          type: mealType,
          food,
          ...nutrition,
          timestamp: new Date()
        }

        const updatedMeals = [...meals, newMeal]
        setMeals(updatedMeals)
        calculateStats(updatedMeals)

        agentResponse = `✅ Logged ${mealType}: ${food}\n📊 Estimated: ${nutrition.calories} cal, ${nutrition.protein}g protein, ${nutrition.carbs}g carbs, ${nutrition.fat}g fat`
      }
      // Summary request
      else if (lowerText.includes('summary') || lowerText.includes('today') || lowerText.includes('stats')) {
        agentResponse = `📊 Today's Summary:\n• Total Calories: ${stats.totalCalories}\n• Protein: ${stats.totalProtein}g\n• Carbs: ${stats.totalCarbs}g\n• Fat: ${stats.totalFat}g\n• Meals: ${stats.mealCount}`
      }
      // Advice request
      else if (lowerText.includes('advice') || lowerText.includes('suggest') || lowerText.includes('recommend')) {
        const proteinRatio = stats.totalCalories > 0 ? (stats.totalProtein * 4 / stats.totalCalories * 100) : 0

        if (stats.totalCalories < 1500) {
          agentResponse = "💡 You're at low calorie intake today. Consider adding a balanced meal with lean protein and complex carbs."
        } else if (proteinRatio < 20) {
          agentResponse = "💡 Try increasing your protein intake. Good sources: chicken, fish, eggs, or greek yogurt."
        } else {
          agentResponse = "✨ Great job! Your nutrition looks balanced today. Keep up the good work!"
        }
      }
      // Clear data
      else if (lowerText.includes('clear') || lowerText.includes('reset')) {
        setMeals([])
        calculateStats([])
        localStorage.removeItem('dietMeals')
        agentResponse = "🔄 All meal data has been cleared. Starting fresh!"
      }
      // Default response
      else {
        agentResponse = "I can help you:\n• Log meals (e.g., 'I had eggs for breakfast')\n• View your daily summary ('Show today's stats')\n• Get nutrition advice ('Give me advice')\n• Clear data ('Reset my meals')"
      }

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        text: agentResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, agentMsg])
    }, 500)
  }

  const handleSend = () => {
    if (input.trim()) {
      processMessage(input)
      setInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  const todayMeals = meals.filter(m => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const mealDate = new Date(m.timestamp)
    mealDate.setHours(0, 0, 0, 0)
    return mealDate.getTime() === today.getTime()
  })

  return (
    <div className="container">
      <div className="header">
        <h1>🍎 Diet Tracker Agent</h1>
        <p>Your AI-powered daily nutrition companion</p>
      </div>

      <div className="main-grid">
        <div className="card">
          <h2>💬 Chat with Agent</h2>
          <div className="chat-container">
            <div className="messages">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.type}`}>
                  <strong>{msg.type === 'user' ? 'You' : 'Agent'}</strong>
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="input-group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
              />
              <button className="btn" onClick={handleSend}>
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>📋 Today's Meals</h2>
          {todayMeals.length === 0 ? (
            <div className="empty-state">
              No meals logged today. Start by telling the agent what you ate!
            </div>
          ) : (
            <div className="meal-list">
              {todayMeals.map(meal => (
                <div key={meal.id} className="meal-item">
                  <h3>{meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}</h3>
                  <p><strong>{meal.food}</strong></p>
                  <p>{meal.calories} cal | {meal.protein}g protein | {meal.carbs}g carbs | {meal.fat}g fat</p>
                  <p className="time">{format(meal.timestamp, 'h:mm a')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>📊 Daily Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Calories</h3>
            <p>{stats.totalCalories}</p>
          </div>
          <div className="stat-card">
            <h3>Protein</h3>
            <p>{stats.totalProtein}g</p>
          </div>
          <div className="stat-card">
            <h3>Carbs</h3>
            <p>{stats.totalCarbs}g</p>
          </div>
          <div className="stat-card">
            <h3>Fat</h3>
            <p>{stats.totalFat}g</p>
          </div>
          <div className="stat-card">
            <h3>Meals</h3>
            <p>{stats.mealCount}</p>
          </div>
        </div>

        {stats.mealCount > 0 && (
          <div className="suggestions">
            <h3>💡 Daily Insights</h3>
            <ul>
              <li>Target: 2000-2500 calories/day for average adult</li>
              <li>Protein should be 15-30% of total calories</li>
              <li>Aim for 25-30g of fiber daily</li>
              <li>Stay hydrated with 8+ glasses of water</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
