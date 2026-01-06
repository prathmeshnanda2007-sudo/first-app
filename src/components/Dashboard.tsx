import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { blink } from '@/lib/blink'
import { useAuth } from '@/contexts/AuthContext'
import { CheckIn, MoodAnalysis } from '@/types'
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Activity, Brain } from 'lucide-react'
import { toast } from 'sonner'

export function Dashboard() {
  const { user } = useAuth()
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null)
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)

  useEffect(() => {
    loadCheckIns()
  }, [user])

  const loadCheckIns = async () => {
    if (!user) return

    try {
      const data = await blink.db.checkIns.list({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        limit: 30,
      })
      setCheckIns(data)
    } catch (error) {
      console.error('Error loading check-ins:', error)
      toast.error('Failed to load check-ins')
    } finally {
      setIsLoading(false)
    }
  }

  const generateAIAnalysis = async () => {
    if (checkIns.length < 3) {
      toast.error('Need at least 3 check-ins for AI analysis')
      return
    }

    setIsGeneratingAnalysis(true)

    try {
      // Calculate averages
      const last7Days = checkIns.slice(0, 7)
      const last30Days = checkIns.slice(0, 30)

      const weeklyAvg = last7Days.reduce((sum, c) => sum + c.mood, 0) / last7Days.length
      const monthlyAvg = last30Days.reduce((sum, c) => sum + c.mood, 0) / last30Days.length

      // Determine trend
      let trend: 'improving' | 'stable' | 'declining' = 'stable'
      if (weeklyAvg > monthlyAvg + 0.5) trend = 'improving'
      else if (weeklyAvg < monthlyAvg - 0.5) trend = 'declining'

      // Calculate wellness score
      const avgMood = weeklyAvg
      const avgEnergy = last7Days.reduce((sum, c) => sum + c.energy, 0) / last7Days.length
      const avgSleep = last7Days.reduce((sum, c) => sum + c.sleep, 0) / last7Days.length
      const avgStress = last7Days.reduce((sum, c) => sum + c.stress, 0) / last7Days.length
      const wellnessScore = Math.round((avgMood + avgEnergy + avgSleep + (10 - avgStress)) / 4 * 10)

      // Generate AI insights
      const { text } = await blink.ai.generateText({
        prompt: `Based on this mental wellness data, provide 3-5 supportive, actionable wellness suggestions (no medical advice):
        
Weekly averages:
- Mood: ${avgMood.toFixed(1)}/10
- Energy: ${avgEnergy.toFixed(1)}/10
- Sleep: ${avgSleep.toFixed(1)}/10
- Stress: ${avgStress.toFixed(1)}/10

Trend: ${trend}

Provide suggestions in a bullet-point list format. Focus on lifestyle habits, self-care practices, and stress management techniques.`,
      })

      // Parse suggestions
      const suggestions = text
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(s => s.length > 0)
        .slice(0, 5)

      setAnalysis({
        weeklyAverage: weeklyAvg,
        monthlyAverage: monthlyAvg,
        trend,
        stressPattern: avgStress > 7 ? 'High stress detected' : avgStress > 5 ? 'Moderate stress' : 'Low stress',
        suggestions,
        wellnessScore,
      })

      toast.success('AI analysis generated!')
    } catch (error) {
      console.error('Error generating analysis:', error)
      toast.error('Failed to generate analysis')
    } finally {
      setIsGeneratingAnalysis(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (checkIns.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Check-ins Yet</h3>
        <p className="text-muted-foreground">Complete your first daily check-in to start tracking your wellness journey.</p>
      </div>
    )
  }

  // Prepare chart data (reverse for chronological order)
  const chartData = [...checkIns].reverse().slice(0, 14).map(c => ({
    date: new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: c.mood,
    energy: c.energy,
    stress: c.stress,
    sleep: c.sleep,
  }))

  // Weekly distribution data
  const weeklyData = checkIns.slice(0, 7).map((c, i) => ({
    day: new Date(c.date).toLocaleDateString('en-US', { weekday: 'short' }),
    mood: c.mood,
  }))

  return (
    <div className="space-y-6">
      {/* Wellness Score */}
      {analysis && (
        <Card className="bg-gradient-to-r from-primary to-accent text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Your Wellness Score</p>
                <p className="text-5xl font-bold">{analysis.wellnessScore}/100</p>
              </div>
              <div className="text-right">
                {analysis.trend === 'improving' && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-8 w-8" />
                    <span className="text-lg">Improving</span>
                  </div>
                )}
                {analysis.trend === 'declining' && (
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-8 w-8" />
                    <span className="text-lg">Needs Attention</span>
                  </div>
                )}
                {analysis.trend === 'stable' && (
                  <div className="flex items-center gap-2">
                    <Minus className="h-8 w-8" />
                    <span className="text-lg">Stable</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mood Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Mood Trends (Last 14 Days)</CardTitle>
          <CardDescription>Track your emotional patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="mood" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Mood" />
              <Line type="monotone" dataKey="energy" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Energy" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Mood Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Mood Distribution</CardTitle>
          <CardDescription>Your mood levels this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Bar dataKey="mood" fill="hsl(var(--chart-1))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stress vs Energy Correlation */}
      <Card>
        <CardHeader>
          <CardTitle>Stress vs Energy Levels</CardTitle>
          <CardDescription>Understanding the relationship between stress and energy</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stress" name="Stress" domain={[0, 10]} />
              <YAxis dataKey="energy" name="Energy" domain={[0, 10]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Check-ins" data={chartData} fill="hsl(var(--chart-3))" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Wellness Insights
              </CardTitle>
              <CardDescription>Personalized suggestions based on your patterns</CardDescription>
            </div>
            <button
              onClick={generateAIAnalysis}
              disabled={isGeneratingAnalysis}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {isGeneratingAnalysis ? 'Generating...' : analysis ? 'Refresh' : 'Generate'}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {analysis ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">7-Day Average</p>
                  <p className="text-2xl font-bold">{analysis.weeklyAverage.toFixed(1)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">30-Day Average</p>
                  <p className="text-2xl font-bold">{analysis.monthlyAverage.toFixed(1)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Stress Pattern</p>
                  <p className="text-lg font-semibold">{analysis.stressPattern}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Personalized Suggestions:</h4>
                <ul className="space-y-2">
                  {analysis.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-xs text-muted-foreground border-t pt-3">
                <strong>Note:</strong> These suggestions are based on your self-reported data and are not medical advice. 
                Please consult a healthcare professional for personalized medical guidance.
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Click "Generate" to receive AI-powered wellness insights based on your check-ins.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
