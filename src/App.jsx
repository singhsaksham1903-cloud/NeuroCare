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
} from './utils/auth'

import translations from './data/translations'

import './App.css'


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
// Dashboard Card
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

      <div className="card-visual">
        <img
          src={icon}
          alt=""
          className="card-illustration"
        />
      </div>


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
// App
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

  const [authLoading, setAuthLoading] =
    useState(true)

  const [recommendedGame, setRecommendedGame] =
    useState(null)

  const [
    recommendedDifficulty,
    setRecommendedDifficulty,
  ] = useState(null)


  const currentText =
    translations[language] ||
    translations.en


  // ==========================================
  // Language
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
      languageMap[language] ||
      'en-IN'
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


  // ==========================================
  // Handle expired authentication
  // ==========================================

  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null)
      setPage('dashboard')
      setRecommendedGame(null)
      setRecommendedDifficulty(null)
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
  // Open Cognitive Games
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


  // ==========================================
  // Dashboard information
  // ==========================================

  const greeting =
    getGreeting(currentText)

  const todayDate =
    getFormattedDate()

  const userName =
    currentUser?.full_name ||
    currentText.elderlyUser


  const languageCode =
    language === 'hi'
      ? 'hi-IN'
      : language === 'as'
        ? 'as-IN'
        : 'en-IN'


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
          padding: '24px',
          boxSizing: 'border-box',
          fontSize: '1.2rem',
          color: '#5f6670',
          textAlign: 'center',
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
          setRecommendedGame(null)
          setRecommendedDifficulty(null)
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
        objectRecallText={
          currentText.objectRecallPage
        }
        language={languageCode}
        readAloudLabel={
          currentText.readAloud
        }
        stopReadingLabel={
          currentText.stopReading
        }
        initialGame={
          recommendedGame
        }
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
        language={languageCode}
        readAloudLabel={
          currentText.readAloud
        }
        stopReadingLabel={
          currentText.stopReading
        }
        onBack={() =>
          setPage('dashboard')
        }
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
        language={languageCode}
        readAloudLabel={
          currentText.readAloud
        }
        stopReadingLabel={
          currentText.stopReading
        }
        onBack={() =>
          setPage('dashboard')
        }
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
        text={
          currentText.caregiverLinksPage
        }
        language={languageCode}
        readAloudLabel={
          currentText.readAloud
        }
        stopReadingLabel={
          currentText.stopReading
        }
        onBack={() =>
          setPage('dashboard')
        }
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
        language={languageCode}
        readAloudLabel={
          currentText.readAloud
        }
        stopReadingLabel={
          currentText.stopReading
        }
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
        language={languageCode}
        readAloudLabel={
          currentText.readAloud
        }
        stopReadingLabel={
          currentText.stopReading
        }
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
      {/* ----------------------------------------
          Skip Link
          ---------------------------------------- */}

      <a
        className="skip-link"
        href="#main-content"
      >
        Skip to main content
      </a>


      {/* ----------------------------------------
          Header
          ---------------------------------------- */}

      <header className="app-header">

        <div className="app-logo">
          Cognicare{' '}

          <span className="app-logo-highlight">
            NER
          </span>
        </div>


        <h1 className="greeting">
          {greeting},{' '}
          {userName}
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


      {/* ----------------------------------------
          User Bar
          ---------------------------------------- */}

      <UserBar
        user={currentUser}
        text={{
          caregiver:
            currentText.caregiver,

          elderlyUser:
            currentText.elderlyUser,

          logout:
            currentText.logout,
        }}
        onLogout={() => {
          setCurrentUser(null)
          setPage('dashboard')
          setRecommendedGame(null)
          setRecommendedDifficulty(null)
        }}
      />


      {/* ----------------------------------------
          Online / Offline Status
          ---------------------------------------- */}

      <OfflineStatus
        text={{
          online:
            currentText.online,

          offline:
            currentText.offline,
        }}
      />


      {/* ----------------------------------------
          Dashboard Read Aloud
          ---------------------------------------- */}

      <VoiceReadAloud
        text={
          `${greeting}, ${userName}. ` +
          `${currentText.cognitiveGames}. ` +
          `${currentText.cognitiveGamesDescription}`
        }
        language={languageCode}
        label={currentText.readAloud}
        stopLabel={
          currentText.stopReading
        }
      />


      {/* ----------------------------------------
          Dashboard
          ---------------------------------------- */}

      <main
        id="main-content"
        className="dashboard"
      >

        {/* Recommendation */}

        <RecommendationCard
          text={
            currentText.recommendationPage
          }
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
          icon="/illustrations/cognitive-games.svg"
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
          icon="/illustrations/performance.svg"
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
          icon="/illustrations/caregiver.svg"
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
          icon="/illustrations/connections.svg"
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
          icon="/illustrations/memories.svg"
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
          icon="/illustrations/reminders.svg"
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

      </main>


      {/* ----------------------------------------
          Footer
          ---------------------------------------- */}

      <footer className="app-footer">
        {currentText.footer}
      </footer>

    </>
  )
}


export default App