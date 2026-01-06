import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { blink } from '@/lib/blink'
import { useAuth } from '@/contexts/AuthContext'
import { CheckIn } from '@/types'
import { Calendar, Download, FileText } from 'lucide-react'
import { toast } from 'sonner'

export function History() {
  const { user } = useAuth()
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 10

  useEffect(() => {
    loadCheckIns()
  }, [user, page])

  const loadCheckIns = async () => {
    if (!user) return

    try {
      const data = await blink.db.checkIns.list({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setCheckIns(data)
      setHasMore(data.length === pageSize)
    } catch (error) {
      console.error('Error loading check-ins:', error)
      toast.error('Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }

  const exportToCSV = () => {
    if (checkIns.length === 0) {
      toast.error('No data to export')
      return
    }

    // Create CSV content
    const headers = ['Date', 'Mood', 'Energy', 'Sleep', 'Stress', 'Daily Goal', 'Journal Entry']
    const rows = checkIns.map(c => [
      c.date,
      c.mood,
      c.energy,
      c.sleep,
      c.stress,
      c.dailyGoal || '',
      c.journalEntry?.replace(/\n/g, ' ') || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mindtrack-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('History exported successfully!')
  }

  const getMoodLabel = (mood: number) => {
    if (mood <= 3) return { label: 'Low', color: 'bg-destructive' }
    if (mood <= 5) return { label: 'Fair', color: 'bg-orange-500' }
    if (mood <= 7) return { label: 'Good', color: 'bg-yellow-500' }
    if (mood <= 9) return { label: 'Great', color: 'bg-accent' }
    return { label: 'Excellent', color: 'bg-primary' }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Check-in History</h2>
          <p className="text-muted-foreground">Review your mental wellness journey</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" disabled={checkIns.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {checkIns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No History Yet</h3>
            <p className="text-muted-foreground">Your check-in history will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {checkIns.map((checkIn) => {
              const moodInfo = getMoodLabel(checkIn.mood)
              const date = new Date(checkIn.date)
              const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })

              return (
                <Card key={checkIn.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{formattedDate}</CardTitle>
                      </div>
                      <Badge className={moodInfo.color}>{moodInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Mood</p>
                        <p className="text-2xl font-bold text-primary">{checkIn.mood}/10</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Energy</p>
                        <p className="text-2xl font-bold text-accent">{checkIn.energy}/10</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Sleep</p>
                        <p className="text-2xl font-bold text-primary">{checkIn.sleep}/10</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Stress</p>
                        <p className="text-2xl font-bold text-destructive">{checkIn.stress}/10</p>
                      </div>
                    </div>

                    {/* Daily Goal */}
                    {checkIn.dailyGoal && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Daily Goal</p>
                        <p className="text-sm">{checkIn.dailyGoal}</p>
                      </div>
                    )}

                    {/* Journal Entry */}
                    {checkIn.journalEntry && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Journal Entry</p>
                        <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                          {checkIn.journalEntry}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
