import { useEffect, useState, useId } from 'react'
import VoiceReadAloud from '../Components/VoiceReadAloud'
import { apiGet } from '../utils/api'
import './CognitiveProgressInsights.css'

// ============================================
// SVG Trend Chart Component
// ============================================

export function ProgressTrendChart({
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
        <div className="cpi-empty-chart">
          <p>No weekly activity data recorded in this period.</p>
        </div>
      )
    }

    const maxCount = Math.max(...weeklyData.map((d) => d.sessionCount), 4)
    const chartHeight = 180
    const chartWidth = 540
    const barWidth = Math.min(48, Math.max(24, Math.floor((chartWidth - 60) / weeklyData.length) - 16))

    return (
      <div className="cpi-chart-wrapper">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 50}`}
          className="cpi-svg-chart"
          role="img"
          aria-label="Weekly participation chart"
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
                <text x="32" y={y + 4} textAnchor="end" className="cpi-axis-text">
                  {Math.round(ratio * maxCount)}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {weeklyData.map((w, idx) => {
            const availableWidth = chartWidth - 60
            const step = availableWidth / weeklyData.length
            const x = 50 + idx * step + (step - barWidth) / 2
            const barH = (w.sessionCount / maxCount) * (chartHeight - 30)
            const y = chartHeight - barH

            return (
              <g key={idx} className="cpi-bar-group">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, 3)}
                  rx="6"
                  className="cpi-bar-rect"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="cpi-bar-val"
                >
                  {w.sessionCount}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="cpi-axis-text"
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
      <div className="cpi-empty-chart">
        <p>No completed sessions recorded in this period for this filter.</p>
      </div>
    )
  }

  const chartHeight = 200
  const chartWidth = 560
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

  // Polyline coordinates for actual points
  const pointsCoords = points.map((p, idx) => ({
    x: getX(idx),
    y: getY(p[metricKey]),
    p,
  }))

  const polylineStr = pointsCoords.map((pt) => `${pt.x},${pt.y}`).join(' ')

  // Polyline for rolling accuracy if accuracy metric
  let rollingPolyline = ''
  if (metric === 'accuracy' && points.length > 2) {
    rollingPolyline = points
      .map((p, idx) => `${getX(idx)},${getY(p.rollingAccuracy)}`)
      .join(' ')
  }

  // Baseline Y line
  const baselineY = baselineValue != null ? getY(baselineValue) : null

  return (
    <div className="cpi-chart-wrapper">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="cpi-svg-chart"
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
              <text x={padLeft - 8} y={y + 4} textAnchor="end" className="cpi-axis-text">
                {Math.round(val)}
                {unit}
              </text>
            </g>
          )
        })}

        {/* Baseline Line */}
        {baselineY != null && baselineY >= padTop && baselineY <= chartHeight - padBottom && (
          <g className="cpi-baseline-guide">
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
              className="cpi-baseline-text"
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

        {/* Individual Points */}
        {pointsCoords.map((pt, idx) => {
          const isSelected = selectedPoint?.id === pt.p.id
          return (
            <g
              key={idx}
              className="cpi-point-group"
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
                className={`cpi-data-dot ${isSelected ? 'cpi-data-dot--selected' : ''}`}
              />
              {/* X Axis Date label on selected intervals */}
              {(points.length <= 8 || idx % Math.ceil(points.length / 6) === 0 || idx === points.length - 1) && (
                <text
                  x={pt.x}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  className="cpi-axis-text"
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
// Main Cognitive Progress Insights Component
// ============================================

export default function CognitiveProgressInsights({
  onBack,
  user,
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
}) {
  const [period, setPeriod] = useState('30d')
  const [gameFilter, setGameFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [chartMetric, setChartMetric] = useState('accuracy')
  const [selectedPoint, setSelectedPoint] = useState(null)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Could not load cognitive progress insights.')
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

  // Overview summary text for Voice Read Aloud
  const readAloudContent = data?.baselineComparison?.isReliable
    ? `Cognitive Progress Insights for ${period === '7d' ? 'last 7 days' : period === '30d' ? 'last 30 days' : period === '90d' ? 'last 90 days' : 'all recorded history'}. You completed ${data.overview.totalCompleted} sessions with an average accuracy of ${data.overview.avgAccuracy} percent. Your performance status is ${data.baselineComparison.overallStatus === 'improving' ? 'improving' : data.baselineComparison.overallStatus === 'declining' ? 'varying from baseline' : 'broadly stable'}. Personal baseline accuracy is ${data.baselineComparison.baselineAccuracy} percent compared with ${data.baselineComparison.recentAccuracy} percent recently.`
    : `Cognitive Progress Insights. You completed ${data?.overview?.totalCompleted || 0} sessions in this period. As you play more activities, Cognicare establishes your personal baseline.`

  return (
    <div className="cpi-page">
      {/* ----------------------------------------
          Header & Navigation
          ---------------------------------------- */}
      <header className="cpi-header">
        <button
          type="button"
          className="cpi-back-btn"
          onClick={onBack}
          aria-label={text?.backToDashboard || 'Back to Dashboard'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{text?.backToDashboard || 'Back to Dashboard'}</span>
        </button>

        <div className="cpi-title-row">
          <div>
            <h1 className="cpi-title">{text?.title || 'Cognitive Progress Insights'}</h1>
            <p className="cpi-subtitle">
              {user?.full_name ? `${user.full_name} · ` : ''}
              {text?.subtitle || 'Understand changes in your activity performance, rhythm, and baseline over time.'}
            </p>
          </div>

          <div className="cpi-header-actions">
            <button
              type="button"
              className="cpi-print-btn"
              onClick={() => window.print()}
              aria-label={text?.printSave || 'Print / Save'}
              title={text?.printSave || 'Print / Save'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>{text?.printSave || 'Print / Save'}</span>
            </button>
            <VoiceReadAloud
              text={readAloudContent}
              language={language}
              label={readAloudLabel}
              stopLabel={stopReadingLabel}
            />
          </div>
        </div>

        {/* ----------------------------------------
            Period & Filter Controls
            ---------------------------------------- */}
        <div className="cpi-controls-bar">
          <div className="cpi-period-tabs" role="tablist" aria-label="Reporting Period">
            {[
              { id: '7d', label: text?.period7d || '7 Days' },
              { id: '30d', label: text?.period30d || '30 Days' },
              { id: '90d', label: text?.period90d || '90 Days' },
              { id: 'all', label: text?.periodAll || 'All History' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={period === tab.id}
                className={`cpi-period-tab ${period === tab.id ? 'cpi-period-tab--active' : ''}`}
                onClick={() => setPeriod(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="cpi-filter-group">
            <div className="cpi-game-filter">
              <label htmlFor="cpi-game-select" className="cpi-filter-label">
                {text?.activityLabel || 'Activity:'}
              </label>
              <select
                id="cpi-game-select"
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value)}
                className="cpi-select"
              >
                <option value="all">{text?.allActivities || 'All Activities'}</option>
                <option value="Memory Match">Memory Match</option>
                <option value="Sequence Memory">Sequence Memory</option>
                <option value="Object Recall">Object Recall</option>
                <option value="NER Cultural Recall">NER Cultural Recall</option>
                <option value="Personal Memory Recall">Personal Memory Recall</option>
              </select>
            </div>

            <div className="cpi-game-filter">
              <label htmlFor="cpi-diff-select" className="cpi-filter-label">
                {text?.difficultyLabel || 'Difficulty:'}
              </label>
              <select
                id="cpi-diff-select"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="cpi-select"
              >
                <option value="all">{text?.allDifficulties || 'All Difficulties'}</option>
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
        <div className="cpi-loading-state" aria-live="polite">
          <div className="cpi-spinner" />
          <p>Analyzing recorded cognitive sessions and calculating baselines...</p>
        </div>
      )}

      {error && !loading && (
        <div className="cpi-error-state" role="alert">
          <p className="cpi-error-text">{error}</p>
          <button
            type="button"
            className="cpi-btn cpi-btn--secondary"
            onClick={() => setPeriod(period)}
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* ----------------------------------------
          Main Dashboard Content
          ---------------------------------------- */}
      {!loading && !error && data && (
        <main className="cpi-content">
          {/* A. Progress Overview Cards */}
          <section className="cpi-section" aria-labelledby="section-overview">
            <h2 id="section-overview" className="cpi-section-title">
              Progress Overview ({period === '7d' ? 'Last 7 Days' : period === '30d' ? 'Last 30 Days' : period === '90d' ? 'Last 90 Days' : 'All Time'})
            </h2>

            <div className="cpi-stats-grid">
              <article className="cpi-stat-card">
                <div className="cpi-stat-icon cpi-stat-icon--purple" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="4" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <div className="cpi-stat-body">
                  <span className="cpi-stat-val">{data.overview.totalCompleted}</span>
                  <span className="cpi-stat-label">Completed Sessions</span>
                  <span className="cpi-stat-sub">
                    {data.overview.sessionsPerWeek} sessions / week
                  </span>
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
                  <span className="cpi-stat-val">{data.overview.avgAccuracy}%</span>
                  <span className="cpi-stat-label">Average Accuracy</span>
                  <span className="cpi-stat-sub">
                    {data.baselineComparison.isReliable
                      ? `${data.baselineComparison.accuracyDiff >= 0 ? '+' : ''}${data.baselineComparison.accuracyDiff}% vs baseline`
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
                  <span className="cpi-stat-val">{data.overview.avgMistakes}</span>
                  <span className="cpi-stat-label">Mistakes / Session</span>
                  <span className="cpi-stat-sub">
                    {data.baselineComparison.isReliable
                      ? `${data.baselineComparison.mistakesDiff <= 0 ? '' : '+'}${data.baselineComparison.mistakesDiff} vs baseline`
                      : 'Across completed activities'}
                  </span>
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
                  <span className="cpi-stat-val">
                    {data.overview.avgTime > 0 ? `${data.overview.avgTime}s` : '—'}
                  </span>
                  <span className="cpi-stat-label">Average Time</span>
                  <span className="cpi-stat-sub">
                    Most played: {data.overview.mostPlayedGame}
                  </span>
                </div>
              </article>
            </div>
          </section>

          {/* B. Personal Baseline Comparison Section */}
          <section className="cpi-section" aria-labelledby="section-baseline">
            <div className="cpi-section-header">
              <h2 id="section-baseline" className="cpi-section-title">
                Personal Baseline Comparison
              </h2>
              {data.baselineComparison.isReliable && (
                <span
                  className={`cpi-status-badge cpi-status-badge--${data.baselineComparison.overallStatus}`}
                >
                  {data.baselineComparison.overallStatus === 'improving'
                    ? '📈 Improving'
                    : data.baselineComparison.overallStatus === 'declining'
                    ? '📉 Differing from Baseline'
                    : '⚖️ Broadly Stable'}
                </span>
              )}
            </div>

            {data.baselineComparison.isReliable ? (
              <div className="cpi-baseline-card">
                <div className="cpi-baseline-grid">
                  <div className="cpi-baseline-col">
                    <span className="cpi-baseline-metric-label">Accuracy Comparison</span>
                    <div className="cpi-baseline-vals">
                      <div className="cpi-baseline-val-box">
                        <span className="cpi-b-label">Baseline</span>
                        <strong className="cpi-b-val">
                          {data.baselineComparison.baselineAccuracy}%
                        </strong>
                      </div>
                      <span className="cpi-arrow" aria-hidden="true">
                        →
                      </span>
                      <div className="cpi-baseline-val-box">
                        <span className="cpi-b-label">Recent</span>
                        <strong className="cpi-b-val">
                          {data.baselineComparison.recentAccuracy}%
                        </strong>
                      </div>
                    </div>
                    <div
                      className={`cpi-diff-pill ${
                        data.baselineComparison.accuracyDiff >= 0
                          ? 'cpi-diff-pill--pos'
                          : 'cpi-diff-pill--neg'
                      }`}
                    >
                      {data.baselineComparison.accuracyDiff >= 0 ? '+' : ''}
                      {data.baselineComparison.accuracyDiff} percentage points
                    </div>
                  </div>

                  <div className="cpi-baseline-col">
                    <span className="cpi-baseline-metric-label">Mistake Frequency</span>
                    <div className="cpi-baseline-vals">
                      <div className="cpi-baseline-val-box">
                        <span className="cpi-b-label">Baseline</span>
                        <strong className="cpi-b-val">
                          {data.baselineComparison.baselineMistakes}
                        </strong>
                      </div>
                      <span className="cpi-arrow" aria-hidden="true">
                        →
                      </span>
                      <div className="cpi-baseline-val-box">
                        <span className="cpi-b-label">Recent</span>
                        <strong className="cpi-b-val">
                          {data.baselineComparison.recentMistakes}
                        </strong>
                      </div>
                    </div>
                    <div
                      className={`cpi-diff-pill ${
                        data.baselineComparison.mistakesDiff <= 0
                          ? 'cpi-diff-pill--pos'
                          : 'cpi-diff-pill--neg'
                      }`}
                    >
                      {data.baselineComparison.mistakesDiff <= 0 ? '' : '+'}
                      {data.baselineComparison.mistakesDiff} mistakes / game
                    </div>
                  </div>

                  <div className="cpi-baseline-col">
                    <span className="cpi-baseline-metric-label">Completion Duration</span>
                    <div className="cpi-baseline-vals">
                      <div className="cpi-baseline-val-box">
                        <span className="cpi-b-label">Baseline</span>
                        <strong className="cpi-b-val">
                          {data.baselineComparison.baselineTime}s
                        </strong>
                      </div>
                      <span className="cpi-arrow" aria-hidden="true">
                        →
                      </span>
                      <div className="cpi-baseline-val-box">
                        <span className="cpi-b-label">Recent</span>
                        <strong className="cpi-b-val">
                          {data.baselineComparison.recentTime}s
                        </strong>
                      </div>
                    </div>
                    <div className="cpi-diff-pill cpi-diff-pill--neutral">
                      {data.baselineComparison.timeDiff <= 0 ? '' : '+'}
                      {data.baselineComparison.timeDiff}s duration change
                    </div>
                  </div>
                </div>

                <div className="cpi-baseline-footer">
                  <p className="cpi-baseline-evidence">
                    <strong>Evidence:</strong> {data.baselineComparison.evidenceText}
                  </p>
                  <p className="cpi-baseline-interpretation">
                    <strong>Interpretation:</strong>{' '}
                    {data.baselineComparison.overallStatus === 'improving'
                      ? 'Higher accuracy and consistent problem-solving have been demonstrated in recent activities.'
                      : data.baselineComparison.overallStatus === 'declining'
                      ? 'Lower accuracy was recorded in the recent window. Performance naturally shifts with fatigue or daily mood.'
                      : 'Your cognitive activity patterns are tracking steadily alongside your historical baseline.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="cpi-info-box">
                <div className="cpi-info-icon" aria-hidden="true">
                  ℹ️
                </div>
                <div>
                  <h3 className="cpi-info-title">Personal Baseline Establishing</h3>
                  <p className="cpi-info-desc">
                    {data.baselineComparison.reason} You currently have{' '}
                    <strong>{data.overview.totalCompleted}</strong> completed sessions in this
                    selected window. Play a few more rounds to unlock personalized baseline trends.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* C. Sustained-Change Notifications Area */}
          <section className="cpi-section" aria-labelledby="section-sustained">
            <h2 id="section-sustained" className="cpi-section-title">
              Sustained-Change Observations
            </h2>

            {data.sustainedChanges && data.sustainedChanges.length > 0 ? (
              <div className="cpi-sustained-list">
                {data.sustainedChanges.map((alert) => (
                  <article
                    key={alert.id}
                    className={`cpi-sustained-card cpi-sustained-card--${alert.type}`}
                  >
                    <div className="cpi-sustained-header">
                      <span className="cpi-sustained-badge">
                        {alert.type === 'positive' ? '✨ Positive Trend' : '🔍 Activity Notice'}
                      </span>
                      <span className="cpi-sustained-sessions">
                        Observed across {alert.sessionCount} consecutive sessions
                      </span>
                    </div>

                    <h3 className="cpi-sustained-title">{alert.title}</h3>
                    <p className="cpi-sustained-desc">{alert.description}</p>

                    <div className="cpi-sustained-context">
                      <strong>Context:</strong> {alert.contextNote}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="cpi-steady-notice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="cpi-steady-icon">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div>
                  <strong>Steady Activity Pattern Recorded</strong>
                  <p>
                    No sustained or unusual changes were detected across your recent activity
                    sessions. Performance remains stable within your natural range.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* D. Performance Trend Charts */}
          <section className="cpi-section" aria-labelledby="section-charts">
            <div className="cpi-section-header">
              <h2 id="section-charts" className="cpi-section-title">
                Performance Trend Charts
              </h2>

              <div className="cpi-chart-tabs" role="tablist" aria-label="Chart Metric">
                {[
                  { id: 'accuracy', label: 'Accuracy (%)' },
                  { id: 'mistakes', label: 'Mistakes' },
                  { id: 'time', label: 'Completion Time' },
                  { id: 'participation', label: 'Weekly Rhythm' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={chartMetric === m.id}
                    className={`cpi-chart-tab ${chartMetric === m.id ? 'cpi-chart-tab--active' : ''}`}
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

            <div className="cpi-chart-container">
              <ProgressTrendChart
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

              {/* Detail on selected point */}
              {selectedPoint && chartMetric !== 'participation' && (
                <div className="cpi-point-inspector" aria-live="polite">
                  <div className="cpi-inspector-header">
                    <strong>{selectedPoint.game}</strong>
                    <span>{selectedPoint.dateFormatted}</span>
                  </div>
                  <div className="cpi-inspector-stats">
                    <span>
                      Accuracy: <strong>{selectedPoint.accuracy}%</strong>
                    </span>
                    <span>
                      Mistakes: <strong>{selectedPoint.mistakes}</strong>
                    </span>
                    <span>
                      Duration: <strong>{selectedPoint.time}s</strong>
                    </span>
                    <span>
                      Difficulty: <strong>{selectedPoint.difficulty}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Plain-language text summary below chart */}
              <div className="cpi-chart-text-summary">
                <p>
                  <strong>Chart Summary:</strong>{' '}
                  {chartMetric === 'accuracy'
                    ? `Shows your accuracy session-by-session. The solid purple line connects your individual scores, the dotted line indicates your 3-session rolling average, and the dashed amber line shows your ${
                        data.baselineComparison.isReliable
                          ? `${data.baselineComparison.baselineAccuracy}% baseline`
                          : 'baseline'
                      }.`
                    : chartMetric === 'mistakes'
                    ? `Displays the number of mistakes made per completed activity over time. Lower values reflect fewer incorrect guesses.`
                    : chartMetric === 'time'
                    ? `Displays completion duration in seconds for each activity. Times vary naturally by puzzle type and difficulty.`
                    : `Displays the number of activities completed each week, illustrating regular cognitive exercise habits.`}
                </p>
              </div>
            </div>
          </section>

          {/* E. Game-by-Game Breakdown */}
          <section className="cpi-section" aria-labelledby="section-games">
            <h2 id="section-games" className="cpi-section-title">
              Activity Breakdown
            </h2>

            {data.gameBreakdown && data.gameBreakdown.length > 0 ? (
              <div className="cpi-games-grid">
                {data.gameBreakdown.map((g) => (
                  <article key={g.game} className="cpi-game-card">
                    <div className="cpi-game-card-top">
                      <h3 className="cpi-game-name">{g.game}</h3>
                      <span
                        className={`cpi-status-badge cpi-status-badge--${g.status}`}
                      >
                        {g.status === 'improving'
                          ? 'Improving'
                          : g.status === 'declining'
                          ? 'Varying'
                          : g.status === 'insufficient_data'
                          ? 'Building Data'
                          : 'Steady'}
                      </span>
                    </div>

                    <div className="cpi-game-card-metrics">
                      <div className="cpi-g-metric">
                        <span className="cpi-g-label">Sessions</span>
                        <strong className="cpi-g-val">{g.sessionCount}</strong>
                      </div>
                      <div className="cpi-g-metric">
                        <span className="cpi-g-label">Avg Accuracy</span>
                        <strong className="cpi-g-val">{g.avgAccuracy}%</strong>
                      </div>
                      <div className="cpi-g-metric">
                        <span className="cpi-g-label">Avg Mistakes</span>
                        <strong className="cpi-g-val">{g.avgMistakes}</strong>
                      </div>
                      <div className="cpi-g-metric">
                        <span className="cpi-g-label">Avg Duration</span>
                        <strong className="cpi-g-val">
                          {g.avgTime > 0 ? `${g.avgTime}s` : '—'}
                        </strong>
                      </div>
                    </div>

                    {g.baselineAccuracy != null && g.recentAccuracy != null && (
                      <div className="cpi-game-trend-foot">
                        <span>
                          Baseline {g.baselineAccuracy}% → Recent {g.recentAccuracy}%
                        </span>
                        <strong
                          className={g.trend >= 0 ? 'cpi-trend-pos' : 'cpi-trend-neg'}
                        >
                          {g.trend >= 0 ? '+' : ''}
                          {g.trend}%
                        </strong>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="cpi-empty-text">No activity records found for this period.</p>
            )}
          </section>

          {/* F. Difficulty Consistency Section */}
          {data.difficultyBreakdown && data.difficultyBreakdown.length > 0 && (
            <section className="cpi-section" aria-labelledby="section-difficulty">
              <div className="cpi-section-header">
                <div>
                  <h2 id="section-difficulty" className="cpi-section-title">
                    Difficulty Consistency
                  </h2>
                  <p className="cpi-section-subtitle">
                    Evaluation partitioned by challenge tier to prevent comparing puzzles of differing complexity.
                  </p>
                </div>
              </div>

              <div className="cpi-difficulty-grid">
                {data.difficultyBreakdown.map((d) => (
                  <article key={d.difficulty} className="cpi-game-card">
                    <div className="cpi-game-card-top">
                      <h3 className="cpi-game-name">{d.difficulty} Level</h3>
                      <span className="cpi-session-tag">
                        {d.sessionCount} session{d.sessionCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="cpi-game-card-metrics">
                      <div className="cpi-g-metric">
                        <span className="cpi-g-label">Avg Accuracy</span>
                        <strong className="cpi-g-val">{d.avgAccuracy}%</strong>
                      </div>
                      <div className="cpi-g-metric">
                        <span className="cpi-g-label">Avg Mistakes</span>
                        <strong className="cpi-g-val">{d.avgMistakes}</strong>
                      </div>
                      <div className="cpi-g-metric">
                        <span className="cpi-g-label">Avg Duration</span>
                        <strong className="cpi-g-val">
                          {d.avgTime > 0 ? `${d.avgTime}s` : '—'}
                        </strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* G. Actionable Insight Cards */}
          <section className="cpi-section" aria-labelledby="section-insights">
            <h2 id="section-insights" className="cpi-section-title">
              Personalized Insights
            </h2>

            <div className="cpi-insights-grid">
              {data.insightCards && data.insightCards.map((card) => (
                <article
                  key={card.id}
                  className={`cpi-insight-card cpi-insight-card--${card.type}`}
                >
                  <h3 className="cpi-insight-title">{card.title}</h3>
                  <p className="cpi-insight-msg">{card.message}</p>
                  <span className="cpi-insight-evidence">Evidence: {card.evidence}</span>
                </article>
              ))}
            </div>
          </section>

          {/* G. Responsible Interpretation & Medical Disclaimer */}
          <section className="cpi-disclaimer-box" aria-label="Medical Disclaimer">
            <div className="cpi-disclaimer-icon" aria-hidden="true">
              🛡️
            </div>
            <div>
              <h3 className="cpi-disclaimer-title">Assistive Tracking Disclaimer</h3>
              <p className="cpi-disclaimer-text">{data.disclaimer}</p>
            </div>
          </section>
        </main>
      )}
    </div>
  )
}
