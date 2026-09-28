import { useEffect, useState } from 'react'

import './CaregiverDashboard.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import { apiGet } from '../utils/api'


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

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')


  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      // ------------------------------------------------------
      // Caregiver-only access
      // ------------------------------------------------------

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


      // ------------------------------------------------------
      // Find caregiver connections
      // ------------------------------------------------------

      const linksData = await apiGet(
        '/caregiver-links',
      )

      const links = Array.isArray(
        linksData,
      )
        ? linksData
        : []


      // ------------------------------------------------------
      // Find approved connection
      // ------------------------------------------------------

      const approvedLink =
        links.find(
          (link) =>
            link.status === 'approved',
        )


      // ------------------------------------------------------
      // No approved elderly connection
      // ------------------------------------------------------

      if (!approvedLink) {
        setSessions([])
        setMemories([])
        setReminders([])
        setLinkedElderly(null)

        return
      }


      // ------------------------------------------------------
      // Load linked elderly data
      // ------------------------------------------------------

      const linkedData =
        await apiGet(
          `/caregiver-links/${approvedLink.id}/data`,
        )


      setLinkedElderly(
        linkedData.elderly_user || null,
      )

      setSessions(
        linkedData.sessions || [],
      )

      setMemoryCount(
        linkedData.memory_count || 0,
      )

      setReminders(
        linkedData.reminders || [],
      )
    } catch (err) {

      setError(
        err.message ||
        text.loadError,
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadData()
  }, [user])


  // ==========================================================
  // Format Time
  // ==========================================================

  const formatTime = (seconds) => {
    const totalSeconds =
      Number(seconds || 0)

    const minutes = Math.floor(
      totalSeconds / 60,
    )

    const remainingSeconds =
      totalSeconds % 60

    return `${String(
      minutes,
    ).padStart(2, '0')}:${String(
      remainingSeconds,
    ).padStart(2, '0')}`
  }


  // ==========================================================
  // Format Date
  // ==========================================================

  const formatDate = (value) => {
    if (!value) {
      return text.unknown
    }

    const date = new Date(value)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return text.unknown
    }

    return date.toLocaleString()
  }


  // ==========================================================
  // Format Reminder Date
  // ==========================================================

  const formatReminderDate = (
    value,
  ) => {
    if (!value) {
      return text.noDueDate
    }

    const date = new Date(value)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value
    }

    return date.toLocaleString()
  }


  // ==========================================================
  // Summary Statistics
  // ==========================================================

  const averageAccuracy =
    sessions.length === 0
      ? 0
      : Math.round(
        sessions.reduce(
          (total, session) =>
            total +
            Number(
              session.accuracy || 0,
            ),
          0,
        ) / sessions.length,
      )
  const averageMistakes =
    sessions.length === 0
      ? '—'
      : (
        sessions.reduce(
          (total, session) =>
            total +
            Number(session.mistakes || 0),
          0,
        ) / sessions.length
      ).toFixed(1)

  const averageCompletionTime =
    sessions.length === 0
      ? 0
      : Math.round(
        sessions.reduce(
          (total, session) =>
            total +
            Number(session.time || 0),
          0,
        ) / sessions.length,
      )

  const personalBestAccuracy =
    sessions.length === 0
      ? 0
      : Math.max(
        ...sessions.map(
          (session) =>
            Number(session.accuracy || 0),
        ),
      )


  const gameTypes = new Set(
    sessions.map(
      (session) => session.game,
    ),
  ).size


  const recentSessions =
    sessions.slice(0, 8)


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


  // ==========================================================
  // Game Helpers
  // ==========================================================

  const getGameSessions = (
    gameName,
  ) =>
    sessions.filter(
      (session) =>
        session.game === gameName,
    )


  const getGameAverage = (
    gameName,
  ) => {
    const gameSessions =
      getGameSessions(
        gameName,
      )

    if (
      gameSessions.length === 0
    ) {
      return '—'
    }

    const average =
      gameSessions.reduce(
        (total, session) =>
          total +
          Number(
            session.accuracy || 0,
          ),
        0,
      ) / gameSessions.length

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
      gameSessions.length === 0
    ) {
      return null
    }

    const recent =
      gameSessions.slice(0, 3)

    return (
      recent.reduce(
        (total, session) =>
          total +
          Number(
            session.accuracy || 0,
          ),
        0,
      ) / recent.length
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
        recent.accuracy || 0,
      ) -
      Number(
        previous.accuracy || 0,
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


  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div className="caregiver-page">

      {/* ====================================================
          Header
          ==================================================== */}

      <header className="caregiver-header">

        <button
          type="button"
          className="caregiver-back-button"
          onClick={onBack}
        >
          ← {text.backToDashboard}
        </button>


        <h1>
          👤 {text.caregiverDashboardTitle}
        </h1>


        <p>
          {text.caregiverDashboardDescription}
        </p>
        <VoiceReadAloud
          text={`${text.caregiverDashboardTitle}. ${text.caregiverDashboardDescription}`}
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


      {/* ====================================================
          Loading
          ==================================================== */}

      {loading && (
        <div className="caregiver-message">
          {text.loadingCaregiverData}
        </div>
      )}


      {/* ====================================================
          Error
          ==================================================== */}

      {!loading && error && (
        <div className="caregiver-message caregiver-message--error">
          {error}
        </div>
      )}


      {/* ====================================================
          No approved connection
          ==================================================== */}

      {!loading &&
        !error &&
        !linkedElderly && (
          <section className="caregiver-empty">

            <h2>
              {text.noApprovedConnection}
            </h2>

            <p>
              {text.noApprovedConnectionDescription}
            </p>

          </section>
        )}


      {/* ====================================================
          Linked Elderly Data
          ==================================================== */}

      {!loading &&
        !error &&
        linkedElderly && (
          <>

            {/* ==================================================
                Summary
                ================================================== */}

            <section className="caregiver-summary">

              <div className="caregiver-stat">
                <strong>
                  {sessions.length}
                </strong>

                <span>
                  {text.totalSessions}
                </span>
              </div>


              <div className="caregiver-stat">
                <strong>
                  {gameTypes}
                </strong>

                <span>
                  {text.gamesPlayed}
                </span>
              </div>


              <div className="caregiver-stat">
                <strong>
                  {averageAccuracy}%
                </strong>

                <span>
                  {text.averageAccuracy}
                </span>
              </div>


              <div className="caregiver-stat">
                <strong>
                  {memoryCount}
                </strong>

                <span>
                  {text.savedMemories}
                </span>
              </div>


              <div className="caregiver-stat">
                <strong>
                  {
                    reminders.filter(
                      (reminder) =>
                        !reminder.completed,
                    ).length
                  }
                </strong>

                <span>
                  {text.activeReminders}
                </span>
              </div>

              <div className="caregiver-stat">
                <strong>
                  {averageMistakes}
                </strong>
                <span>
                  {text.averageMistakes}
                </span>
              </div>

              <div className="caregiver-stat">
                <strong>
                  {formatTime(averageCompletionTime)}
                </strong>
                <span>
                  {text.averageCompletionTime}
                </span>
              </div>

              <div className="caregiver-stat">
                <strong>
                  {personalBestAccuracy}%
                </strong>
                <span>
                  {text.personalBestAccuracy}
                </span>
              </div>

            </section>


            {/* ==================================================
                Linked User Notice
                ================================================== */}

            <section className="caregiver-recommendation">

              <span className="caregiver-section-label">
                {text.connectedUser}
              </span>


              <h2>
                {linkedElderly.full_name}
              </h2>


              <p className="caregiver-recommendation-reason">
                {text.connectedUserDescription}
              </p>

            </section>


            {/* ==================================================
                Game Performance
                ================================================== */}

            <section className="caregiver-game-summary">

              <h2>
                {text.gamePerformance}
              </h2>


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

                        <h3>
                          {getGameDisplayName(
                            gameName,
                          )}
                        </h3>


                        <strong>
                          {getGameAverage(
                            gameName,
                          )}
                        </strong>


                        <span>
                          {count}{' '}
                          {count === 1
                            ? text.session
                            : text.sessions}
                        </span>


                        <div className="caregiver-game-meta">

                          <span>
                            {text.trend}:{' '}
                            {getGameTrend(
                              gameName,
                            )}
                          </span>


                          <span>
                            {text.recent}:{' '}
                            {recentAccuracy ===
                              null
                              ? '—'
                              : `${Math.round(
                                recentAccuracy,
                              )}%`}
                          </span>

                        </div>

                      </article>
                    )
                  },
                )}

              </div>

            </section>


            {/* ==================================================
                Upcoming Reminders
                ================================================== */}

            <section className="caregiver-reminders-section">

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

                <div className="caregiver-empty">
                  {text.noUpcomingReminders}
                </div>

              ) : (

                <div className="caregiver-reminder-list">

                  {upcomingReminders.map(
                    (reminder) => (
                      <article
                        className="caregiver-reminder-item"
                        key={reminder.id}
                      >

                        <div>

                          <h3>
                            {reminder.title}
                          </h3>


                          <p>
                            {
                              reminder.description
                            }
                          </p>

                        </div>


                        <div className="caregiver-reminder-meta">

                          <span>
                            {
                              reminder.category
                            }
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


            {/* ==================================================
                Recent Activity
                ================================================== */}

            <section className="caregiver-recent">

              <h2>
                {text.recentActivity}
              </h2>


              {recentSessions.length ===
                0 ? (

                <div className="caregiver-empty">
                  {text.noSessionsRecorded}
                </div>

              ) : (

                <div className="caregiver-table-wrapper">

                  <table className="caregiver-table">

                    <thead>
                      <tr>
                        <th>{text.game}</th>
                        <th>{text.difficulty}</th>
                        <th>{text.accuracy}</th>
                        <th>{text.mistakes}</th>
                        <th>{text.time}</th>
                        <th>{text.date}</th>
                      </tr>
                    </thead>


                    <tbody>

                      {recentSessions.map(
                        (session) => (
                          <tr
                            key={session.id}
                          >

                            <td>
                              {getGameDisplayName(
                                session.game,
                              )}
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