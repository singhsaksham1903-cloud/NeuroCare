import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import './CaregiverDashboard.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import { apiGet } from '../utils/api'


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
  const [elderlyMemories, setElderlyMemories] = useState([])
  const [memoryPermission, setMemoryPermission] = useState({
    access_granted: true,
    emergency_mode_enabled: false,
    can_view: true,
  })

  const [linkedElderly, setLinkedElderly] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


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
        setElderlyMemories([])
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
        setElderlyMemories([])
        setLinkedElderly(null)

        return
      }

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
        0,
      )

      setReminders(
        linkedData.reminders ||
        [],
      )

      setElderlyMemories(
        linkedData.memories ||
        [],
      )

      if (linkedData.memory_permission) {
        setMemoryPermission(linkedData.memory_permission)
      }
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


            {/* Memory Vault Section */}
            <section className="caregiver-panel">
              <div className="caregiver-section-heading">
                <div>
                  <span className="caregiver-section-label">
                    AI Personal Memory Vault
                  </span>
                  <h2>
                    {linkedElderly.full_name}&apos;s Memories
                  </h2>
                </div>
                {memoryPermission.emergency_mode_enabled && (
                  <span style={{ padding: '6px 12px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontWeight: 800, fontSize: '0.85rem' }}>
                    🚨 Emergency Mode Active
                  </span>
                )}
              </div>

              {!memoryPermission.can_view ? (
                <div className="caregiver-empty caregiver-empty--small" style={{ background: '#fef7f5', borderColor: '#fed7aa' }}>
                  <span style={{ fontSize: '2rem' }}>🔒</span>
                  <h3 style={{ color: '#9a3412', marginTop: 8 }}>Memory Vault is Private</h3>
                  <p style={{ color: '#7c2d12', maxWidth: 480, margin: '6px auto 0' }}>
                    {linkedElderly.full_name} has not granted sharing access for their memories. They can grant permission anytime from their Memory Vault privacy settings.
                  </p>
                </div>
              ) : elderlyMemories.length === 0 ? (
                <div className="caregiver-empty caregiver-empty--small">
                  <p>No memories have been recorded yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
                  {elderlyMemories.map((mem) => (
                    <article key={mem.id} style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: '#f3e8ff', color: '#6b21a8' }}>
                          {mem.category}
                        </span>
                        {mem.mood && (
                          <span style={{ fontSize: '0.8rem', color: '#b45309' }}>
                            {mem.mood}
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1.05rem', margin: '4px 0', color: '#111827' }}>{mem.title}</h4>
                      <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: 1.5, margin: 0 }}>
                        {mem.description.slice(0, 120)}
                        {mem.description.length > 120 ? '...' : ''}
                      </p>
                      {mem.aiSummary && (
                        <div style={{ fontSize: '0.82rem', color: '#9f1239', background: '#fff1f2', padding: '6px 10px', borderRadius: 8 }}>
                          ✨ {mem.aiSummary}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#6b7280', marginTop: 'auto', paddingTop: '8px' }}>
                        <span>{mem.memoryDate ? new Date(mem.memoryDate).toLocaleDateString() : 'No date'}</span>
                        {mem.location && <span>📍 {mem.location}</span>}
                        {mem.audioData && <span>🎙️ Voice Note</span>}
                      </div>
                    </article>
                  ))}
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

    </div>
  )
}


export default CaregiverDashboard