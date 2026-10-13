import { useCallback, useEffect, useState } from 'react'
import './DailyBrainActivities.css'
import VoiceReadAloud from './VoiceReadAloud'
import { apiGet, apiPost } from '../utils/api'

// ============================================
// SVG Game Illustration Helper
// ============================================

function ActivityIllustration({ gameId }) {
  if (gameId === 'sequence-memory') {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ width: 28, height: 28, color: '#7357c7' }}
      >
        <circle cx="10" cy="12" r="5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="20" cy="12" r="5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="30" cy="12" r="5" stroke="currentColor" strokeWidth="2.5" />
        <path d="M12 28L18 34L30 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (gameId === 'memory-match') {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ width: 28, height: 28, color: '#4c7fb8' }}
      >
        <rect x="6" y="8" width="12" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <rect x="22" y="8" width="12" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <path d="M10 16L13 19L16 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26 16L29 19L32 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (gameId === 'object-recall') {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ width: 28, height: 28, color: '#c18a32' }}
      >
        <rect x="7" y="10" width="26" height="20" rx="4" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="16" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M11 26C12.5 23 15 22 17 22C19 22 21.5 23 23 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M25 16H29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  if (gameId === 'ner-cultural-recall') {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ width: 28, height: 28, color: '#438f7b' }}
      >
        <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2.5" />
        <path d="M10 20H30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 6C16 11 14 15 14 20C14 25 16 29 20 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 6C24 11 26 15 26 20C26 25 24 29 20 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  // Personal Memory Recall
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: 28, height: 28, color: '#d77a62' }}
    >
      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2.5" />
      <path d="M14 18C14 15 16.5 13 20 13C23.5 13 26 15 26 18C26 23 20 27 20 27C20 27 14 23 14 18Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ============================================
// Main Component
// ============================================

export default function DailyBrainActivities({
  onStartActivity,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
}) {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [lastRefreshTime, setLastRefreshTime] = useState(0)

  // ----------------------------------------------------------
  // Fetch Plan from Backend
  // ----------------------------------------------------------
  const loadPlan = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true)
      setError('')
      const data = await apiGet('/companion/daily-plan')
      if (data && Array.isArray(data.activities)) {
        setPlan(data)
      } else {
        setError('No daily activities were received.')
      }
    } catch (err) {
      console.warn('[DailyBrainActivities] Load failed:', err)
      setError('Unable to load your daily plan right now. You can still play all games below.')
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlan()
    }, 0)
    return () => {
      window.clearTimeout(timer)
    }
  }, [loadPlan])

  // Listen for game session completion events to update plan status in real time
  useEffect(() => {
    const handlePerformanceUpdated = () => {
      loadPlan(true)
    }

    window.addEventListener('cognicare:performance-updated', handlePerformanceUpdated)
    return () => {
      window.removeEventListener('cognicare:performance-updated', handlePerformanceUpdated)
    }
  }, [loadPlan])

  // ----------------------------------------------------------
  // Refresh Plan Handler (with friendly rate limiting)
  // ----------------------------------------------------------
  const handleRefresh = async () => {
    const now = Date.now()
    if (now - lastRefreshTime < 4000) {
      return // Avoid rapid spamming
    }
    setLastRefreshTime(now)

    try {
      setRefreshing(true)
      const data = await apiPost('/companion/daily-plan/refresh', {})
      if (data && Array.isArray(data.activities)) {
        setPlan(data)
      }
    } catch (err) {
      console.warn('[DailyBrainActivities] Refresh failed:', err)
    } finally {
      setRefreshing(false)
    }
  }

  // ----------------------------------------------------------
  // Loading State
  // ----------------------------------------------------------
  if (loading) {
    return (
      <section className="daily-brain-section" aria-busy="true" aria-label="Your Daily Brain Activities Loading">
        <div className="companion-loading-box">
          <div className="refresh-icon spinning" style={{ fontSize: 24, marginBottom: 8 }} aria-hidden="true">
            ⚙️
          </div>
          <p>Preparing your personalized daily brain activities...</p>
        </div>
      </section>
    )
  }

  // ----------------------------------------------------------
  // Error State with fallback
  // ----------------------------------------------------------
  if (error && !plan) {
    return (
      <section className="daily-brain-section" aria-label="Your Daily Brain Activities">
        <div className="companion-error-box">
          <p>{error}</p>
          <button type="button" className="companion-retry-btn" onClick={() => loadPlan()}>
            Try Again
          </button>
        </div>
      </section>
    )
  }

  if (!plan) return null

  const completedCount = plan.completedCount || plan.activities.filter((a) => a.completed).length
  const totalCount = plan.totalCount || plan.activities.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Voice read aloud speech content
  const speechText = `${plan.companionGreeting || 'Welcome to your daily brain activities.'} ${
    plan.focusTitle || ''
  }. Today's plan has ${totalCount} activities: ${plan.activities
    .map((a, i) => `Activity ${i + 1}: ${a.gameName}, ${a.recommendedDifficulty} level, for ${a.estimatedDuration}. ${a.reason}`)
    .join('. ')}`

  return (
    <section className="daily-brain-section" aria-labelledby="daily-brain-title">
      {/* Header Area */}
      <div className="daily-brain-header">
        <div className="daily-brain-title-area">
          <div className="companion-badge-row">
            <span className="companion-badge">
              <span className="companion-badge-icon" aria-hidden="true">✨</span>
              AI Cognitive Companion
            </span>
            <span
              className={`companion-ai-source-badge ${
                plan.aiPowered ? 'companion-ai-source-badge--ai' : 'companion-ai-source-badge--rule'
              }`}
              title={
                plan.aiPowered
                  ? 'Explanations personalized using Google Gemini API'
                  : 'Explanations generated using clinical adaptive rules'
              }
            >
              {plan.aiPowered ? '🤖 Gemini AI Powered' : '📐 Clinical Rule Engine'}
            </span>
          </div>

          <h2 id="daily-brain-title" className="daily-brain-heading">
            Your Daily Brain Activities
          </h2>

          <p className="daily-brain-greeting">
            {plan.companionGreeting}
          </p>

          {plan.focusTitle && (
            <div className="daily-brain-focus-pill" aria-label={`Focus: ${plan.focusTitle}`}>
              🎯 Focus: {plan.focusTitle}
            </div>
          )}

          {plan.encouragementNote && (
            <p className="daily-brain-encouragement">
              {plan.encouragementNote}
            </p>
          )}
        </div>

        {/* Actions (Voice Read & Refresh) */}
        <div className="daily-brain-actions">
          <VoiceReadAloud
            text={speechText}
            language={language}
            label={readAloudLabel}
            stopLabel={stopReadingLabel}
          />

          <button
            type="button"
            className="refresh-plan-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh daily activity plan"
          >
            <span className={`refresh-icon ${refreshing ? 'spinning' : ''}`} aria-hidden="true">
              🔄
            </span>
            <span>{refreshing ? 'Refreshing...' : 'Refresh Plan'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="daily-progress-container">
        <div className="daily-progress-header">
          <span className="daily-progress-label">Today's Progress</span>
          <span className="daily-progress-stats">
            {completedCount} of {totalCount} Completed ({progressPercent}%)
          </span>
        </div>
        <div
          className="daily-progress-bar-bg"
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-label={`${completedCount} of ${totalCount} activities completed`}
        >
          <div className="daily-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Activities Grid */}
      <div className="daily-activities-grid" role="list">
        {plan.activities.map((activity, index) => {
          const diffClass = activity.recommendedDifficulty
            ? `activity-difficulty-badge--${activity.recommendedDifficulty.toLowerCase()}`
            : ''

          return (
            <article
              key={activity.id || activity.gameId || index}
              className={`activity-card ${activity.completed ? 'activity-card--completed' : ''}`}
              role="listitem"
            >
              <div className="activity-card-top">
                <span className="activity-number-pill">
                  Activity {index + 1}
                </span>

                <div className="activity-meta-badges">
                  <span className={`activity-difficulty-badge ${diffClass}`}>
                    {activity.recommendedDifficulty}
                  </span>
                  <span className="activity-duration-badge" title="Estimated duration">
                    ⏱️ {activity.estimatedDuration}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <ActivityIllustration gameId={activity.gameId} />
                <h3 className="activity-title">{activity.gameName}</h3>
              </div>

              <span className="activity-category">{activity.category}</span>

              <p className="activity-description">{activity.description}</p>

              {/* Why This Was Selected Box */}
              <div className="activity-reason-box">
                <span className="activity-reason-label">
                  <span aria-hidden="true">💡</span> Why this was chosen
                </span>
                <p className="activity-reason-text">{activity.reason}</p>
              </div>

              {/* Action Button */}
              <div className="activity-card-action">
                {activity.completed ? (
                  <>
                    <div className="activity-completed-badge">
                      <span>
                        <span className="activity-completed-icon" aria-hidden="true">✅</span>
                        Completed Today
                      </span>
                      {activity.accuracy !== null && activity.accuracy !== undefined && (
                        <span>{activity.accuracy}% accuracy</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="play-again-btn"
                      onClick={() =>
                        onStartActivity(activity.gameId, activity.recommendedDifficulty)
                      }
                      aria-label={`Play ${activity.gameName} again`}
                    >
                      Play Again
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="start-activity-btn"
                    onClick={() =>
                      onStartActivity(activity.gameId, activity.recommendedDifficulty)
                    }
                    aria-label={`Start ${activity.gameName} at ${activity.recommendedDifficulty} difficulty`}
                  >
                    <span>Start Activity</span>
                    <span className="start-activity-btn-arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {/* Safety & Medical Disclaimer */}
      <p className="daily-brain-disclaimer">
        {plan.disclaimer ||
          'Cognicare NER provides wellness-focused cognitive exercises. Recommendations are not medical diagnoses.'}
      </p>
    </section>
  )
}
