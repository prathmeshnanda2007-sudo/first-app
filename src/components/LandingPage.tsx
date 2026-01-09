import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, Brain, BarChart3, Heart, Shield, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function LandingPage() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Your Personal Wellness Companion
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Track Your Mental
            <span className="block text-primary">Wellness Journey</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            MindTrack helps you monitor daily moods, visualize emotional trends, and receive AI-powered insights for better mental wellbeing.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={login} className="text-lg px-8">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need for Mental Wellness
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful features designed to support your mental health journey
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Daily Check-ins</h3>
              <p className="text-muted-foreground">
                Track mood, energy, sleep, and stress levels with quick daily assessments
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Visual Analytics</h3>
              <p className="text-muted-foreground">
                Beautiful charts and graphs to visualize your emotional patterns over time
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI Insights</h3>
              <p className="text-muted-foreground">
                Personalized wellness suggestions based on your mental health patterns
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Wellness Score</h3>
              <p className="text-muted-foreground">
                Overall wellness metrics to track your progress and celebrate wins
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Private & Secure</h3>
              <p className="text-muted-foreground">
                Your data is encrypted and never shared. Complete privacy guaranteed
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">Export Reports</h3>
              <p className="text-muted-foreground">
                Download weekly and monthly reports to share with healthcare providers
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary to-accent text-white">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Start Your Wellness Journey Today
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Join thousands of users who are taking control of their mental health with MindTrack
            </p>
            <Button size="lg" variant="secondary" onClick={login} className="text-lg px-8">
              Create Free Account
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Disclaimer */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center text-sm text-muted-foreground">
          <p>
            <strong>Disclaimer:</strong> MindTrack is a wellness tracking tool and does not replace professional mental health care. 
            If you're experiencing a mental health crisis, please contact a healthcare provider or crisis helpline immediately.
          </p>
        </div>
      </section>
    </div>
  )
}
