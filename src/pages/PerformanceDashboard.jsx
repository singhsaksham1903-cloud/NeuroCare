import { useEffect, useState, useId } from 'react'
import VoiceReadAloud from '../Components/VoiceReadAloud'
import { apiGet, apiPost } from '../utils/api'
import './PerformanceDashboard.css'

// ============================================
// SVG Trend Chart Component
// ============================================

export function PerformanceTrendChart({
  points,
  metric,
  baselineValue,
  weeklyData,
  onSelectPoint,
  selectedPoint,
}) {
  const chartId = useId()

  if (metric === 'participation') {
    if (!weeklyData || weeklyData.length === 0) {
      return (
        <div className="perf-empty-chart">
          <p>No weekly activity rhythm recorded in this period.</p>
        </div>
      )
    }

    const maxCount = Math.max(...weeklyData.map((d) => d.sessionCount), 4)
    const chartHeight = 180
    const chartWidth = 560
    const barWidth = Math.min(48, Math.max(26, Math.floor((chartWidth - 70) / weeklyData.length) - 14))

    return (
      <div className="perf-chart-wrapper">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`}
          className="perf-svg-chart"
          role="img"
          aria-label="Weekly participation rhythm chart"
        >
          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio) => {
            const y = chartHeight - ratio * (chartHeight - 30)
            return (
              <g key={ratio}>
                <line
                  x1="40"
                  y1={y}
                  x2={chartWidth - 20}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text x="32" y={y + 4} textAnchor="end" className="perf-axis-text">
                  {Math.round(ratio * maxCount)}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {weeklyData.map((w, idx) => {
            const availableWidth = chartWidth - 70
            const step = availableWidth / weeklyData.length
            const x = 50 + idx * step + (step - barWidth) / 2
            const barH = (w.sessionCount / maxCount) * (chartHeight - 30)
            const y = chartHeight - barH

            return (
              <g key={idx} className="perf-bar-group">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, 4)}
                  rx="6"
                  className="perf-bar-rect"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="perf-bar-val"
                >
                  {w.sessionCount}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 22}
                  textAnchor="middle"
                  className="perf-axis-text"
                >
                  {w.weekLabel}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  // Time-series Chart (Accuracy, Mistakes, Time)
  if (!points || points.length === 0) {
    return (
      <div className="perf-empty-chart">
        <p>No completed sessions recorded in this period for the selected filters.</p>
      </div>
    )
  }

  const chartHeight = 210
  const chartWidth = 580
  const padLeft = 45
  const padRight = 20
  const padTop = 20
  const padBottom = 35

  const usableWidth = chartWidth - padLeft - padRight
  const usableHeight = chartHeight - padTop - padBottom

  let minY = 0
  let maxY = 100
  let unit = '%'

  if (metric === 'mistakes') {
    const vals = points.map((p) => p.mistakes)
    maxY = Math.max(...vals, 4)
    minY = 0
    unit = ''
  } else if (metric === 'time') {
    const vals = points.map((p) => p.time)
    maxY = Math.max(...vals, 60)
    minY = 0
    unit = 's'
  }

  const getY = (val) => {
    const range = maxY - minY || 1
    const normalized = (val - minY) / range
    return padTop + usableHeight - normalized * usableHeight
  }

  const getX = (idx) => {
    if (points.length === 1) return padLeft + usableWidth / 2
    return padLeft + (idx / (points.length - 1)) * usableWidth
  }

  const metricKey =
    metric === 'accuracy' ? 'accuracy' : metric === 'mistakes' ? 'mistakes' : 'time'

  // Points coordinates
  const pointsCoords = points.map((p, idx) => ({
    x: getX(idx),
    y: getY(p[metricKey]),
    p,
  }))

  const polylineStr = pointsCoords.map((pt) => `${pt.x},${pt.y}`).join(' ')

  // Rolling Average line
  let rollingPolyline = ''
  if (metric === 'accuracy' && points.length > 2) {
    rollingPolyline = points
      .map((p, idx) => `${getX(idx)},${getY(p.rollingAccuracy)}`)
      .join(' ')
  }

  const baselineY = baselineValue != null ? getY(baselineValue) : null

  return (
    <div className="perf-chart-wrapper">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="perf-svg-chart"
        role="img"
        aria-label={`${metric} trend chart`}
      >
        <defs>
          <linearGradient id={`${chartId}-areaGrad`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7357c7" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7357c7" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const val = minY + ratio * (maxY - minY)
          const y = getY(val)
          return (
            <g key={ratio}>
              <line
                x1={padLeft}
                y1={y}
                x2={chartWidth - padRight}
                y2={y}
                stroke="#edf2f7"
                strokeWidth="1"
              />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" className="perf-axis-text">
                {Math.round(val)}
                {unit}
              </text>
            </g>
          )
        })}

        {/* Baseline Line */}
        {baselineY != null && baselineY >= padTop && baselineY <= chartHeight - padBottom && (
          <g className="perf-baseline-guide">
            <line
              x1={padLeft}
              y1={baselineY}
              x2={chartWidth - padRight}
              y2={baselineY}
              stroke="#d97706"
              strokeDasharray="5 4"
              strokeWidth="2"
            />
            <text
              x={chartWidth - padRight}
              y={baselineY - 5}
              textAnchor="end"
              className="perf-baseline-text"
            >
              Baseline ({Math.round(baselineValue)}
              {unit})
            </text>
          </g>
        )}

        {/* Shaded Area for accuracy */}
        {metric === 'accuracy' && pointsCoords.length > 1 && (
          <polygon
            points={`${pointsCoords[0].x},${chartHeight - padBottom} ${polylineStr} ${pointsCoords[pointsCoords.length - 1].x},${chartHeight - padBottom}`}
            fill={`url(#${chartId}-areaGrad)`}
          />
        )}

        {/* Rolling Average smooth line (purple dashed) */}
        {rollingPolyline && (
          <polyline
            points={rollingPolyline}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        )}

        {/* Main Data Line */}
        <polyline
          points={polylineStr}
          fill="none"
          stroke="#7357c7"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive Data Points */}
        {pointsCoords.map((pt, idx) => {
          const isSelected = selectedPoint?.id === pt.p.id
          return (
            <g
              key={idx}
              className="perf-point-group"
              onClick={() => onSelectPoint(pt.p)}
              tabIndex={0}
              role="button"
              aria-label={`${pt.p.game} on ${pt.p.dateFormatted}: ${pt.p[metricKey]}${unit}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectPoint(pt.p)
              }}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isSelected ? 7 : 5}
                className={`perf-data-dot ${isSelected ? 'perf-data-dot--selected' : ''}`}
              />
              {/* X Axis Date labels */}
              {(points.length <= 8 || idx % Math.ceil(points.length / 6) === 0 || idx === points.length - 1) && (
                <text
                  x={pt.x}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  className="perf-axis-text"
                >
                  {pt.p.dateFormatted}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ============================================
// Caregiver Report Modal Component
// ============================================

function CaregiverReportModal({
  isOpen,
  onClose,
  reportData,
  aiAnalysis,
  user,
  period,
}) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !reportData) return null

  const handleCopy = () => {
    const textToCopy = `NeuroCare Cognitive Progress Report
User: ${user?.full_name || 'Elderly User'}
Period: ${period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : period === '90d' ? 'Last 90 Days' : 'All Time'}
Generated: ${new Date().toLocaleDateString()}

Key Metrics:
- Completed Sessions: ${reportData.overview.totalCompleted}
- Average Accuracy: ${reportData.overview.avgAccuracy}%
- Average Mistakes: ${reportData.overview.avgMistakes} / session
- Completion Duration: ${reportData.overview.avgTime > 0 ? `${reportData.overview.avgTime}s` : 'N/A'}
- Baseline Comparison: ${reportData.baselineComparison.isReliable ? `${reportData.baselineComparison.overallStatus} (${reportData.baselineComparison.baselineAccuracy}% baseline vs ${reportData.baselineComparison.recentAccuracy}% recent)` : 'Baseline establishing'}

AI Analysis & Strengths:
${aiAnalysis?.summary || 'Consistent participation recorded.'}
Strengths:
${(aiAnalysis?.strengths || []).map((s) => `• ${s}`).join('\n')}

Recommended Next Activity:
${reportData.recommendation?.game} (${reportData.recommendation?.difficulty} level) - ${reportData.recommendation?.reason}

Disclaimer: ${reportData.disclaimer}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
    }
  }

  return (
    <div className="perf-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="perf-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="perf-modal-header">
          <div>
            <span className="perf-modal-tag">Caregiver Progress Summary</span>
            <h2 className="perf-modal-title">Cognitive Activity Report</h2>
            <p className="perf-modal-subtitle">
              Prepared for {user?.full_name || 'User'} · {period === '7d' ? '7-Day View' : period === '30d' ? '30-Day View' : period === '90d' ? '90-Day View' : 'All Time'}
            </p>
          </div>
          <button type="button" className="perf-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="perf-modal-body">
          {/* Quick Metrics Bar */}
          <div className="perf-modal-metrics">
            <div className="perf-m-box">
              <span>Sessions</span>
              <strong>{reportData.overview.totalCompleted}</strong>
            </div>
            <div className="perf-m-box">
              <span>Avg Accuracy</span>
              <strong>{reportData.overview.avgAccuracy}%</strong>
            </div>
            <div className="perf-m-box">
              <span>Mistakes/Game</span>
              <strong>{reportData.overview.avgMistakes}</strong>
            </div>
            <div className="perf-m-box">
              <span>Baseline Trend</span>
              <strong className={`perf-status-txt--${reportData.baselineComparison.overallStatus}`}>
                {reportData.baselineComparison.isReliable
                  ? reportData.baselineComparison.overallStatus === 'improving'
                    ? '+ Improving'
                    : reportData.baselineComparison.overallStatus === 'declining'
                    ? 'Variation Noted'
                    : 'Steady'
                  : 'Establishing'}
              </strong>
            </div>
          </div>

          {/* AI Analysis Section in Report */}
          <div className="perf-modal-section">
            <h3 className="perf-modal-sect-title">✨ Clinical Assistive Summary</h3>
            <p className="perf-modal-summary-text">
              {aiAnalysis?.summary || 'Player demonstrates regular cognitive engagement across recorded sessions.'}
            </p>

            {aiAnalysis?.strengths && aiAnalysis.strengths.length > 0 && (
              <div className="perf-modal-subbox">
                <strong>Observed Strengths:</strong>
                <ul>
                  {aiAnalysis.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiAnalysis?.areas_to_practice && aiAnalysis.areas_to_practice.length > 0 && (
              <div className="perf-modal-subbox">
                <strong>Suggested Practice Focus:</strong>
                <ul>
                  {aiAnalysis.areas_to_practice.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Next Recommended Activity */}
          <div className="perf-modal-section">
            <h3 className="perf-modal-sect-title">🎯 Recommended Practice Activity</h3>
            <div className="perf-modal-rec-box">
              <div>
                <strong>{reportData.recommendation?.game}</strong> ({reportData.recommendation?.difficulty} Level)
                <p>{reportData.recommendation?.reason}</p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="perf-modal-disclaimer">
            <small>🛡️ {reportData.disclaimer}</small>
          </div>
        </div>

        <div className="perf-modal-footer">
          <button type="button" className="perf-btn perf-btn--outline" onClick={handleCopy}>
            {copied ? '✓ Copied to Clipboard' : '📋 Copy Report Text'}
          </button>
          <button type="button" className="perf-btn perf-btn--primary" onClick={() => window.print()}>
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Main Performance Dashboard Component
// ============================================

export default function PerformanceDashboard({
  user,
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
  onBack,
  onPlayGame,
}) {
  const [period, setPeriod] = useState('30d')
  const [gameFilter, setGameFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [chartMetric, setChartMetric] = useState('accuracy')
  const [selectedPoint, setSelectedPoint] = useState(null)

  // Insights & metrics
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Gemini AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // Selected difficulty for recommendation Play Now button
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)

  // Caregiver sharing controls
  const [caregiverPermissions, setCaregiverPermissions] = useState([])
  const [permLoading, setPermLoading] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // ==========================================
  // Fetch Cognitive Progress Insights
  // ==========================================
  useEffect(() => {
    let active = true

    const fetchInsights = async () => {
      try {
        setLoading(true)
        setError('')
        setSelectedPoint(null)

        const queryParams = new URLSearchParams({ period })
        if (gameFilter !== 'all') {
          queryParams.set('game', gameFilter)
        }
        if (difficultyFilter !== 'all') {
          queryParams.set('difficulty', difficultyFilter)
        }

        const res = await apiGet(`/cognitive-insights?${queryParams.toString()}`)
        if (active) {
          setData(res)
          if (res.trendPoints && res.trendPoints.length > 0) {
            setSelectedPoint(res.trendPoints[res.trendPoints.length - 1])
          }
          if (res.recommendation) {
            setSelectedDifficulty(res.recommendation.difficulty)
          }

          // Fetch Gemini AI analysis seamlessly
          setAiLoading(true)
          setAiError('')
          apiPost('/cognitive-insights/ai-analysis', {
            period,
            game: gameFilter !== 'all' ? gameFilter : undefined,
            difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
            forceRefresh: false,
          })
            .then((aiRes) => {
              if (active) setAiAnalysis(aiRes)
            })
            .catch((aiErr) => {
              if (active) setAiError(aiErr.message || 'Could not generate AI analysis at this time.')
            })
            .finally(() => {
              if (active) setAiLoading(false)
            })
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not load cognitive progress insights from backend.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void fetchInsights()

    return () => {
      active = false
    }
  }, [period, gameFilter, difficultyFilter])

  // ==========================================
  // Fetch Caregiver Permissions for Elderly User
  // ==========================================
  useEffect(() => {
    let active = true

    const fetchCaregivers = async () => {
      if (user?.role !== 'elderly') return
      try {
        setPermLoading(true)
        const res = await apiGet('/caregiver-report-permissions')
        if (active && res.permissions) {
          setCaregiverPermissions(res.permissions)
        }
      } catch {
        // Silently handle if not linking caregiver
      } finally {
        if (active) setPermLoading(false)
      }
    }

    void fetchCaregivers()

    return () => {
      active = false
    }
  }, [user])

  // ==========================================
  // Fetch Gemini AI Analysis Manual Refresh
  // ==========================================
  const fetchGeminiAnalysis = async (forceRefresh = false) => {
    if (aiLoading) return
    try {
      setAiLoading(true)
      setAiError('')
      const res = await apiPost('/cognitive-insights/ai-analysis', {
        period,
        game: gameFilter !== 'all' ? gameFilter : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        forceRefresh,
      })
      setAiAnalysis(res)
    } catch (err) {
      setAiError(err.message || 'Could not generate AI analysis at this time.')
    } finally {
      setAiLoading(false)
    }
  }

  // Toggle caregiver permission
  const handleToggleCaregiverShare = async (caregiverId, currentStatus) => {
    try {
      const res = await apiPost('/caregiver-report-permissions', {
        caregiverId,
        accessGranted: !currentStatus,
      })
      setCaregiverPermissions((prev) =>
        prev.map((p) =>
          p.caregiverId === caregiverId
            ? { ...p, reportAccessGranted: res.permission.report_access_granted }
            : p
        )
      )
    } catch (err) {
      alert(err.message || 'Could not update caregiver sharing permission.')
    }
  }

  // Voice Read Aloud Content
  const readAloudContent = data?.baselineComparison?.isReliable
    ? `Cognitive Progress Insights for ${period === '7d' ? 'last 7 days' : period === '30d' ? 'last 30 days' : period === '90d' ? 'last 90 days' : 'all recorded history'}. You completed ${data.overview.totalCompleted} sessions with an average accuracy of ${data.overview.avgAccuracy} percent. Your performance status is ${data.baselineComparison.overallStatus === 'improving' ? 'improving' : data.baselineComparison.overallStatus === 'declining' ? 'varying from baseline' : 'broadly stable'}. Personal baseline accuracy is ${data.baselineComparison.baselineAccuracy} percent compared with ${data.baselineComparison.recentAccuracy} percent recently. Recommended activity is ${data.recommendation?.game} at ${selectedDifficulty || data.recommendation?.difficulty} level.`
    : `Cognitive Progress Insights. You have completed ${data?.overview?.totalCompleted || 0} sessions in this period. As you play more activities, Cognicare establishes your personal baseline.`

  // Handle Play Now
  const handlePlayNow = () => {
    if (!data?.recommendation || !onPlayGame) return
    const gameId = data.recommendation.gameId
    const diff = selectedDifficulty || data.recommendation.difficulty
    onPlayGame(gameId, diff)
  }

  return (
    <div className="perf-page">
      {/* ----------------------------------------
          Header & Navigation
          ---------------------------------------- */}
      <header className="perf-header">
        <div className="perf-header-nav">
          <button
            type="button"
            className="perf-back-button"
            onClick={onBack}
            aria-label={text?.backToDashboard || 'Back to Dashboard'}
          >
            <span aria-hidden="true">←</span>
            <span>{text?.backToDashboard || 'Back to Dashboard'}</span>
          </button>

          <div className="perf-header-actions">
            <button
              type="button"
              className="perf-action-btn"
              onClick={() => setIsReportModalOpen(true)}
              title="Preview & Print Caregiver Report"
            >
              📄 <span>Caregiver Report</span>
            </button>
            <VoiceReadAloud
              text={readAloudContent}
              language={language}
              label={readAloudLabel}
              stopLabel={stopReadingLabel}
            />
          </div>
        </div>

        <div className="perf-heading">
          <div className="perf-heading-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 33L20 24L27 29L38 16" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M31 16H38V23" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 39H40" strokeLinecap="round" />
            </svg>
          </div>

          <div>
            <span className="perf-eyebrow">Cognitive Progress Insights</span>
            <h1>{text?.performanceDashboard || 'My Performance Insights'}</h1>
            <p>
              {user?.full_name ? `${user.full_name} · ` : ''}
              Track real performance across 7, 30, and 90 days with AI baseline comparisons and practice recommendations.
            </p>
          </div>
        </div>

        {/* ----------------------------------------
            Period & Filter Controls
            ---------------------------------------- */}
        <div className="perf-controls-bar">
          <div className="perf-period-tabs" role="tablist" aria-label="Reporting Period">
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
                aria-selected={period === tab.id}
                className={`perf-period-tab ${period === tab.id ? 'perf-period-tab--active' : ''}`}
                onClick={() => setPeriod(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="perf-filter-group">
            <div className="perf-select-wrap">
              <label htmlFor="perf-game-select">Activity:</label>
              <select
                id="perf-game-select"
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="perf-select"
              >
                <option value="all">All Activities</option>
                <option value="Memory Match">Memory Match</option>
                <option value="Sequence Memory">Sequence Memory</option>
                <option value="Object Recall">Object Recall</option>
                <option value="NER Cultural Recall">NER Cultural Recall</option>
                <option value="Personal Memory Recall">Personal Memory Recall</option>
              </select>
            </div>

            <div className="perf-select-wrap">
              <label htmlFor="perf-diff-select">Difficulty:</label>
              <select
                id="perf-diff-select"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="perf-select"
              >
                <option value="all">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Standard">Standard</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* ----------------------------------------
          Loading & Error States
          ---------------------------------------- */}
      {loading && (
        <div className="perf-message" aria-live="polite">
          <div className="perf-spinner" />
          <p>Analyzing recorded cognitive sessions and calculating personal baselines...</p>
        </div>
      )}

      {!loading && error && (
        <div className="perf-message perf-message--error" role="alert">
          <p>{error}</p>
          <button type="button" className="perf-btn perf-btn--outline" onClick={() => setPeriod(period)}>
            Retry Loading
          </button>
        </div>
      )}

      {/* ----------------------------------------
          Main Content
          ---------------------------------------- */}
      {!loading && !error && data && (
        <main className="perf-main-grid">
          {/* ==================================
              1. Core Metrics Overview
              ================================== */}
          <section className="perf-section" aria-labelledby="sect-core-metrics">
            <div className="perf-section-header">
              <h2 id="sect-core-metrics">
                Progress Overview ({period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : period === '90d' ? 'Last 90 Days' : 'All Time'})
              </h2>
              <span className="perf-meta-badge">
                {data.overview.activeDaysCount} active days ({data.overview.sessionsPerWeek} sessions/wk)
              </span>
            </div>

            <div className="perf-stats-grid">
              {/* Sessions */}
              <article className="perf-stat-card">
                <div className="perf-stat-icon perf-stat-icon--purple" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="4" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <div className="perf-stat-body">
                  <strong className="perf-stat-val">{data.overview.totalCompleted}</strong>
                  <span className="perf-stat-label">{text?.totalSessions || 'Completed Sessions'}</span>
                  <small className="perf-stat-sub">
                    {data.overview.sessionsPerWeek} / week rhythm
                  </small>
                </div>
              </article>

              {/* Average Accuracy */}
              <article className="perf-stat-card">
                <div className="perf-stat-icon perf-stat-icon--teal" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="perf-stat-body">
                  <strong className="perf-stat-val">{data.overview.avgAccuracy}%</strong>
                  <span className="perf-stat-label">{text?.averageAccuracy || 'Average Accuracy'}</span>
                  <small className="perf-stat-sub">
                    {data.baselineComparison.isReliable
                      ? `${data.baselineComparison.accuracyDiff >= 0 ? '+' : ''}${data.baselineComparison.accuracyDiff}% vs baseline`
                      : 'Accumulating baseline'}
                  </small>
                </div>
              </article>

              {/* Mistakes */}
              <article className="perf-stat-card">
                <div className="perf-stat-icon perf-stat-icon--peach" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <div className="perf-stat-body">
                  <strong className="perf-stat-val">{data.overview.avgMistakes}</strong>
                  <span className="perf-stat-label">{text?.averageMistakes || 'Mistakes / Game'}</span>
                  <small className="perf-stat-sub">
                    {data.baselineComparison.isReliable
                      ? `${data.baselineComparison.mistakesDiff <= 0 ? '' : '+'}${data.baselineComparison.mistakesDiff} vs baseline`
                      : 'Across recorded sessions'}
                  </small>
                </div>
              </article>

              {/* Time */}
              <article className="perf-stat-card">
                <div className="perf-stat-icon perf-stat-icon--blue" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="perf-stat-body">
                  <strong className="perf-stat-val">
                    {data.overview.avgTime > 0 ? `${data.overview.avgTime}s` : '—'}
                  </strong>
                  <span className="perf-stat-label">{text?.averageTime || 'Average Duration'}</span>
                  <small className="perf-stat-sub">
                    Most played: {data.overview.mostPlayedGame}
                  </small>
                </div>
              </article>

              {/* Personal Best */}
              <article className="perf-stat-card">
                <div className="perf-stat-icon perf-stat-icon--amber" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="perf-stat-body">
                  <strong className="perf-stat-val">
                    {data.overview.personalBestAccuracy > 0 ? `${data.overview.personalBestAccuracy}%` : '—'}
                  </strong>
                  <span className="perf-stat-label">{text?.personalBestAccuracy || 'Personal Best'}</span>
                  <small className="perf-stat-sub">Peak score achieved</small>
                </div>
              </article>
            </div>
          </section>

          {/* ==================================
              2. AI Game and Difficulty Recommendations
              ================================== */}
          {data.recommendation && (
            <section className="perf-panel perf-panel--recommendation" aria-labelledby="sect-rec">
              <div className="perf-rec-badge">
                <span>🎯 Adaptive AI Recommendation</span>
                <span className={`perf-status-pill perf-status-pill--${data.recommendation.performance_status}`}>
                  {data.recommendation.performance_status === 'Improving'
                    ? '📈 Advancing'
                    : data.recommendation.performance_status === 'Needs Practice'
                    ? '🛡️ Supportive Pace'
                    : data.recommendation.performance_status === 'New'
                    ? '✨ Welcome Round'
                    : '⚖️ Steady Level'}
                </span>
              </div>

              <div className="perf-rec-grid">
                <div className="perf-rec-main">
                  <h3 className="perf-rec-game-title" id="sect-rec">
                    {data.recommendation.game}
                  </h3>
                  <div className="perf-rec-level-callout">
                    <span>Recommended Level:</span>
                    <strong>{selectedDifficulty || data.recommendation.difficulty}</strong>
                  </div>
                  <p className="perf-rec-reason">
                    {data.recommendation.reason}
                  </p>
                </div>

                <div className="perf-rec-action-box">
                  <div className="perf-rec-diff-picker">
                    <span className="perf-rec-picker-label">Choose challenge level:</span>
                    <div className="perf-rec-diff-buttons" role="radiogroup" aria-label="Difficulty levels">
                      {data.recommendation.supportedDifficulties.map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          className={`perf-diff-btn ${selectedDifficulty === diff ? 'perf-diff-btn--active' : ''}`}
                          onClick={() => setSelectedDifficulty(diff)}
                          aria-checked={selectedDifficulty === diff}
                          role="radio"
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="perf-play-btn"
                    onClick={handlePlayNow}
                    aria-label={`Play ${data.recommendation.game} on ${selectedDifficulty || data.recommendation.difficulty} difficulty`}
                  >
                    <span>▶ Play Now</span>
                    <small>({selectedDifficulty || data.recommendation.difficulty})</small>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ==================================
              3. Gemini AI Performance Analysis
              ================================== */}
          <section className="perf-panel perf-panel--ai" aria-labelledby="sect-ai-analysis">
            <div className="perf-ai-header">
              <div className="perf-ai-header-left">
                <span className="perf-ai-sparkle">✨</span>
                <div>
                  <h2 id="sect-ai-analysis" className="perf-ai-title">
                    Gemini AI Performance Analysis
                  </h2>
                  <p className="perf-ai-subtitle">
                    Comprehensive, elder-friendly clinical evaluation powered by Google Gemini 3.8 Flash.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="perf-btn perf-btn--ai-refresh"
                onClick={() => fetchGeminiAnalysis(true)}
                disabled={aiLoading}
              >
                {aiLoading ? 'Analyzing...' : '🔄 Refresh AI Insights'}
              </button>
            </div>

            {aiLoading && (
              <div className="perf-ai-loading">
                <div className="perf-spinner" />
                <p>Gemini is evaluating your gameplay metrics, calculating baseline trends, and creating your custom practice plan...</p>
              </div>
            )}

            {!aiLoading && aiError && (
              <div className="perf-ai-error" role="alert">
                <p>{aiError}</p>
                <button type="button" className="perf-btn perf-btn--outline" onClick={() => fetchGeminiAnalysis(true)}>
                  Try Again
                </button>
              </div>
            )}

            {!aiLoading && aiAnalysis && (
              <div className="perf-ai-content">
                {/* Summary Card */}
                <div className="perf-ai-summary-card">
                  <div className="perf-ai-summary-heading">
                    <span className="perf-ai-label">Summary & Rhythm</span>
                    <span className="perf-ai-model-tag">
                      {aiAnalysis.is_ai_powered ? '🤖 Gemini 3.8 Flash' : '🛡️ Assistive Clinical Engine'}
                    </span>
                  </div>
                  <p className="perf-ai-summary-text">{aiAnalysis.summary}</p>
                </div>

                {/* Strengths & Practice Areas Grid */}
                <div className="perf-ai-columns-grid">
                  {/* Strengths */}
                  <article className="perf-ai-col-card perf-ai-col-card--strengths">
                    <div className="perf-ai-col-header">
                      <span className="perf-ai-icon">💪</span>
                      <h3>Demonstrated Strengths</h3>
                    </div>
                    <ul className="perf-ai-list">
                      {(aiAnalysis.strengths || []).map((s, idx) => (
                        <li key={idx}>
                          <span className="perf-ai-bullet">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </article>

                  {/* Areas to Practice */}
                  <article className="perf-ai-col-card perf-ai-col-card--practice">
                    <div className="perf-ai-col-header">
                      <span className="perf-ai-icon">🌱</span>
                      <h3>Gentle Areas to Practice</h3>
                    </div>
                    <ul className="perf-ai-list">
                      {(aiAnalysis.areas_to_practice || []).map((a, idx) => (
                        <li key={idx}>
                          <span className="perf-ai-bullet">→</span>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>

                {/* Progress & Baseline Trends */}
                {aiAnalysis.progress_trends && (
                  <div className="perf-ai-trend-card">
                    <div className="perf-ai-trend-header">
                      <span className="perf-ai-icon">📈</span>
                      <h3>Progress & Baseline Trends</h3>
                    </div>
                    <p className="perf-ai-trend-text">{aiAnalysis.progress_trends}</p>
                  </div>
                )}

                {/* Personalized Practice Plan */}
                {aiAnalysis.personalized_practice_plan && aiAnalysis.personalized_practice_plan.length > 0 && (
                  <div className="perf-ai-plan-card">
                    <div className="perf-ai-plan-header">
                      <span className="perf-ai-icon">📅</span>
                      <div>
                        <h3>Personalized Practice Plan</h3>
                        <p>Gentle, achievable activity schedule tailored to your memory rhythm.</p>
                      </div>
                    </div>

                    <div className="perf-ai-plan-grid">
                      {aiAnalysis.personalized_practice_plan.map((item, idx) => (
                        <article key={idx} className="perf-ai-plan-item">
                          <span className="perf-ai-plan-freq">{item.day_or_frequency}</span>
                          <strong className="perf-ai-plan-game">{item.recommended_game}</strong>
                          <span className="perf-ai-plan-diff">Level: {item.recommended_difficulty}</span>
                          <p className="perf-ai-plan-tip">💡 {item.focus_tip}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ==================================
              4. Interactive Performance Trend Charts
              ================================== */}
          <section className="perf-panel" aria-labelledby="sect-charts">
            <div className="perf-section-header">
              <div>
                <h2 id="sect-charts">Performance Trend Charts</h2>
                <p className="perf-panel-desc">Interactive session-by-session history and baseline tracking.</p>
              </div>

              <div className="perf-chart-tabs" role="tablist" aria-label="Chart Metric">
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
                    aria-selected={chartMetric === m.id}
                    className={`perf-chart-tab ${chartMetric === m.id ? 'perf-chart-tab--active' : ''}`}
                    onClick={() => {
                      setChartMetric(m.id)
                      setSelectedPoint(null)
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="perf-chart-box">
              <PerformanceTrendChart
                points={data.trendPoints}
                metric={chartMetric}
                baselineValue={
                  chartMetric === 'accuracy'
                    ? data.baselineComparison.baselineAccuracy
                    : chartMetric === 'mistakes'
                    ? data.baselineComparison.baselineMistakes
                    : chartMetric === 'time'
                    ? data.baselineComparison.baselineTime
                    : null
                }
                weeklyData={data.weeklyParticipation}
                onSelectPoint={(p) => setSelectedPoint(p)}
                selectedPoint={selectedPoint}
              />

              {/* Point Inspector */}
              {selectedPoint && chartMetric !== 'participation' && (
                <div className="perf-point-inspector" aria-live="polite">
                  <div className="perf-inspector-header">
                    <strong>{selectedPoint.game}</strong>
                    <span>{selectedPoint.dateFormatted}</span>
                  </div>
                  <div className="perf-inspector-stats">
                    <span>Accuracy: <strong>{selectedPoint.accuracy}%</strong></span>
                    <span>Mistakes: <strong>{selectedPoint.mistakes}</strong></span>
                    <span>Duration: <strong>{selectedPoint.time}s</strong></span>
                    <span>Level: <strong>{selectedPoint.difficulty}</strong></span>
                  </div>
                </div>
              )}

              {/* Chart Summary Explanation */}
              <div className="perf-chart-desc">
                <p>
                  <strong>Chart Guide:</strong>{' '}
                  {chartMetric === 'accuracy'
                    ? `The solid purple line connects your individual scores. The dashed purple line indicates your 3-session rolling average, and the dashed amber line shows your ${
                        data.baselineComparison.isReliable
                          ? `${data.baselineComparison.baselineAccuracy}% baseline`
                          : 'accumulating baseline'
                      }.`
                    : chartMetric === 'mistakes'
                    ? 'Displays mistakes made per activity over time. Lower values reflect fewer incorrect guesses.'
                    : chartMetric === 'time'
                    ? 'Displays completion duration in seconds for each activity. Times vary naturally by puzzle complexity.'
                    : 'Displays the number of activities completed each week, illustrating regular mental exercise habits.'}
                </p>
              </div>
            </div>
          </section>

          {/* ==================================
              5. Personal Baseline & Sustained Changes
              ================================== */}
          <section className="perf-panel" aria-labelledby="sect-baseline">
            <div className="perf-section-header">
              <div>
                <h2 id="sect-baseline">Personal Baseline Comparison</h2>
                <p className="perf-panel-desc">Individualized benchmarking calculated from your sustained history.</p>
              </div>

              {data.baselineComparison.isReliable && (
                <span className={`perf-status-pill perf-status-pill--${data.baselineComparison.overallStatus}`}>
                  {data.baselineComparison.overallStatus === 'improving'
                    ? '📈 Improving'
                    : data.baselineComparison.overallStatus === 'declining'
                    ? '📉 Varying from Baseline'
                    : '⚖️ Broadly Stable'}
                </span>
              )}
            </div>

            {data.baselineComparison.isReliable ? (
              <div className="perf-baseline-card">
                <div className="perf-baseline-grid">
                  {/* Accuracy */}
                  <div className="perf-baseline-col">
                    <span className="perf-b-label">Accuracy Comparison</span>
                    <div className="perf-b-comparison">
                      <div>
                        <small>Baseline</small>
                        <strong>{data.baselineComparison.baselineAccuracy}%</strong>
                      </div>
                      <span className="perf-b-arrow">→</span>
                      <div>
                        <small>Recent</small>
                        <strong>{data.baselineComparison.recentAccuracy}%</strong>
                      </div>
                    </div>
                    <div className={`perf-diff-pill ${data.baselineComparison.accuracyDiff >= 0 ? 'perf-diff-pill--pos' : 'perf-diff-pill--neg'}`}>
                      {data.baselineComparison.accuracyDiff >= 0 ? '+' : ''}
                      {data.baselineComparison.accuracyDiff}% vs baseline
                    </div>
                  </div>

                  {/* Mistakes */}
                  <div className="perf-baseline-col">
                    <span className="perf-b-label">Mistake Frequency</span>
                    <div className="perf-b-comparison">
                      <div>
                        <small>Baseline</small>
                        <strong>{data.baselineComparison.baselineMistakes}</strong>
                      </div>
                      <span className="perf-b-arrow">→</span>
                      <div>
                        <small>Recent</small>
                        <strong>{data.baselineComparison.recentMistakes}</strong>
                      </div>
                    </div>
                    <div className={`perf-diff-pill ${data.baselineComparison.mistakesDiff <= 0 ? 'perf-diff-pill--pos' : 'perf-diff-pill--neg'}`}>
                      {data.baselineComparison.mistakesDiff <= 0 ? '' : '+'}
                      {data.baselineComparison.mistakesDiff} mistakes / game
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="perf-baseline-col">
                    <span className="perf-b-label">Completion Duration</span>
                    <div className="perf-b-comparison">
                      <div>
                        <small>Baseline</small>
                        <strong>{data.baselineComparison.baselineTime}s</strong>
                      </div>
                      <span className="perf-b-arrow">→</span>
                      <div>
                        <small>Recent</small>
                        <strong>{data.baselineComparison.recentTime}s</strong>
                      </div>
                    </div>
                    <div className="perf-diff-pill perf-diff-pill--neutral">
                      {data.baselineComparison.timeDiff <= 0 ? '' : '+'}
                      {data.baselineComparison.timeDiff}s duration shift
                    </div>
                  </div>
                </div>

                <div className="perf-baseline-foot">
                  <p><strong>Evidence:</strong> {data.baselineComparison.evidenceText}</p>
                </div>
              </div>
            ) : (
              <div className="perf-info-callout">
                <span className="perf-info-icon">ℹ️</span>
                <div>
                  <strong>Personal Baseline Establishing</strong>
                  <p>
                    {data.baselineComparison.reason} You have completed{' '}
                    <strong>{data.overview.totalCompleted}</strong> sessions in this period. As you play more, Cognicare computes your individualized baseline.
                  </p>
                </div>
              </div>
            )}

            {/* Sustained Changes */}
            <div className="perf-sustained-wrapper">
              <h3 className="perf-subheading">Sustained-Change Observations</h3>
              {data.sustainedChanges && data.sustainedChanges.length > 0 ? (
                <div className="perf-sustained-list">
                  {data.sustainedChanges.map((alert) => (
                    <article key={alert.id} className={`perf-sustained-card perf-sustained-card--${alert.type}`}>
                      <div className="perf-sustained-head">
                        <span className="perf-sustained-badge">
                          {alert.type === 'positive' ? '✨ Positive Trend' : '🔍 Activity Notice'}
                        </span>
                        <span className="perf-sustained-count">Observed across {alert.sessionCount} consecutive sessions</span>
                      </div>
                      <h4>{alert.title}</h4>
                      <p>{alert.description}</p>
                      <small><strong>Context:</strong> {alert.contextNote}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="perf-steady-callout">
                  <span className="perf-steady-icon">✓</span>
                  <div>
                    <strong>Steady Activity Pattern Recorded</strong>
                    <p>No sustained deviations detected across consecutive sessions. Scores remain comfortably within your natural baseline range.</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ==================================
              6. Activity & Difficulty Breakdowns
              ================================== */}
          <section className="perf-panel" aria-labelledby="sect-games">
            <h2 id="sect-games">Activity & Difficulty Breakdown</h2>

            <div className="perf-breakdowns-grid">
              {/* Game-by-game */}
              <div className="perf-game-breakdown-col">
                <h3 className="perf-subheading">By Cognitive Activity</h3>
                <div className="perf-games-list">
                  {data.gameBreakdown.map((g) => (
                    <article key={g.game} className="perf-game-card">
                      <div className="perf-game-head">
                        <strong>{g.game}</strong>
                        <span className={`perf-status-pill perf-status-pill--${g.status}`}>
                          {g.status === 'improving' ? 'Improving' : g.status === 'declining' ? 'Varying' : g.status === 'insufficient_data' ? 'Building Data' : 'Steady'}
                        </span>
                      </div>
                      <div className="perf-game-stats">
                        <span>Sessions: <strong>{g.sessionCount}</strong></span>
                        <span>Avg Acc: <strong>{g.avgAccuracy}%</strong></span>
                        <span>Mistakes: <strong>{g.avgMistakes}</strong></span>
                        <span>Time: <strong>{g.avgTime > 0 ? `${g.avgTime}s` : '—'}</strong></span>
                      </div>
                      {g.baselineAccuracy != null && g.recentAccuracy != null && (
                        <div className="perf-game-trend-foot">
                          <small>Baseline {g.baselineAccuracy}% → Recent {g.recentAccuracy}%</small>
                          <strong className={g.trend >= 0 ? 'perf-txt-pos' : 'perf-txt-neg'}>
                            {g.trend >= 0 ? '+' : ''}{g.trend}%
                          </strong>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>

              {/* Difficulty breakdown */}
              {data.difficultyBreakdown && data.difficultyBreakdown.length > 0 && (
                <div className="perf-diff-breakdown-col">
                  <h3 className="perf-subheading">Difficulty Consistency (Non-Cross-Tier)</h3>
                  <div className="perf-diff-list">
                    {data.difficultyBreakdown.map((d) => (
                      <article key={d.difficulty} className="perf-game-card">
                        <div className="perf-game-head">
                          <strong>{d.difficulty} Tier</strong>
                          <span className="perf-session-tag">{d.sessionCount} session{d.sessionCount === 1 ? '' : 's'}</span>
                        </div>
                        <div className="perf-game-stats">
                          <span>Avg Acc: <strong>{d.avgAccuracy}%</strong></span>
                          <span>Mistakes: <strong>{d.avgMistakes}</strong></span>
                          <span>Duration: <strong>{d.avgTime > 0 ? `${d.avgTime}s` : '—'}</strong></span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ==================================
              7. Caregiver Progress Reports Sharing
              ================================== */}
          {user?.role === 'elderly' && (
            <section className="perf-panel perf-panel--caregiver" aria-labelledby="sect-caregivers">
              <div className="perf-section-header">
                <div>
                  <h2 id="sect-caregivers">Caregiver Progress Report Sharing</h2>
                  <p className="perf-panel-desc">
                    Control which approved caregivers can view your cognitive progress reports. Consent is managed explicitly by you.
                  </p>
                </div>

                <button
                  type="button"
                  className="perf-btn perf-btn--outline"
                  onClick={() => setIsReportModalOpen(true)}
                >
                  📄 Preview & Print Full Report
                </button>
              </div>

              {permLoading && <p className="perf-loading-txt">Loading caregiver connections...</p>}

              {!permLoading && caregiverPermissions.length === 0 && (
                <div className="perf-empty-callout">
                  <p>
                    No approved caregivers linked yet. You can invite or approve caregivers from the{' '}
                    <strong>Caregiver Requests</strong> page on the main dashboard.
                  </p>
                </div>
              )}

              {!permLoading && caregiverPermissions.length > 0 && (
                <div className="perf-caregiver-list">
                  {caregiverPermissions.map((cg) => (
                    <article key={cg.caregiverId} className="perf-caregiver-card">
                      <div className="perf-cg-info">
                        <strong>{cg.caregiverName}</strong>
                        <span>{cg.caregiverEmail}</span>
                      </div>

                      <div className="perf-cg-status">
                        <span className={`perf-perm-badge ${cg.reportAccessGranted ? 'perf-perm-badge--granted' : 'perf-perm-badge--paused'}`}>
                          {cg.reportAccessGranted ? '✓ Sharing Active' : '🔒 Access Paused'}
                        </span>

                        <button
                          type="button"
                          className={`perf-btn ${cg.reportAccessGranted ? 'perf-btn--danger-sm' : 'perf-btn--primary-sm'}`}
                          onClick={() => handleToggleCaregiverShare(cg.caregiverId, cg.reportAccessGranted)}
                        >
                          {cg.reportAccessGranted ? 'Pause Sharing' : 'Enable Sharing'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ==================================
              8. Recent Session History
              ================================== */}
          <section className="perf-panel" aria-labelledby="sect-history">
            <h2 id="sect-history">{text?.recentSessions || 'Recent Activity Sessions'}</h2>
            {data.trendPoints.length === 0 ? (
              <p className="perf-empty-text">{text?.noSessions || 'No sessions recorded yet.'}</p>
            ) : (
              <div className="perf-table-wrapper">
                <table className="perf-table">
                  <thead>
                    <tr>
                      <th>Activity</th>
                      <th>Difficulty</th>
                      <th>Accuracy</th>
                      <th>Mistakes</th>
                      <th>Duration</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trendPoints.slice(-10).reverse().map((s) => (
                      <tr key={s.id}>
                        <td><strong>{s.game}</strong></td>
                        <td><span className="perf-level-badge">{s.difficulty}</span></td>
                        <td><strong>{s.accuracy}%</strong></td>
                        <td>{s.mistakes}</td>
                        <td>{s.time > 0 ? `${s.time}s` : '—'}</td>
                        <td>{s.dateFormatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ==================================
              9. Medical Disclaimer
              ================================== */}
          <footer className="perf-disclaimer-box" aria-label="Medical Disclaimer">
            <div className="perf-disclaimer-icon" aria-hidden="true">🛡️</div>
            <div>
              <h3>Assistive Tracking Disclaimer</h3>
              <p>{data.disclaimer}</p>
            </div>
          </footer>
        </main>
      )}

      {/* Caregiver Report Modal */}
      <CaregiverReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportData={data}
        aiAnalysis={aiAnalysis}
        user={user}
        period={period}
      />
    </div>
  )
}