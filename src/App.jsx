import { useEffect, useState } from 'react'

import AuthPage from './pages/AuthPage'
import CognitiveGames from './pages/CognitiveGames'
import PerformanceDashboard from './pages/PerformanceDashboard'
import CaregiverDashboard from './pages/CaregiverDashboard'
import CaregiverLinks from './pages/CaregiverLinks'
import RecommendationCard from './pages/RecommendationCard'
import Memories from './pages/Memories'
import Reminders from './pages/Reminders'
import UserBar from './pages/UserBar'
import OfflineStatus from './Components/OfflineStatus'
import VoiceReadAloud from './Components/VoiceReadAloud'
import LanguageSelector from './Components/LanguageSelector'

import {
  getCurrentUser,
  logout,
} from './utils/auth'

import translations from './data/translations'

import './App.css'


// ============================================
// UI Text — original game-page/static strings
// Dashboard translations are handled below
// ============================================

const TEXT = {
  appName: 'Cognicare',
  appNameHighlight: 'NER',

  userName: 'Mrs. Das',

  greetingMorning: 'Good morning',
  greetingAfternoon: 'Good afternoon',
  greetingEvening: 'Good evening',

  cards: {
    games: {
      icon: '🧠',
      title: 'Cognitive Games',
      description:
        'Exercise your mind with fun puzzles and games.',
      button: 'Play Now',
    },

    memories: {
      icon: '📸',
      title: 'My Memories',
      description:
        'View your photos and cherished moments.',
      button: 'View Memories',
    },

    reminders: {
      icon: '📋',
      title: "Today's Reminders",
      description:
        'Your tasks and reminders for today.',
      button: 'See All Reminders',
    },

    caregiver: {
      icon: '🆘',
      title: 'Caregiver Help',
      description:
        'Contact your caregiver or get help anytime.',
      button: 'Get Help',
    },
  },

  footer:
    'Cognicare NER — SIH 2025 Prototype',

  gamesPage: {
    icon: '🧠',
    title: 'Cognitive Games',
    subtitle:
      'Choose a game to exercise your mind, Mrs. Das.',
    backButton: 'Back to Dashboard',

    games: [
      {
        id: 'memory-match',
        icon: '🃏',
        title: 'Memory Match',
        description:
          'Flip cards and find matching pairs to train your memory.',
        button: 'Coming Soon',
      },

      {
        id: 'sequence-memory',
        icon: '🔢',
        title: 'Sequence Memory',
        description:
          'Remember and repeat the sequence of numbers or colors.',
        button: 'Coming Soon',
      },

      {
        id: 'object-recall',
        icon: '👁️',
        title: 'Object Recall',
        description:
          'Look at objects, then recall what you saw.',
        button: 'Coming Soon',
      },
    ],
  },
}


// ============================================
// Mock Data — static for the prototype
// ============================================

const MOCK_REMINDERS = [
  {
    id: 1,
    time: '8:00 AM',
    label: 'Morning medicine 💊',
  },
  {
    id: 2,
    time: '10:00 AM',
    label: 'Walk in the garden 🌿',
  },
  {
    id: 3,
    time: '1:00 PM',
    label: 'Lunch with family 🍽️',
  },
]


// ============================================
// Helper — get time-appropriate greeting
// ============================================

function getGreeting(text) {
  const hour = new Date().getHours()

  if (hour < 12) {
    return text.greetingMorning
  }

  if (hour < 17) {
    return text.greetingAfternoon
  }

  return text.greetingEvening
}


// ============================================
// Helper — format today's date
// ============================================

function getFormattedDate() {
  return new Date().toLocaleDateString(
    'en-IN',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  )
}


// ============================================
// Dashboard Card Component
// ============================================

function DashboardCard({
  icon,
  title,
  description,
  buttonLabel,
  buttonStyle,
  variant,
  onClick,
  children,
}) {
  return (
    <article
      className={`card${variant === 'danger'
        ? ' card--danger'
        : ''
        }`}
    >
      <span
        className="card-icon"
        role="img"
        aria-hidden="true"
      >
        {icon}
      </span>

      <h2 className="card-title">
        {title}
      </h2>

      <p className="card-description">
        {description}
      </p>

      {children}

      <button
        type="button"
        className={`card-button${buttonStyle
          ? ` card-button--${buttonStyle}`
          : ''
          }`}
        onClick={onClick}
      >
        {buttonLabel}
      </button>
    </article>
  )
}


// ============================================
// App — Main Dashboard
// ============================================

function App() {
  const [page, setPage] =
    useState('dashboard')

  const [currentUser, setCurrentUser] =
    useState(null)

  const [language, setLanguage] =
    useState(() => {
      return (
        localStorage.getItem(
          'cognicare-language',
        ) || 'en'
      )
    })

  const currentText =
    translations[language] ||
    translations.en

  const [authLoading, setAuthLoading] =
    useState(true)

  const [recommendedGame, setRecommendedGame] =
    useState(null)

  const [
    recommendedDifficulty,
    setRecommendedDifficulty,
  ] = useState(null)


  // ==========================================
  // Save selected language
  // ==========================================

  useEffect(() => {
    localStorage.setItem(
      'cognicare-language',
      language,
    )
  }, [language])

  useEffect(() => {
    const languageMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      as: 'as-IN',
    }

    document.documentElement.lang =
      languageMap[language] || 'en-IN'
  }, [language])


  // ==========================================
  // Restore logged-in session
  // ==========================================

  useEffect(() => {
    const restoreUserSession =
      async () => {
        try {
          const user =
            await getCurrentUser()

          setCurrentUser(user)
        } finally {
          setAuthLoading(false)
        }
      }

    restoreUserSession()
  }, [])
  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null)
      setPage('dashboard')
    }

    window.addEventListener(
      'cognicare-auth-expired',
      handleAuthExpired,
    )

    return () => {
      window.removeEventListener(
        'cognicare-auth-expired',
        handleAuthExpired,
      )
    }
  }, [])


  // ==========================================
  // Open cognitive games
  // ==========================================

  const openGames = (
    game = null,
    difficulty = null,
  ) => {
    setRecommendedGame(game)
    setRecommendedDifficulty(
      difficulty,
    )
    setPage('games')
  }


  const greeting =
    getGreeting(currentText)

  const todayDate =
    getFormattedDate()


  // ==========================================
  // Authentication loading
  // ==========================================

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
        }}
      >
        Loading Cognicare...
      </div>
    )
  }


  // ==========================================
  // Not logged in
  // ==========================================

  if (!currentUser) {
    return (
      <AuthPage
        onAuthenticated={(user) => {
          setCurrentUser(user)
          setPage('dashboard')
        }}
      />
    )
  }


  // ==========================================
  // Cognitive Games
  // ==========================================

  if (page === 'games') {
    return (
      <CognitiveGames
        text={currentText.gamesPage}
        memoryMatchText={
          currentText.memoryMatchPage
        }
        sequenceMemoryText={
          currentText.sequenceMemoryPage
        }

        objectRecallText={currentText.objectRecallPage}
        language={
          language === 'hi'
            ? 'hi-IN'
            : language === 'as'
              ? 'as-IN'
              : 'en-IN'
        }
        readAloudLabel={currentText.readAloud}
        stopReadingLabel={currentText.stopReading}
        initialGame={recommendedGame}
        initialDifficulty={
          recommendedDifficulty
        }
        onNavigate={(targetPage) => {
          setRecommendedGame(null)
          setRecommendedDifficulty(
            null,
          )
          setPage(targetPage)
        }}
      />
    )
  }


  // ==========================================
  // Performance Dashboard
  // ==========================================

  if (page === 'performance') {
    return (
      <PerformanceDashboard
        text={currentText.performancePage}
        language={
          language === 'hi'
            ? 'hi-IN'
            : language === 'as'
              ? 'as-IN'
              : 'en-IN'
        }
        readAloudLabel={currentText.readAloud}
        stopReadingLabel={currentText.stopReading}
        onBack={() => setPage('dashboard')}
      />
    )
  }


  // ==========================================
  // Caregiver Dashboard
  // ==========================================

  if (page === 'caregiver') {
    return (
      <CaregiverDashboard
        user={currentUser}
        text={currentText.caregiverPage}
        language={
          language === 'hi'
            ? 'hi-IN'
            : language === 'as'
              ? 'as-IN'
              : 'en-IN'
        }
        readAloudLabel={currentText.readAloud}
        stopReadingLabel={currentText.stopReading}
        onBack={() => setPage('dashboard')}
      />
    )
  }

  // ==========================================
  // Caregiver Connections
  // ==========================================
  if (page === 'caregiver-links') {
    return (
      <CaregiverLinks
        user={currentUser}
        text={currentText.caregiverLinksPage}
        language={
          language === 'hi'
            ? 'hi-IN'
            : language === 'as'
              ? 'as-IN'
              : 'en-IN'
        }
        readAloudLabel={currentText.readAloud}
        stopReadingLabel={currentText.stopReading}
        onBack={() => setPage('dashboard')}
      />
    )
  }


  // ==========================================
  // Memories
  // ==========================================

  if (page === 'memories') {
    return (
      <Memories
        text={currentText.memoriesPage}
        language={
          language === 'hi'
            ? 'hi-IN'
            : language === 'as'
              ? 'as-IN'
              : 'en-IN'
        }
        readAloudLabel={currentText.readAloud}
        stopReadingLabel={currentText.stopReading}
        onBack={() =>
          setPage('dashboard')
        }
      />
    )
  }

  // ==========================================
  // Reminders
  // ==========================================

  if (page === 'reminders') {
    return (
      <Reminders
        text={currentText.remindersPage}
        language={
          language === 'hi'
            ? 'hi-IN'
            : language === 'as'
              ? 'as-IN'
              : 'en-IN'
        }
        readAloudLabel={currentText.readAloud}
        stopReadingLabel={currentText.stopReading}
        onBack={() =>
          setPage('dashboard')
        }
      />
    )
  }


  // ==========================================
  // Main Dashboard
  // ==========================================

  return (
    <>
      {/* ======================================
          Header
          ====================================== */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="app-header">

        <div className="app-logo">
          {TEXT.appName}{' '}
          <span className="app-logo-highlight">
            {TEXT.appNameHighlight}
          </span>
        </div>

        <h1 className="greeting">
          {greeting},{' '}
          {TEXT.userName}
        </h1>

        <p className="date-display">
          {todayDate}
        </p>

        <LanguageSelector
          language={language}
          onChange={setLanguage}
          label={currentText.language}
        />

      </header>


      {/* ======================================
          User Bar
          ====================================== */}

      <UserBar
        user={currentUser}
        text={{
          caregiver: currentText.caregiver,
          elderlyUser: currentText.elderlyUser,
          logout: currentText.logout,
        }}
        onLogout={() => {
          logout()
          setCurrentUser(null)
          setPage('dashboard')
        }}
      />

      <OfflineStatus
        text={{
          online: currentText.online,
          offline: currentText.offline,
        }}
      />
      <VoiceReadAloud
        text={`${greeting}, ${currentUser?.name || currentText.elderlyUser
          }. ${currentText.cognitiveGames}. ${currentText.cognitiveGamesDescription
          }`}
        language={
          language === 'hi'
            ? 'hi-IN'
            : language === 'as'
              ? 'as-IN'
              : 'en-IN'
        }
        label={currentText.readAloud}
        stopLabel={currentText.stopReading}
      />


      {/* ======================================
          Dashboard
          ====================================== */}

      <main
        id="main-content"
        className="dashboard"
      >

        {/* Recommendation */}

        <RecommendationCard
          text={currentText.recommendationPage}
          onStart={(
            game,
            difficulty,
          ) => {
            const gameMap = {
              'Memory Match':
                'memory-match',

              'Sequence Memory':
                'sequence-memory',

              'Object Recall':
                'object-recall',
            }

            openGames(
              gameMap[game],
              difficulty,
            )
          }}
        />


        {/* Cognitive Games */}

        <DashboardCard
          icon={
            TEXT.cards.games.icon
          }
          title={
            currentText.cognitiveGames
          }
          description={
            currentText.cognitiveGamesDescription
          }
          buttonLabel={
            currentText.playNow
          }
          onClick={() =>
            openGames()
          }
        />


        {/* Performance */}

        <DashboardCard
          icon="📊"
          title={
            currentText.performance
          }
          description={
            currentText.performanceDescription
          }
          buttonLabel={
            currentText.viewPerformance
          }
          onClick={() =>
            setPage('performance')
          }
        />


        {/* Caregiver Dashboard */}

        <DashboardCard
          icon="👤"
          title={
            currentText.caregiverDashboard
          }
          description={
            currentText.caregiverDashboardDescription
          }
          buttonLabel={
            currentText.openCaregiverDashboard
          }
          onClick={() =>
            setPage('caregiver')
          }
        />


        {/* Caregiver Connections */}

        <DashboardCard
          icon="🤝"
          title={
            currentUser.role ===
              'caregiver'
              ? currentText.caregiverConnections
              : currentText.caregiverRequests
          }
          description={
            currentUser.role ===
              'caregiver'
              ? currentText.caregiverConnectionsDescription
              : currentText.caregiverRequestsDescription
          }
          buttonLabel={
            currentUser.role ===
              'caregiver'
              ? currentText.manageConnections
              : currentText.viewRequests
          }
          onClick={() =>
            setPage(
              'caregiver-links',
            )
          }
        />


        {/* Memories */}

        <DashboardCard
          icon="📝"
          title={
            currentText.memories
          }
          description={
            currentText.memoriesDescription
          }
          buttonLabel={
            currentText.openMemories
          }
          onClick={() =>
            setPage('memories')
          }
        />


        {/* Reminders */}

        <DashboardCard
          icon="⏰"
          title={
            currentText.reminders
          }
          description={
            currentText.remindersDescription
          }
          buttonLabel={
            currentText.openReminders
          }
          onClick={() =>
            setPage('reminders')
          }
        />


        {/* Existing Memory Card */}

        <DashboardCard
          icon={
            TEXT.cards.memories.icon
          }
          title={
            currentText.myMemories
          }
          description={
            currentText.myMemoriesDescription
          }
          buttonLabel={
            currentText.viewMemories
          }
          buttonStyle="green"
        />


        {/* Mock Reminders Card */}

        <DashboardCard
          icon={
            TEXT.cards.reminders.icon
          }
          title={
            currentText.todaysReminders
          }
          description={
            currentText.todaysRemindersDescription
          }
          buttonLabel={
            currentText.seeAllReminders
          }
        >
          <ul className="reminders-list">

            {MOCK_REMINDERS.map(
              (r) => (
                <li
                  key={r.id}
                  className="reminder-item"
                >
                  <span className="reminder-time">
                    {r.time}
                  </span>

                  <span>
                    {r.label}
                  </span>
                </li>
              ),
            )}

          </ul>
        </DashboardCard>


        {/* Caregiver Help */}

        <DashboardCard
          icon={
            TEXT.cards.caregiver.icon
          }
          title={
            currentText.caregiverHelp
          }
          description={
            currentText.caregiverHelpDescription
          }
          buttonLabel={
            currentText.getHelp
          }
          buttonStyle="danger"
          variant="danger"
        />

      </main>


      {/* ======================================
          Footer
          ====================================== */}

      <footer className="app-footer">
        {currentText.footer}
      </footer>
    </>
  )
}


export default App