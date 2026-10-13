import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import './CaregiverDashboard.css'
import './CognitiveProgressInsights.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import { apiGet } from '../utils/api'
import { ProgressTrendChart } from './CognitiveProgressInsights'


// ============================================
// Caregiver Icons
// ============================================

function CaregiverIcon({ type }) {
  const common = {
    viewBox: '0 0 48 48',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  }

  if (type === 'sessions') {
    return (
      <svg {...common}>
        <rect
          x="8"
          y="10"
          width="32"
          height="28"
          rx="8"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <path
          d="M16 18H32"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M16 25H28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M16 32H24"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'games') {
    return (
      <svg {...common}>
        <rect
          x="7"
          y="14"
          width="34"
          height="22"
          rx="8"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <path
          d="M15 25H21"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <path
          d="M18 22V28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        <circle
          cx="31"
          cy="23"
          r="2"
          fill="currentColor"
        />

        <circle
          cx="35"
          cy="28"
          r="2"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (type === 'accuracy') {
    return (
      <svg {...common}>
        <path
          d="M10 33L19 25L26 29L38 16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M31 16H38V23"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M8 39H40"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'mistakes') {
    return (
      <svg {...common}>
        <circle
          cx="24"
          cy="24"
          r="15"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <path
          d="M24 16V27"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle
          cx="24"
          cy="33"
          r="1.8"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (type === 'time') {
    return (
      <svg {...common}>
        <circle
          cx="24"
          cy="25"
          r="14"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <path
          d="M24 18V25L29 29"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M19 9H29"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'memory') {
    return (
      <svg {...common}>
        <rect
          x="9"
          y="8"
          width="30"
          height="32"
          rx="6"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <circle
          cx="19"
          cy="20"
          r="5"
          stroke="currentColor"
          strokeWidth="2.5"
        />

        <path
          d="M13 34C15 28 19 26 24 26C29 26 33 28 35 34"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'reminder') {
    return (
      <svg {...common}>
        <path
          d="M15 19C15 14 19 10 24 10C29 10 33 14 33 19V27L36 31H12L15 27V19Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        <path
          d="M21 36C22 37.5 26 37.5 27 36"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <circle
        cx="24"
        cy="16"
        r="6"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      <path
        d="M12 36C13.5 28.5 18 25 24 25C30 25 34.5 28.5 36 36"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}


// ============================================
// Caregiver Stat Card
// ============================================

function CaregiverStatCard({
  icon,
  value,
  label,
}) {
  return (
    <article className="caregiver-stat-card">

      <div
        className={`caregiver-stat-icon caregiver-stat-icon--${icon}`}
        aria-hidden="true"
      >
        <CaregiverIcon type={icon} />
      </div>

      <div className="caregiver-stat-content">

        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </article>
  )
}


// ============================================
// Caregiver Dashboard
// ============================================

function CaregiverDashboard({
  onBack,
  user,
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
}) {
  const [sessions, setSessions] = useState([])
  const [memoryCount, setMemoryCount] = useState(0)
  const [reminders, setReminders] = useState([])

  const [linkedElderly, setLinkedElderly] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [activeTab, setActiveTab] =
    useState('overview') // 'overview' | 'progress-report'
  const [approvedLinkId, setApprovedLinkId] =
    useState(null)
  const [reportPeriod, setReportPeriod] =
    useState('30d')
  const [reportGame, setReportGame] =
    useState('all')
  const [reportDifficulty, setReportDifficulty] =
    useState('all')
  const [progressReport, setProgressReport] =
    useState(null)
  const [reportLoading, setReportLoading] =
    useState(false)
  const [reportError, setReportError] =
    useState('')
  const [reportMetric, setReportMetric] =
    useState('accuracy')
  const [selectedPoint, setSelectedPoint] =
    useState(null)


  // ==========================================
  // Load Caregiver Data
  // ==========================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      if (user?.role !== 'caregiver') {
        setSessions([])
        setMemoryCount(0)
        setReminders([])
        setLinkedElderly(null)

        setError(
          text.caregiverOnlyError,
        )

        return
      }

      const linksData =
        await apiGet(
          '/caregiver-links',
        )

      const links =
        Array.isArray(linksData)
          ? linksData
          : []

      const approvedLink =
        links.find(
          (link) =>
            link.status ===
            'approved',
        )

      if (!approvedLink) {
        setSessions([])
        setMemoryCount(0)
        setReminders([])
        setLinkedElderly(null)
        setApprovedLinkId(null)
        setProgressReport(null)

        return
      }

      setApprovedLinkId(approvedLink.id)

      const linkedData =
        await apiGet(
          `/caregiver-links/${approvedLink.id}/data`,
        )

      setLinkedElderly(
        linkedData.elderly_user ||
        null,
      )

      setSessions(
        linkedData.sessions ||
        [],
      )

      setMemoryCount(
        linkedData.memory_count ??
        linkedData.memories ??
        0,
      )

      setReminders(
        linkedData.reminders ||
        [],
      )
    } catch (err) {
      setError(
        err.message ||
        text.loadError,
      )
    } finally {
      setLoading(false)
    }
  }, [
    text.caregiverOnlyError,
    text.loadError,
    user,
  ])


  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadData])

  useEffect(() => {
    if (!approvedLinkId) return

    let active = true
    const fetchReport = async () => {
      try {
        setReportLoading(true)
        setReportError('')
        const queryParams = new URLSearchParams({ period: reportPeriod })
        if (reportGame !== 'all') {
          queryParams.set('game', reportGame)
        }
        if (reportDifficulty !== 'all') {
          queryParams.set('difficulty', reportDifficulty)
        }
        const res = await apiGet(
          `/caregiver-links/${approvedLinkId}/progress-report?${queryParams.toString()}`
        )
        if (active) {
          setProgressReport(res)
          if (res.trendPoints && res.trendPoints.length > 0) {
            setSelectedPoint(res.trendPoints[res.trendPoints.length - 1])
          }
        }
      } catch (err) {
        if (active) {
          setReportError(err.message || 'Could not load cognitive progress report.')
        }
      } finally {
        if (active) {
          setReportLoading(false)
        }
      }
    }

    void fetchReport()

    return () => {
      active = false
    }
  }, [approvedLinkId, reportPeriod, reportGame, reportDifficulty])


  // ==========================================
  // Format Time
  // ==========================================

  const formatTime = (
    seconds,
  ) => {
    const totalSeconds =
      Number(
        seconds || 0,
      )

    const minutes =
      Math.floor(
        totalSeconds / 60,
      )

    const remainingSeconds =
      totalSeconds % 60

    return `${String(
      minutes,
    ).padStart(
      2,
      '0',
    )}:${String(
      remainingSeconds,
    ).padStart(
      2,
      '0',
    )}`
  }


  // ==========================================
  // Format Date
  // ==========================================

  const formatDate = (
    value,
  ) => {
    if (!value) {
      return text.unknown
    }

    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return text.unknown
    }

    return date.toLocaleString()
  }


  // ==========================================
  // Format Reminder Date
  // ==========================================

  const formatReminderDate = (
    value,
  ) => {
    if (!value) {
      return text.noDueDate
    }

    const date =
      new Date(value)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value
    }

    return date.toLocaleString()
  }


  // ==========================================
  // Summary Statistics
  // ==========================================

  const averageAccuracy =
    sessions.length === 0
      ? 0
      : Math.round(
        sessions.reduce(
          (
            total,
            session,
          ) =>
            total +
            Number(
              session.accuracy ||
              0,
            ),
          0,
        ) /
        sessions.length,
      )

  const averageMistakes =
    sessions.length === 0
      ? '—'
      : (
        sessions.reduce(
          (
            total,
            session,
          ) =>
            total +
            Number(
              session.mistakes ||
              0,
            ),
          0,
        ) /
        sessions.length
      ).toFixed(1)

  const averageCompletionTime =
    sessions.length === 0
      ? 0
      : Math.round(
        sessions.reduce(
          (
            total,
            session,
          ) =>
            total +
            Number(
              session.time ||
              0,
            ),
          0,
        ) /
        sessions.length,
      )

  const personalBestAccuracy =
    sessions.length === 0
      ? 0
      : Math.max(
        ...sessions.map(
          (session) =>
            Number(
              session.accuracy ||
              0,
            ),
        ),
      )

  const gameTypes =
    new Set(
      sessions.map(
        (session) =>
          session.game,
      ),
    ).size

  const recentSessions =
    sessions.slice(0, 8)

  const activeReminderCount =
    reminders.filter(
      (reminder) =>
        !reminder.completed,
    ).length

  const upcomingReminders =
    reminders
      .filter(
        (reminder) =>
          !reminder.completed &&
          reminder.dueDatetime,
      )
      .sort(
        (a, b) =>
          new Date(
            a.dueDatetime,
          ).getTime() -
          new Date(
            b.dueDatetime,
          ).getTime(),
      )
      .slice(0, 5)


  // ==========================================
  // Game Helpers
  // ==========================================

  const getGameSessions = (
    gameName,
  ) =>
    sessions.filter(
      (session) =>
        session.game ===
        gameName,
    )

  const getGameAverage = (
    gameName,
  ) => {
    const gameSessions =
      getGameSessions(
        gameName,
      )

    if (
      gameSessions.length ===
      0
    ) {
      return '—'
    }

    const average =
      gameSessions.reduce(
        (
          total,
          session,
        ) =>
          total +
          Number(
            session.accuracy ||
            0,
          ),
        0,
      ) /
      gameSessions.length

    return `${Math.round(
      average,
    )}%`
  }

  const getRecentGameAccuracy = (
    gameName,
  ) => {
    const gameSessions =
      getGameSessions(
        gameName,
      )

    if (
      gameSessions.length ===
      0
    ) {
      return null
    }

    const recent =
      gameSessions.slice(0, 3)

    return (
      recent.reduce(
        (
          total,
          session,
        ) =>
          total +
          Number(
            session.accuracy ||
            0,
          ),
        0,
      ) /
      recent.length
    )
  }

  const getGameTrend = (
    gameName,
  ) => {
    const gameSessions =
      getGameSessions(
        gameName,
      )

    if (
      gameSessions.length < 2
    ) {
      return text.notEnoughData
    }

    const recent =
      gameSessions[0]

    const previous =
      gameSessions[1]

    const difference =
      Number(
        recent.accuracy ||
        0,
      ) -
      Number(
        previous.accuracy ||
        0,
      )

    if (difference > 5) {
      return text.improving
    }

    if (difference < -5) {
      return text.declining
    }

    return text.stable
  }


  const gameNames = [
    'Memory Match',
    'Sequence Memory',
    'Object Recall',
  ]


  const getGameDisplayName = (
    gameName,
  ) => {
    const gameLabels = {
      'Memory Match':
        text.games.memoryMatch,

      'Sequence Memory':
        text.games.sequenceMemory,

      'Object Recall':
        text.games.objectRecall,
    }

    return (
      gameLabels[gameName] ||
      gameName
    )
  }


  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="caregiver-page">

      {/* Header */}

      <header className="caregiver-header">

        <button
          type="button"
          className="caregiver-back-button"
          onClick={onBack}
        >
          <span aria-hidden="true">
            ←
          </span>

          {text.backToDashboard}
        </button>


        <div className="caregiver-heading">

          <div
            className="caregiver-heading-icon"
            aria-hidden="true"
          >
            <CaregiverIcon
              type="user"
            />
          </div>


          <div>

            <span className="caregiver-eyebrow">
              {text.connectedUser}
            </span>

            <h1>
              {text.caregiverDashboardTitle}
            </h1>

            <p>
              {text.caregiverDashboardDescription}
            </p>

          </div>

        </div>


        <VoiceReadAloud
          text={
            `${text.caregiverDashboardTitle}. ` +
            `${text.caregiverDashboardDescription}`
          }
          language={language}
          label={readAloudLabel}
          stopLabel={stopReadingLabel}
        />


        {linkedElderly && (
          <div className="caregiver-linked-user">

            <span>
              {text.currentlyViewing}
            </span>

            <strong>
              {linkedElderly.full_name}
            </strong>

          </div>
        )}

      </header>


      {/* Loading */}

      {loading && (
        <div className="caregiver-message">
          {text.loadingCaregiverData}
        </div>
      )}


      {/* Error */}

      {!loading &&
        error && (
          <div className="caregiver-message caregiver-message--error">
            {error}
          </div>
        )}


      {/* No approved connection */}

      {!loading &&
        !error &&
        !linkedElderly && (
          <section className="caregiver-empty">

            <div
              className="caregiver-empty-icon"
              aria-hidden="true"
            >
              <CaregiverIcon
                type="user"
              />
            </div>

            <h2>
              {text.noApprovedConnection}
            </h2>

            <p>
              {text.noApprovedConnectionDescription}
            </p>

          </section>
        )}


      {/* Linked elderly data */}

      {!loading &&
        !error &&
        linkedElderly && (
          <>
            {/* View Switcher Tabs */}
            <div className="caregiver-tab-bar" role="tablist" aria-label="Dashboard Views">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'overview'}
                className={`caregiver-tab ${activeTab === 'overview' ? 'caregiver-tab--active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Activity Overview & Details
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'progress-report'}
                className={`caregiver-tab ${activeTab === 'progress-report' ? 'caregiver-tab--active' : ''}`}
                onClick={() => setActiveTab('progress-report')}
              >
                🧠 Cognitive Progress Report
              </button>
            </div>

            {activeTab === 'progress-report' ? (
              <div className="caregiver-progress-report-view">
                {/* Period selection */}
                <div
                  className="cpi-controls-bar"
                  style={{
                    background: '#ffffff',
                    padding: '16px 20px',
                    borderRadius: '18px',
                    border: '1px solid var(--border-light)',
                    marginBottom: '20px',
                  }}
                >
                  <div className="cpi-period-tabs" role="tablist" aria-label="Reporting Period">
                    {[
                      { id: '7d', label: '7 Days' },
                      { id: '30d', label: '30 Days' },
                      { id: '90d', label: '90 Days' },
                      { id: 'all', label: 'All History' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={reportPeriod === tab.id}
                        className={`cpi-period-tab ${reportPeriod === tab.id ? 'cpi-period-tab--active' : ''}`}
                        onClick={() => setReportPeriod(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="cpi-filter-group" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="cpi-game-filter">
                      <label htmlFor="cg-game-select" className="cpi-filter-label">Activity:</label>
                      <select
                        id="cg-game-select"
                        value={reportGame}
                        onChange={(e) => setReportGame(e.target.value)}
                        className="cpi-select"
                      >
                        <option value="all">All Activities</option>
                        <option value="Memory Match">Memory Match</option>
                        <option value="Sequence Memory">Sequence Memory</option>
                        <option value="Object Recall">Object Recall</option>
                        <option value="NER Cultural Recall">NER Cultural Recall</option>
                        <option value="Personal Memory Recall">Personal Memory Recall</option>
                      </select>
                    </div>

                    <div className="cpi-game-filter">
                      <label htmlFor="cg-diff-select" className="cpi-filter-label">Difficulty:</label>
                      <select
                        id="cg-diff-select"
                        value={reportDifficulty}
                        onChange={(e) => setReportDifficulty(e.target.value)}
                        className="cpi-select"
                      >
                        <option value="all">All Difficulties</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                        <option value="Standard">Standard</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="cpi-print-btn"
                      onClick={() => window.print()}
                      aria-label="Print or save caregiver progress report"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                      </svg>
                      <span>Print / Save</span>
                    </button>
                  </div>
                </div>

                {reportLoading && (
                  <div className="cpi-loading-state">
                    <div className="cpi-spinner" />
                    <p>Generating progress report for {linkedElderly.full_name}...</p>
                  </div>
                )}

                {reportError && (
                  <div className="cpi-error-state" role="alert">
                    <p className="cpi-error-text">{reportError}</p>
                  </div>
                )}

                {!reportLoading && !reportError && progressReport && (
                  <div className="cpi-content">
                    {/* Hero Caregiver Summary */}
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fc 100%)',
                        border: '1.5px solid #bcdbf7',
                        borderRadius: '20px',
                        padding: '24px 28px',
                        boxShadow: '0 4px 18px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.6px',
                          background: '#4c7fb8',
                          color: '#ffffff',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          alignSelf: 'flex-start',
                        }}
                      >
                        Plain-Language Caregiver Summary
                      </span>
                      <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#1e3a5f', margin: 0, lineHeight: 1.5 }}>
                        {progressReport.plain_language_summary}
                      </h3>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13.5px', color: '#4a6b8f' }}>
                        <span>Connected: <strong>{progressReport.elderly_user.full_name}</strong></span>
                        <span>Window: <strong>{reportPeriod === '7d' ? 'Last 7 Days' : reportPeriod === '30d' ? 'Last 30 Days' : reportPeriod === '90d' ? 'Last 90 Days' : 'All History'}</strong></span>
                        <span>Evaluated Sessions: <strong>{progressReport.overview.totalCompleted}</strong></span>
                      </div>
                    </div>

                    {/* Overview Stats */}
                    <div className="cpi-stats-grid">
                      <article className="cpi-stat-card">
                        <div className="cpi-stat-icon cpi-stat-icon--purple" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="4" width="18" height="18" rx="4" />
                            <path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                        </div>
                        <div className="cpi-stat-body">
                          <span className="cpi-stat-val">{progressReport.overview.totalCompleted}</span>
                          <span className="cpi-stat-label">Total Sessions</span>
                          <span className="cpi-stat-sub">{progressReport.overview.sessionsPerWeek} sessions / week</span>
                        </div>
                      </article>

                      <article className="cpi-stat-card">
                        <div className="cpi-stat-icon cpi-stat-icon--teal" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </div>
                        <div className="cpi-stat-body">
                          <span className="cpi-stat-val">{progressReport.overview.avgAccuracy}%</span>
                          <span className="cpi-stat-label">Average Accuracy</span>
                          <span className="cpi-stat-sub">
                            {progressReport.baselineComparison.isReliable
                              ? `${progressReport.baselineComparison.accuracyDiff >= 0 ? '+' : ''}${progressReport.baselineComparison.accuracyDiff}% vs baseline`
                              : 'Baseline accumulating'}
                          </span>
                        </div>
                      </article>

                      <article className="cpi-stat-card">
                        <div className="cpi-stat-icon cpi-stat-icon--peach" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </div>
                        <div className="cpi-stat-body">
                          <span className="cpi-stat-val">{progressReport.overview.avgMistakes}</span>
                          <span className="cpi-stat-label">Mistakes / Session</span>
                          <span className="cpi-stat-sub">Across completed activities</span>
                        </div>
                      </article>

                      <article className="cpi-stat-card">
                        <div className="cpi-stat-icon cpi-stat-icon--blue" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </div>
                        <div className="cpi-stat-body">
                          <span className="cpi-stat-val">{progressReport.overview.avgTime > 0 ? `${progressReport.overview.avgTime}s` : '—'}</span>
                          <span className="cpi-stat-label">Average Duration</span>
                          <span className="cpi-stat-sub">Most active: {progressReport.overview.mostPlayedGame}</span>
                        </div>
                      </article>
                    </div>

                    {/* Baseline Comparison Card */}
                    <div className="cpi-baseline-card">
                      <div className="cpi-section-header">
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Personal Baseline Comparison</h3>
                        {progressReport.baselineComparison.isReliable && (
                          <span className={`cpi-status-badge cpi-status-badge--${progressReport.baselineComparison.overallStatus}`}>
                            {progressReport.baselineComparison.overallStatus === 'improving' ? '📈 Improving' : progressReport.baselineComparison.overallStatus === 'declining' ? '📉 Differing from Baseline' : '⚖️ Broadly Stable'}
                          </span>
                        )}
                      </div>

                      {progressReport.baselineComparison.isReliable ? (
                        <>
                          <div className="cpi-baseline-grid">
                            <div className="cpi-baseline-col">
                              <span className="cpi-baseline-metric-label">Accuracy Comparison</span>
                              <div className="cpi-baseline-vals">
                                <div>
                                  <span className="cpi-b-label">Baseline</span>
                                  <strong className="cpi-b-val">{progressReport.baselineComparison.baselineAccuracy}%</strong>
                                </div>
                                <span className="cpi-arrow">→</span>
                                <div>
                                  <span className="cpi-b-label">Recent</span>
                                  <strong className="cpi-b-val">{progressReport.baselineComparison.recentAccuracy}%</strong>
                                </div>
                              </div>
                              <div className={`cpi-diff-pill ${progressReport.baselineComparison.accuracyDiff >= 0 ? 'cpi-diff-pill--pos' : 'cpi-diff-pill--neg'}`}>
                                {progressReport.baselineComparison.accuracyDiff >= 0 ? '+' : ''}{progressReport.baselineComparison.accuracyDiff}% points
                              </div>
                            </div>

                            <div className="cpi-baseline-col">
                              <span className="cpi-baseline-metric-label">Mistake Frequency</span>
                              <div className="cpi-baseline-vals">
                                <div>
                                  <span className="cpi-b-label">Baseline</span>
                                  <strong className="cpi-b-val">{progressReport.baselineComparison.baselineMistakes}</strong>
                                </div>
                                <span className="cpi-arrow">→</span>
                                <div>
                                  <span className="cpi-b-label">Recent</span>
                                  <strong className="cpi-b-val">{progressReport.baselineComparison.recentMistakes}</strong>
                                </div>
                              </div>
                              <div className={`cpi-diff-pill ${progressReport.baselineComparison.mistakesDiff <= 0 ? 'cpi-diff-pill--pos' : 'cpi-diff-pill--neg'}`}>
                                {progressReport.baselineComparison.mistakesDiff <= 0 ? '' : '+'}{progressReport.baselineComparison.mistakesDiff} mistakes / game
                              </div>
                            </div>

                            <div className="cpi-baseline-col">
                              <span className="cpi-baseline-metric-label">Completion Duration</span>
                              <div className="cpi-baseline-vals">
                                <div>
                                  <span className="cpi-b-label">Baseline</span>
                                  <strong className="cpi-b-val">{progressReport.baselineComparison.baselineTime}s</strong>
                                </div>
                                <span className="cpi-arrow">→</span>
                                <div>
                                  <span className="cpi-b-label">Recent</span>
                                  <strong className="cpi-b-val">{progressReport.baselineComparison.recentTime}s</strong>
                                </div>
                              </div>
                              <div className="cpi-diff-pill cpi-diff-pill--neutral">
                                {progressReport.baselineComparison.timeDiff <= 0 ? '' : '+'}{progressReport.baselineComparison.timeDiff}s duration
                              </div>
                            </div>
                          </div>

                          <div className="cpi-baseline-footer">
                            <p className="cpi-baseline-evidence"><strong>Evidence:</strong> {progressReport.baselineComparison.evidenceText}</p>
                          </div>
                        </>
                      ) : (
                        <p className="cpi-empty-text">{progressReport.baselineComparison.reason}</p>
                      )}
                    </div>

                    {/* Sustained Changes Area */}
                    {progressReport.sustainedChanges && progressReport.sustainedChanges.length > 0 && (
                      <div className="cpi-sustained-list">
                        {progressReport.sustainedChanges.map((alert) => (
                          <article key={alert.id} className={`cpi-sustained-card cpi-sustained-card--${alert.type}`}>
                            <div className="cpi-sustained-header">
                              <span className="cpi-sustained-badge">{alert.type === 'positive' ? '✨ Positive Trend' : '🔍 Caregiver Observation'}</span>
                              <span className="cpi-sustained-sessions">Observed across {alert.sessionCount} sessions</span>
                            </div>
                            <h3 className="cpi-sustained-title">{alert.title}</h3>
                            <p className="cpi-sustained-desc">{alert.description}</p>
                            <div className="cpi-sustained-context"><strong>Caregiver Note:</strong> {alert.contextNote}</div>
                          </article>
                        ))}
                      </div>
                    )}

                    {/* Trend Chart */}
                    <div className="cpi-chart-container">
                      <div className="cpi-section-header">
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Activity Trend Chart</h3>
                        <div className="cpi-chart-tabs" role="tablist">
                          {[
                            { id: 'accuracy', label: 'Accuracy (%)' },
                            { id: 'mistakes', label: 'Mistakes' },
                            { id: 'time', label: 'Duration (s)' },
                            { id: 'participation', label: 'Weekly Rhythm' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              role="tab"
                              aria-selected={reportMetric === m.id}
                              className={`cpi-chart-tab ${reportMetric === m.id ? 'cpi-chart-tab--active' : ''}`}
                              onClick={() => {
                                setReportMetric(m.id)
                                setSelectedPoint(null)
                              }}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <ProgressTrendChart
                        points={progressReport.trendPoints}
                        metric={reportMetric}
                        baselineValue={
                          reportMetric === 'accuracy'
                            ? progressReport.baselineComparison.baselineAccuracy
                            : reportMetric === 'mistakes'
                            ? progressReport.baselineComparison.baselineMistakes
                            : reportMetric === 'time'
                            ? progressReport.baselineComparison.baselineTime
                            : null
                        }
                        weeklyData={progressReport.weeklyParticipation}
                        onSelectPoint={(p) => setSelectedPoint(p)}
                        selectedPoint={selectedPoint}
                      />
                    </div>

                    {/* Activity Breakdown */}
                    <div className="cpi-games-grid">
                      {progressReport.gameBreakdown && progressReport.gameBreakdown.map((g) => (
                        <article key={g.game} className="cpi-game-card">
                          <div className="cpi-game-card-top">
                            <h3 className="cpi-game-name">{g.game}</h3>
                            <span className={`cpi-status-badge cpi-status-badge--${g.status}`}>{g.status}</span>
                          </div>
                          <div className="cpi-game-card-metrics">
                            <div className="cpi-g-metric"><span className="cpi-g-label">Sessions</span><strong className="cpi-g-val">{g.sessionCount}</strong></div>
                            <div className="cpi-g-metric"><span className="cpi-g-label">Avg Accuracy</span><strong className="cpi-g-val">{g.avgAccuracy}%</strong></div>
                            <div className="cpi-g-metric"><span className="cpi-g-label">Avg Mistakes</span><strong className="cpi-g-val">{g.avgMistakes}</strong></div>
                            <div className="cpi-g-metric"><span className="cpi-g-label">Avg Duration</span><strong className="cpi-g-val">{g.avgTime > 0 ? `${g.avgTime}s` : '—'}</strong></div>
                          </div>
                        </article>
                      ))}
                    </div>

                    {/* Medical Disclaimer */}
                    <div className="cpi-disclaimer-box">
                      <div className="cpi-disclaimer-icon">🛡️</div>
                      <div>
                        <h4 className="cpi-disclaimer-title">Assistive Caregiver Tracking Notice</h4>
                        <p className="cpi-disclaimer-text">{progressReport.disclaimer}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Overview */}

                <section className="caregiver-overview">

              <div className="caregiver-overview-heading">

                <span>
                  {text.connectedUser}
                </span>

                <h2>
                  {linkedElderly.full_name}
                </h2>

              </div>


              <div className="caregiver-stats-grid">

                <CaregiverStatCard
                  icon="sessions"
                  value={
                    sessions.length
                  }
                  label={
                    text.totalSessions
                  }
                />

                <CaregiverStatCard
                  icon="games"
                  value={gameTypes}
                  label={
                    text.gamesPlayed
                  }
                />

                <CaregiverStatCard
                  icon="accuracy"
                  value={`${averageAccuracy}%`}
                  label={
                    text.averageAccuracy
                  }
                />

                <CaregiverStatCard
                  icon="memory"
                  value={memoryCount}
                  label={
                    text.savedMemories
                  }
                />

                <CaregiverStatCard
                  icon="reminder"
                  value={
                    activeReminderCount
                  }
                  label={
                    text.activeReminders
                  }
                />

                <CaregiverStatCard
                  icon="mistakes"
                  value={
                    averageMistakes
                  }
                  label={
                    text.averageMistakes
                  }
                />

                <CaregiverStatCard
                  icon="time"
                  value={
                    formatTime(
                      averageCompletionTime,
                    )
                  }
                  label={
                    text.averageCompletionTime
                  }
                />

                <CaregiverStatCard
                  icon="accuracy"
                  value={`${personalBestAccuracy}%`}
                  label={
                    text.personalBestAccuracy
                  }
                />

              </div>

            </section>


            {/* Connected User */}

            <section className="caregiver-intro-panel">

              <div className="caregiver-intro-icon">
                <CaregiverIcon
                  type="user"
                />
              </div>

              <div>

                <span className="caregiver-section-label">
                  {text.connectedUser}
                </span>

                <h2>
                  {linkedElderly.full_name}
                </h2>

                <p>
                  {text.connectedUserDescription}
                </p>

              </div>

            </section>


            {/* Game Performance */}

            <section className="caregiver-panel">

              <div className="caregiver-section-heading">

                <div>

                  <span className="caregiver-section-label">
                    {text.gamesPlayed}
                  </span>

                  <h2>
                    {text.gamePerformance}
                  </h2>

                </div>

              </div>


              <div className="caregiver-game-grid">

                {gameNames.map(
                  (gameName) => {

                    const count =
                      getGameSessions(
                        gameName,
                      ).length

                    const recentAccuracy =
                      getRecentGameAccuracy(
                        gameName,
                      )

                    return (
                      <article
                        className="caregiver-game-card"
                        key={gameName}
                      >

                        <span className="caregiver-card-badge">
                          {count}{' '}

                          {count ===
                            1
                            ? text.session
                            : text.sessions}
                        </span>


                        <h3>
                          {getGameDisplayName(
                            gameName,
                          )}
                        </h3>


                        <strong className="caregiver-game-average">
                          {getGameAverage(
                            gameName,
                          )}
                        </strong>


                        <span className="caregiver-game-average-label">
                          {text.averageAccuracy}
                        </span>


                        <div className="caregiver-game-meta">

                          <span>
                            {text.trend}:{' '}

                            <strong>
                              {getGameTrend(
                                gameName,
                              )}
                            </strong>
                          </span>


                          <span>
                            {text.recent}:{' '}

                            <strong>
                              {
                                recentAccuracy ===
                                  null
                                  ? '—'
                                  : `${Math.round(
                                    recentAccuracy,
                                  )}%`
                              }
                            </strong>
                          </span>

                        </div>

                      </article>
                    )
                  },
                )}

              </div>

            </section>


            {/* Upcoming Reminders */}

            <section className="caregiver-panel">

              <div className="caregiver-section-heading">

                <div>

                  <span className="caregiver-section-label">
                    {text.planning}
                  </span>

                  <h2>
                    {text.upcomingReminders}
                  </h2>

                  <p>
                    {text.upcomingRemindersDescription}
                  </p>

                </div>

              </div>


              {upcomingReminders.length ===
                0 ? (

                <div className="caregiver-empty caregiver-empty--small">

                  <div className="caregiver-empty-icon caregiver-empty-icon--small">
                    <CaregiverIcon
                      type="reminder"
                    />
                  </div>

                  <p>
                    {text.noUpcomingReminders}
                  </p>

                </div>

              ) : (

                <div className="caregiver-reminder-list">

                  {upcomingReminders.map(
                    (reminder) => (
                      <article
                        className="caregiver-reminder-item"
                        key={reminder.id}
                      >

                        <div className="caregiver-reminder-icon">
                          <CaregiverIcon
                            type="reminder"
                          />
                        </div>


                        <div className="caregiver-reminder-main">

                          <h3>
                            {reminder.title}
                          </h3>

                          <p>
                            {reminder.description}
                          </p>

                        </div>


                        <div className="caregiver-reminder-meta">

                          <span>
                            {reminder.category}
                          </span>

                          <time>
                            {formatReminderDate(
                              reminder.dueDatetime,
                            )}
                          </time>

                        </div>

                      </article>
                    ),
                  )}

                </div>
              )}

            </section>


            {/* Recent Activity */}

            <section className="caregiver-panel">

              <div className="caregiver-section-heading">

                <div>

                  <span className="caregiver-section-label">
                    {text.recentActivity}
                  </span>

                  <h2>
                    {text.recentActivity}
                  </h2>

                </div>

              </div>


              {recentSessions.length ===
                0 ? (

                <div className="caregiver-empty caregiver-empty--small">

                  <div className="caregiver-empty-icon caregiver-empty-icon--small">
                    <CaregiverIcon
                      type="sessions"
                    />
                  </div>

                  <p>
                    {text.noSessionsRecorded}
                  </p>

                </div>

              ) : (

                <div className="caregiver-table-wrapper">

                  <table className="caregiver-table">

                    <thead>
                      <tr>
                        <th>
                          {text.game}
                        </th>

                        <th>
                          {text.difficulty}
                        </th>

                        <th>
                          {text.accuracy}
                        </th>

                        <th>
                          {text.mistakes}
                        </th>

                        <th>
                          {text.time}
                        </th>

                        <th>
                          {text.date}
                        </th>
                      </tr>
                    </thead>


                    <tbody>

                      {recentSessions.map(
                        (session) => (
                          <tr
                            key={
                              session.id
                            }
                          >

                            <td>
                              {
                                getGameDisplayName(
                                  session.game,
                                )
                              }
                            </td>

                            <td>
                              {
                                session.difficulty
                              }
                            </td>

                            <td>
                              {
                                session.accuracy
                              }%
                            </td>

                            <td>
                              {
                                session.mistakes
                              }
                            </td>

                            <td>
                              {formatTime(
                                session.time,
                              )}
                            </td>

                            <td>
                              {formatDate(
                                session.created_at,
                              )}
                            </td>

                          </tr>
                        ),
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </section>
          </>
        )}
      </>
    )}

    </div>
  )
}


export default CaregiverDashboard