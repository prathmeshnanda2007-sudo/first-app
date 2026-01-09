import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { blink } from '@/lib/blink'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { CheckIn } from '@/types'

interface CheckInFormProps {
  onSuccess?: () => void
}

export function CheckInForm({ onSuccess }: CheckInFormProps) {
  const { user } = useAuth()
  const [mood, setMood] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [sleep, setSleep] = useState(5)
  const [stress, setStress] = useState(5)
  const [journalEntry, setJournalEntry] = useState('')
  const [dailyGoal, setDailyGoal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)

    try {
      const today = new Date().toISOString().split('T')[0]
      
      await blink.db.checkIns.create({
        userId: user.id,
        date: today,
        mood,
        energy,
        sleep,
        stress,
        journalEntry: journalEntry || undefined,
        dailyGoal: dailyGoal || undefined,
      })

      toast.success('Check-in saved successfully!')
      
      // Reset form
      setMood(5)
      setEnergy(5)
      setSleep(5)
      setStress(5)
      setJournalEntry('')
      setDailyGoal('')
      
      onSuccess?.()
    } catch (error) {
      console.error('Error saving check-in:', error)
      toast.error('Failed to save check-in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMoodEmoji = (value: number) => {
    if (value <= 2) return '😔'
    if (value <= 4) return '😕'
    if (value <= 6) return '😐'
    if (value <= 8) return '🙂'
    return '😊'
  }

  const getEnergyEmoji = (value: number) => {
    if (value <= 3) return '🔋'
    if (value <= 6) return '⚡'
    return '🔥'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Check-In</CardTitle>
        <CardDescription>
          How are you feeling today? Take a moment to reflect on your mental wellness.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Mood */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Mood {getMoodEmoji(mood)}</Label>
              <span className="text-2xl font-bold text-primary">{mood}/10</span>
            </div>
            <Slider
              value={[mood]}
              onValueChange={(value) => setMood(value[0])}
              min={1}
              max={10}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Very Low</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Energy */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Energy Level {getEnergyEmoji(energy)}</Label>
              <span className="text-2xl font-bold text-accent">{energy}/10</span>
            </div>
            <Slider
              value={[energy]}
              onValueChange={(value) => setEnergy(value[0])}
              min={1}
              max={10}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Exhausted</span>
              <span>Energized</span>
            </div>
          </div>

          {/* Sleep */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Sleep Quality 😴</Label>
              <span className="text-2xl font-bold text-primary">{sleep}/10</span>
            </div>
            <Slider
              value={[sleep]}
              onValueChange={(value) => setSleep(value[0])}
              min={1}
              max={10}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Stress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Stress Level 😰</Label>
              <span className="text-2xl font-bold text-destructive">{stress}/10</span>
            </div>
            <Slider
              value={[stress]}
              onValueChange={(value) => setStress(value[0])}
              min={1}
              max={10}
              step={1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimal</span>
              <span>Very High</span>
            </div>
          </div>

          {/* Daily Goal */}
          <div className="space-y-3">
            <Label htmlFor="dailyGoal" className="text-base">Today's Wellness Goal (Optional)</Label>
            <Input
              id="dailyGoal"
              placeholder="e.g., Take a 20-minute walk, practice meditation"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
            />
          </div>

          {/* Journal Entry */}
          <div className="space-y-3">
            <Label htmlFor="journal" className="text-base">Journal Entry (Optional)</Label>
            <Textarea
              id="journal"
              placeholder="How are you feeling today? What's on your mind?"
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Complete Check-In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
