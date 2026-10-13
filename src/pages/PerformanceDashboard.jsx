import { useEffect, useState } from 'react'

import './PerformanceDashboard.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import { apiGet } from '../utils/api'


// ============================================
// Small SVG Icons
// ============================================

function PerformanceIcon({ type }) {
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
          y="9"
          width="32"
          height="30"
          rx="8"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          d="M16 17H32"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M16 24H29"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M16 31H25"
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
          d="M11 33L20 24L27 29L38 16"
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
          d="M18 18L30 30"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M30 18L18 30"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'time') {
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
          d="M24 16V24L29 28"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

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
        d="M16 25L21 30L32 19"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


// ============================================
// Performance Stat Card
// ============================================

function PerformanceStatCard({
  icon,
  value,
  label,
}) {
  return (
    <article className="performance-stat-card">

      <div
        className="performance-stat-icon"
        aria-hidden="true"
      >
        <PerformanceIcon type={icon} />
      </div>

      <div className="performance-stat-content">

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
// Performance Dashboard
// ============================================

function PerformanceDashboard({
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
  onBack,
}) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')


  useEffect(() => {
    let active = true

    const loadSessions = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await apiGet(
          '/game-sessions',
        )

        if (!active) {
          return
        }

        setSessions(data.sessions || [])
      } catch (err) {
        if (!active) {
          return
        }

        setError(
          err.message ||
          'Could not load performance data from the backend.',
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    const handlePerformanceUpdate = () => {
      void loadSessions()
    }

    void loadSessions()

    window.addEventListener(
      'cognicare:performance-updated',
      handlePerformanceUpdate,
    )

    return () => {
      active = false
      window.removeEventListener(
        'cognicare:performance-updated',
        handlePerformanceUpdate,
      )
    }
  }, [])


  // ==========================================
  // Core Metrics
  // ==========================================

  const averageAccuracy =
    sessions.length === 0
      ? 0
      : Math.round(
        sessions.reduce(
          (total, session) =>
            total +
            Number(session.accuracy || 0),
          0,
        ) / sessions.length,
      )


  const recentAccuracyTrend =
    sessions.length < 2
      ? '—'
      : (() => {
        const recentSessions =
          sessions.slice(0, 3)

        const recentAverage =
          recentSessions.reduce(
            (total, session) =>
              total +
              Number(session.accuracy || 0),
            0,
          ) /
          recentSessions.length

        const olderSessions =
          sessions.slice(3, 6)

        if (
          olderSessions.length === 0
        ) {
          return '—'
        }

        const olderAverage =
          olderSessions.reduce(
            (total, session) =>
              total +
              Number(session.accuracy || 0),
            0,
          ) /
          olderSessions.length

        if (
          recentAverage >
          olderAverage
        ) {
          return text.trendImproving
        }

        if (
          recentAverage <
          olderAverage
        ) {
          return text.trendNeedsPractice
        }

        return text.trendStable
      })()


  const personalBestAccuracy =
    sessions.length === 0
      ? 0
      : Math.max(
        ...sessions.map(
          (session) =>
            Number(
              session.accuracy || 0,
            ),
        ),
      )


  const averageMistakes =
    sessions.length === 0
      ? '—'
      : (
        sessions.reduce(
          (total, session) =>
            total +
            Number(
              session.mistakes || 0,
            ),
          0,
        ) / sessions.length
      ).toFixed(1)


  const averageTime =
    sessions.length === 0
      ? 0
      : Math.round(
        sessions.reduce(
          (total, session) =>
            total +
            Number(
              session.time || 0,
            ),
          0,
        ) / sessions.length,
      )


  const gameTypes =
    new Set(
      sessions.map(
        (session) => session.game,
      ),
    ).size


  // ==========================================
  // Accuracy Change
  // ==========================================

  const accuracyChangeOverTime =
    sessions
      .slice(0, 8)
      .reverse()
      .map(
        (session, index, list) => {
          const accuracy =
            Number(
              session.accuracy || 0,
            )

          const previousAccuracy =
            index === 0
              ? null
              : Number(
                list[
                  index - 1
                ].accuracy || 0,
              )

          return {
            id: session.id,
            date:
              session.created_at ||
              session.date ||
              null,
            accuracy,
            change:
              previousAccuracy === null
                ? null
                : accuracy -
                  previousAccuracy,
          }
        },
      )


  // ==========================================
  // Game Analytics
  // ==========================================

  const gameWiseAnalytics =
    Object.values(
      sessions.reduce(
        (groups, session) => {
          const gameName =
            session.game ||
            'Unknown'

          if (
            !groups[gameName]
          ) {
            groups[gameName] = {
              game: gameName,
              sessions: 0,
              totalAccuracy: 0,
              totalMistakes: 0,
              totalTime: 0,
              difficulties: [],
            }
          }

          groups[gameName].sessions += 1

          groups[gameName]
            .totalAccuracy +=
            Number(
              session.accuracy || 0,
            )

          groups[gameName]
            .totalTime +=
            Number(
              session.time || 0,
            )

          groups[gameName]
            .totalMistakes +=
            Number(
              session.mistakes || 0,
            )

          if (
            session.difficulty &&
            !groups[
              gameName
            ].difficulties.includes(
              session.difficulty,
            )
          ) {
            groups[
              gameName
            ].difficulties.push(
              session.difficulty,
            )
          }

          return groups
        },
        {},
      ),
    ).map((game) => ({
      game: game.game,
      sessions: game.sessions,
      averageAccuracy:
        Math.round(
          game.totalAccuracy /
          game.sessions,
        ),
      averageMistakes:
        (
          game.totalMistakes /
          game.sessions
        ).toFixed(1),
      averageTime:
        Math.round(
          game.totalTime /
          game.sessions,
        ),
      difficulty:
        game.difficulties.join(
          ', ',
        ),
    }))


  const bestPerformanceByGame =
    gameWiseAnalytics.length === 0
      ? '—'
      : gameWiseAnalytics.reduce(
        (
          bestGame,
          currentGame,
        ) =>
          currentGame.averageAccuracy >
          bestGame.averageAccuracy
            ? currentGame
            : bestGame,
      ).game


  const gameCounts =
    sessions.reduce(
      (counts, session) => {
        const gameName =
          session.game ||
          'Unknown'

        counts[gameName] =
          (counts[gameName] || 0) +
          1

        return counts
      },
      {},
    )


  const mostPlayedGame =
    sessions.length === 0
      ? '—'
      : Object.entries(
        gameCounts,
      ).sort(
        (a, b) => b[1] - a[1],
      )[0][0]


  // ==========================================
  // Accuracy Distribution
  // ==========================================

  const accuracyDistribution = {
    excellent:
      sessions.filter(
        (session) =>
          Number(
            session.accuracy || 0,
          ) >= 90,
      ).length,

    good:
      sessions.filter(
        (session) => {
          const accuracy =
            Number(
              session.accuracy || 0,
            )

          return (
            accuracy >= 70 &&
            accuracy < 90
          )
        },
      ).length,

    average:
      sessions.filter(
        (session) => {
          const accuracy =
            Number(
              session.accuracy || 0,
            )

          return (
            accuracy >= 50 &&
            accuracy < 70
          )
        },
      ).length,

    needsPractice:
      sessions.filter(
        (session) =>
          Number(
            session.accuracy || 0,
          ) < 50,
      ).length,
  }


  // ==========================================
  // Difficulty Analytics
  // ==========================================

  const difficultyWiseAnalytics =
    Object.values(
      sessions.reduce(
        (groups, session) => {
          const difficulty =
            session.difficulty ||
            'Unknown'

          if (
            !groups[difficulty]
          ) {
            groups[difficulty] = {
              difficulty,
              sessions: 0,
              totalAccuracy: 0,
            }
          }

          groups[difficulty]
            .sessions += 1

          groups[difficulty]
            .totalAccuracy +=
            Number(
              session.accuracy || 0,
            )

          return groups
        },
        {},
      ),
    ).map((difficulty) => ({
      difficulty:
        difficulty.difficulty,
      sessions:
        difficulty.sessions,
      averageAccuracy:
        Math.round(
          difficulty.totalAccuracy /
          difficulty.sessions,
        ),
    }))


  // ==========================================
  // Time Analytics
  // ==========================================

  const timeWiseAnalytics =
    Object.values(
      sessions.reduce(
        (groups, session) => {
          const gameName =
            session.game ||
            'Unknown'

          if (
            !groups[gameName]
          ) {
            groups[gameName] = {
              game: gameName,
              sessions: 0,
              totalTime: 0,
            }
          }

          groups[gameName]
            .sessions += 1

          groups[gameName]
            .totalTime +=
            Number(
              session.time || 0,
            )

          return groups
        },
        {},
      ),
    ).map((game) => ({
      game: game.game,
      sessions: game.sessions,
      averageTime:
        Math.round(
          game.totalTime /
          game.sessions,
        ),
    }))


  // ==========================================
  // Weekly Activity
  // ==========================================

  const weeklyActivity =
    Array.from(
      { length: 7 },
      (_, index) => {
        const date =
          new Date()

        date.setHours(
          0,
          0,
          0,
          0,
        )

        date.setDate(
          date.getDate() -
          (6 - index),
        )

        const dateKey =
          `${date.getFullYear()}-` +
          `${String(
            date.getMonth() + 1,
          ).padStart(2, '0')}-` +
          `${String(
            date.getDate(),
          ).padStart(2, '0')}`

        const sessionCount =
          sessions.filter(
            (session) => {
              if (
                !session.created_at
              ) {
                return false
              }

              const sessionDate =
                new Date(
                  session.created_at,
                )

              const sessionKey =
                `${sessionDate.getFullYear()}-` +
                `${String(
                  sessionDate.getMonth() + 1,
                ).padStart(2, '0')}-` +
                `${String(
                  sessionDate.getDate(),
                ).padStart(2, '0')}`

              return (
                sessionKey ===
                dateKey
              )
            },
          ).length

        return {
          date: dateKey,
          label:
            date.toLocaleDateString(
              undefined,
              {
                weekday: 'short',
              },
            ),
          sessions:
            sessionCount,
        }
      },
    )


  // ==========================================
  // Summary Text
  // ==========================================

  const analyticsSummary =
    sessions.length === 0
      ? {
        sessions: 0,
        message:
          text.analyticsSummaryNoData,
      }
      : {
        sessions:
          sessions.length,
        message:
          text.analyticsSummaryMessage
            .replace(
              '{sessions}',
              sessions.length,
            )
            .replace(
              '{accuracy}',
              averageAccuracy,
            )
            .replace(
              '{trend}',
              recentAccuracyTrend,
            )
            .replace(
              '{game}',
              mostPlayedGame,
            ),
      }


  // ==========================================
  // Format Helpers
  // ==========================================

  const formatTime = (
    seconds,
  ) => {
    const totalSeconds =
      Number(seconds || 0)

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


  const formatDate = (
    dateValue,
  ) => {
    if (!dateValue) {
      return text.unknown
    }

    const date =
      new Date(dateValue)

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return text.unknown
    }

    return date.toLocaleString()
  }


  return (
    <div className="performance-page">

      {/* ======================================
          Header
          ====================================== */}

      <header className="performance-header">

        <button
          type="button"
          className="performance-back-button"
          onClick={onBack}
        >
          <span aria-hidden="true">
            ←
          </span>

          {text.backToDashboard}
        </button>


        <div className="performance-heading">

          <div
            className="performance-heading-icon"
            aria-hidden="true"
          >
            <PerformanceIcon
              type="accuracy"
            />
          </div>

          <div>
            <span className="performance-eyebrow">
              {text.performanceDashboard}
            </span>

            <h1>
              {text.performanceDashboard}
            </h1>

            <p>
              {text.performancePageDescription}
            </p>
          </div>

        </div>


        <VoiceReadAloud
          text={
            `${text.performanceDashboard}. ` +
            `${text.performancePageDescription}. ` +
            `${text.totalSessions}: ${sessions.length}. ` +
            `${text.averageAccuracy}: ${averageAccuracy}%. ` +
            `${text.averageMistakes}: ${averageMistakes}. ` +
            `${text.personalBestAccuracy}: ${personalBestAccuracy}%. ` +
            `${text.weeklyActivity}.`
          }
          language={language}
          label={readAloudLabel}
          stopLabel={stopReadingLabel}
        />

      </header>


      {/* ======================================
          Loading
          ====================================== */}

      {loading && (
        <div className="performance-message">
          {text.loadingPerformance}
        </div>
      )}


      {/* ======================================
          Error
          ====================================== */}

      {!loading && error && (
        <div className="performance-message performance-message--error">
          {error}
        </div>
      )}


      {!loading && !error && (
        <>

          {/* ==================================
              Overview
              ================================== */}

          <section className="performance-overview">

            <div className="performance-overview-heading">
              <span>
                {text.performanceDashboard}
              </span>

              <h2>
                {text.analyticsSummary}
              </h2>
            </div>


            <div className="performance-stats-grid">

              <PerformanceStatCard
                icon="sessions"
                value={sessions.length}
                label={text.totalSessions}
              />

              <PerformanceStatCard
                icon="games"
                value={gameTypes}
                label={text.gamesPlayed}
              />

              <PerformanceStatCard
                icon="accuracy"
                value={`${averageAccuracy}%`}
                label={text.averageAccuracy}
              />

              <PerformanceStatCard
                icon="mistakes"
                value={averageMistakes}
                label={text.averageMistakes}
              />

              <PerformanceStatCard
                icon="time"
                value={formatTime(averageTime)}
                label={text.averageTime}
              />

              <PerformanceStatCard
                icon="accuracy"
                value={`${personalBestAccuracy}%`}
                label={text.personalBestAccuracy}
              />

            </div>

          </section>


          {/* ==================================
              Progress Snapshot
              ================================== */}

          <section className="performance-highlight-grid">

            <article className="performance-highlight-card">

              <span>
                {text.performanceTrend}
              </span>

              <strong>
                {recentAccuracyTrend}
              </strong>

              <p>
                {text.trendImproving}
              </p>

            </article>


            <article className="performance-highlight-card">

              <span>
                {text.mostPlayedGame}
              </span>

              <strong>
                {mostPlayedGame}
              </strong>

              <p>
                {text.gamesPlayed}
              </p>

            </article>


            <article className="performance-highlight-card">

              <span>
                {text.bestPerformanceByGame}
              </span>

              <strong>
                {bestPerformanceByGame}
              </strong>

              <p>
                {text.averageAccuracy}
              </p>

            </article>

          </section>


          {/* ==================================
              Accuracy Change
              ================================== */}

          <section className="performance-panel">

            <div className="performance-panel-header">
              <div>
                <span>
                  {text.performanceTrend}
                </span>

                <h2>
                  {text.accuracyChangeOverTime}
                </h2>
              </div>
            </div>


            {accuracyChangeOverTime.length === 0 ? (
              <p className="performance-empty-message">
                {text.noAccuracyHistory}
              </p>
            ) : (
              <div className="accuracy-change-list">

                {accuracyChangeOverTime.map(
                  (item) => (
                    <div
                      className="accuracy-change-item"
                      key={item.id}
                    >

                      <strong>
                        {item.accuracy}%
                      </strong>

                      <span>
                        {item.change === null
                          ? text.startingSession
                          : item.change > 0
                            ? `+${item.change}%`
                            : `${item.change}%`}
                      </span>

                    </div>
                  ),
                )}

              </div>
            )}

          </section>


          {/* ==================================
              Game-wise Performance
              ================================== */}

          <section className="performance-panel">

            <div className="performance-panel-header">
              <div>
                <span>
                  {text.gamesPlayed}
                </span>

                <h2>
                  {text.gameWisePerformance}
                </h2>
              </div>
            </div>


            {gameWiseAnalytics.length === 0 ? (
              <p className="performance-empty-message">
                {text.noSessions}
              </p>
            ) : (
              <div className="performance-game-grid">

                {gameWiseAnalytics.map(
                  (game) => (
                    <article
                      className="performance-game-card"
                      key={game.game}
                    >

                      <div className="performance-card-topline">
                        <span>
                          {game.sessions}{' '}
                          {game.sessions === 1
                            ? 'session'
                            : 'sessions'}
                        </span>
                      </div>

                      <h3>
                        {game.game}
                      </h3>

                      <div className="performance-mini-stats">

                        <div>
                          <span>
                            {text.averageAccuracy}
                          </span>

                          <strong>
                            {game.averageAccuracy}%
                          </strong>
                        </div>

                        <div>
                          <span>
                            {text.averageMistakes}
                          </span>

                          <strong>
                            {game.averageMistakes}
                          </strong>
                        </div>

                        <div>
                          <span>
                            {text.averageTime}
                          </span>

                          <strong>
                            {formatTime(
                              game.averageTime,
                            )}
                          </strong>
                        </div>

                      </div>

                      <p className="performance-card-detail">
                        {text.difficulty}:{' '}
                        <strong>
                          {game.difficulty || '—'}
                        </strong>
                      </p>

                    </article>
                  ),
                )}

              </div>
            )}

          </section>


          {/* ==================================
              Accuracy Distribution
              ================================== */}

          <section className="performance-panel">

            <div className="performance-panel-header">
              <div>
                <span>
                  {text.averageAccuracy}
                </span>

                <h2>
                  {text.accuracyDistribution}
                </h2>
              </div>
            </div>


            <div className="performance-distribution-grid">

              <div className="performance-distribution-item">
                <strong>
                  {accuracyDistribution.excellent}
                </strong>

                <span>
                  {text.excellentAccuracy}
                </span>
              </div>

              <div className="performance-distribution-item">
                <strong>
                  {accuracyDistribution.good}
                </strong>

                <span>
                  {text.goodAccuracy}
                </span>
              </div>

              <div className="performance-distribution-item">
                <strong>
                  {accuracyDistribution.average}
                </strong>

                <span>
                  {text.averageAccuracyRange}
                </span>
              </div>

              <div className="performance-distribution-item">
                <strong>
                  {accuracyDistribution.needsPractice}
                </strong>

                <span>
                  {text.below50Accuracy}
                </span>
              </div>

            </div>

          </section>


          {/* ==================================
              Difficulty-wise Performance
              ================================== */}

          <section className="performance-panel">

            <div className="performance-panel-header">
              <div>
                <span>
                  {text.difficultyWisePerformance}
                </span>

                <h2>
                  {text.difficultyWisePerformance}
                </h2>
              </div>
            </div>


            {difficultyWiseAnalytics.length === 0 ? (
              <p className="performance-empty-message">
                {text.noSessions}
              </p>
            ) : (
              <div className="performance-difficulty-grid">

                {difficultyWiseAnalytics.map(
                  (item) => (
                    <article
                      className="performance-difficulty-card"
                      key={item.difficulty}
                    >

                      <h3>
                        {item.difficulty}
                      </h3>

                      <p>
                        {text.totalSessions}:{' '}
                        <strong>
                          {item.sessions}
                        </strong>
                      </p>

                      <p>
                        {text.averageAccuracy}:{' '}
                        <strong>
                          {item.averageAccuracy}%
                        </strong>
                      </p>

                    </article>
                  ),
                )}

              </div>
            )}

          </section>


          {/* ==================================
              Time-wise Performance
              ================================== */}

          <section className="performance-panel">

            <div className="performance-panel-header">
              <div>
                <span>
                  {text.averageTime}
                </span>

                <h2>
                  {text.timeWisePerformance}
                </h2>
              </div>
            </div>


            {timeWiseAnalytics.length === 0 ? (
              <p className="performance-empty-message">
                {text.noSessions}
              </p>
            ) : (
              <div className="performance-time-grid">

                {timeWiseAnalytics.map(
                  (item) => (
                    <article
                      className="performance-time-card"
                      key={item.game}
                    >

                      <h3>
                        {item.game}
                      </h3>

                      <p>
                        {text.totalSessions}:{' '}
                        <strong>
                          {item.sessions}
                        </strong>
                      </p>

                      <p>
                        {text.averageTime}:{' '}
                        <strong>
                          {formatTime(
                            item.averageTime,
                          )}
                        </strong>
                      </p>

                    </article>
                  ),
                )}

              </div>
            )}

          </section>


          {/* ==================================
              Weekly Activity
              ================================== */}

          <section className="performance-panel">

            <div className="performance-panel-header">
              <div>
                <span>
                  {text.weeklyActivity}
                </span>

                <h2>
                  {text.weeklyActivity}
                </h2>
              </div>
            </div>


            <div className="performance-weekly-grid">

              {weeklyActivity.map(
                (day) => (
                  <article
                    className="performance-weekly-card"
                    key={day.date}
                  >

                    <span>
                      {day.label}
                    </span>

                    <strong>
                      {day.sessions}
                    </strong>

                    <small>
                      {day.sessions === 1
                        ? 'session'
                        : 'sessions'}
                    </small>

                  </article>
                ),
              )}

            </div>

          </section>


          {/* ==================================
              Analytics Summary
              ================================== */}

          <section className="performance-summary-panel">

            <div className="performance-summary-icon">
              <PerformanceIcon type="accuracy" />
            </div>

            <div>
              <span>
                {text.analyticsSummary}
              </span>

              <h2>
                {analyticsSummary.sessions}
              </h2>

              <p>
                {analyticsSummary.message}
              </p>
            </div>

          </section>


          {/* ==================================
              Recent Sessions
              ================================== */}

          <section className="performance-panel">

            <div className="performance-panel-header">

              <div>
                <span>
                  {text.performanceHistory}
                </span>

                <h2>
                  {text.recentSessions}
                </h2>

                <p>
                  {text.performanceDataSource}
                </p>
              </div>

            </div>


            {sessions.length === 0 ? (

              <div className="performance-empty">
                {text.noSessions}
              </div>

            ) : (

              <div className="performance-list">

                {sessions.map(
                  (session) => (
                    <article
                      className="performance-item"
                      key={session.id}
                    >

                      <div className="performance-item-main">

                        <span className="performance-item-game">
                          {session.game}
                        </span>

                        <h3>
                          {formatDate(
                            session.created_at,
                          )}
                        </h3>

                      </div>


                      <div className="performance-item-data">

                        <span>
                          {text.difficulty}:{' '}
                          <strong>
                            {session.difficulty}
                          </strong>
                        </span>

                        <span>
                          {text.accuracy}:{' '}
                          <strong>
                            {session.accuracy}%
                          </strong>
                        </span>

                        <span>
                          {text.mistakes}:{' '}
                          <strong>
                            {session.mistakes}
                          </strong>
                        </span>

                        <span>
                          {text.time}:{' '}
                          <strong>
                            {formatTime(
                              session.time,
                            )}
                          </strong>
                        </span>

                      </div>

                    </article>
                  ),
                )}

              </div>
            )}

          </section>

        </>
      )}

    </div>
  )
}


export default PerformanceDashboard