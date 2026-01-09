# MindTrack - Mental Wellness Platform

A comprehensive mental wellness tracking application that helps users monitor their daily mental health through check-ins, visualize trends, and receive AI-powered insights.

## Features

### 🎯 Core Features

- **Daily Check-ins**: Track mood, energy, sleep, and stress levels (1-10 scale)
- **Journal Entries**: Optional daily journal for reflection
- **Daily Goals**: Set and track wellness goals
- **Visual Dashboard**: Interactive charts showing trends over time
- **AI-Powered Insights**: Personalized wellness suggestions based on your data
- **History & Reports**: View past check-ins with pagination
- **Data Export**: Export your data as CSV for personal records
- **Dark/Light Mode**: Toggle between themes for comfort
- **Responsive Design**: Works seamlessly on mobile and desktop

### 📊 Visualizations

- Mood trends over time (line charts)
- Weekly mood distribution (bar charts)
- Stress vs energy correlation (scatter plots)
- Wellness score with trend indicators

### 🤖 AI Features

- 7-day and 30-day mood analysis
- Stress pattern detection
- Personalized wellness recommendations
- Overall wellness score calculation

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Authentication**: Blink SDK (managed auth)
- **Database**: SQLite via Blink SDK
- **Charts**: Recharts
- **AI**: Blink AI SDK (OpenAI integration)
- **State Management**: React Context API
- **Notifications**: Sonner (toast notifications)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Blink account (for authentication and database)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mindtrack
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Set up environment variables:

Create a `.env.local` file with:
```env
VITE_BLINK_PROJECT_ID=your_project_id
VITE_BLINK_PUBLISHABLE_KEY=your_publishable_key
```

4. Start the development server:
```bash
bun run dev
# or
npm run dev
```

5. Open your browser to `http://localhost:5173`

## Database Schema

The application uses a single `check_ins` table:

```sql
CREATE TABLE check_ins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 10),
  sleep INTEGER NOT NULL CHECK (sleep >= 1 AND sleep <= 10),
  stress INTEGER NOT NULL CHECK (stress >= 1 AND stress <= 10),
  journal_entry TEXT,
  daily_goal TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Shadcn UI components
│   ├── AppLayout.tsx    # Main layout with navigation
│   ├── CheckInForm.tsx  # Daily check-in form
│   ├── Dashboard.tsx    # Analytics dashboard
│   ├── History.tsx      # Check-in history
│   └── LandingPage.tsx  # Public landing page
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── lib/
│   ├── blink.ts         # Blink SDK configuration
│   └── utils.ts         # Utility functions
├── types/
│   └── index.ts         # TypeScript type definitions
├── App.tsx              # Main app component
├── index.css            # Global styles with design system
└── main.tsx             # App entry point
```

## Design System

The application uses a calming color palette designed for mental wellness:

- **Primary**: Calming Blue (HSL: 210 75% 55%)
- **Accent**: Soft Teal (HSL: 175 60% 50%)
- **Background**: Light neutral tones
- **Charts**: Wellness color spectrum (blues, teals, purples, greens)

## Usage

### For Users

1. **Sign Up/Login**: Click "Get Started Free" on the landing page
2. **Daily Check-In**: Complete daily assessments of mood, energy, sleep, and stress
3. **View Dashboard**: See your trends and patterns visualized
4. **Generate AI Insights**: Get personalized wellness suggestions
5. **Review History**: Browse past check-ins and export data

### For Developers

#### Adding New Features

1. Create new components in `src/components/`
2. Add types to `src/types/index.ts`
3. Update the database schema if needed
4. Add navigation in `AppLayout.tsx`

#### Customizing the Design

Edit `src/index.css` to modify:
- Color palette (HSL values)
- Typography (fonts, sizes)
- Shadows and spacing
- Dark mode colors

## Security & Privacy

- All user data is encrypted and stored securely
- Row-level security ensures users only access their own data
- No personal data is shared with third parties
- AI analysis happens server-side with no data retention

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in project settings
3. Deploy automatically on push to main

### Manual Build

```bash
bun run build
# or
npm run build
```

The `dist` folder contains the production build.

## Important Notes

⚠️ **Medical Disclaimer**: MindTrack is a wellness tracking tool and does NOT replace professional mental health care. If you're experiencing a mental health crisis, please contact a healthcare provider or crisis helpline immediately.

## AI Guidelines

The AI analysis follows these principles:
- Supportive, non-judgmental language
- Focus on wellness and self-care
- NO medical terminology or diagnostic language
- Actionable, evidence-based recommendations
- Clear disclaimers about professional help

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Open an issue on GitHub
- Contact support at support@mindtrack.app

## Acknowledgments

- Built with [Blink SDK](https://blink.new)
- UI components from [Shadcn/ui](https://ui.shadcn.com)
- Charts powered by [Recharts](https://recharts.org)
- Icons from [Lucide](https://lucide.dev)

---

**Remember**: Your mental health matters. This tool is here to support your journey, but professional help is always available when you need it. 💙
