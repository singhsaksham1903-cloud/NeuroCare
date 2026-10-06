import { useEffect, useState } from 'react'

import './RecommendationCard.css'

import { apiGet } from '../utils/api'


function RecommendationCard({
  onStart,
  text,
}) {
  const [recommendation, setRecommendation] =
    useState(null)

  const [showDetails, setShowDetails] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')


  useEffect(() => {
    const loadRecommendation = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await apiGet(
          '/recommendation',
        )

        setRecommendation(data)
      } catch (err) {
        setError(
          err.message ||
          text.unavailable,
        )
      } finally {
        setLoading(false)
      }
    }


    const handlePerformanceUpdate = () => {
      loadRecommendation()
    }


    loadRecommendation()


    window.addEventListener(
      'cognicare:performance-updated',
      handlePerformanceUpdate,
    )


    return () => {
      window.removeEventListener(
        'cognicare:performance-updated',
        handlePerformanceUpdate,
      )
    }
  }, [])


  const recommendationIcon = (
    <span
      className="recommendation-icon"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M32 9L35.7 19.3L46 23L35.7 26.7L32 37L28.3 26.7L18 23L28.3 19.3L32 9Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M49 35L51 40.5L56.5 42.5L51 44.5L49 50L47 44.5L41.5 42.5L47 40.5L49 35Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle
          cx="19"
          cy="42"
          r="5"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      </svg>
    </span>
  )


  if (loading) {
    return (
      <article className="recommendation-card recommendation-card--loading">
        {recommendationIcon}

        <div className="recommendation-content">
          <span className="recommendation-label">
            {text.title}
          </span>

          <h2>
            {text.analyzing}
          </h2>

          <p className="recommendation-loading-text">
            {text.analyzing}
          </p>
        </div>
      </article>
    )
  }


  if (
    error ||
    !recommendation?.recommendation
  ) {
    return (
      <article className="recommendation-card recommendation-card--empty">
        {recommendationIcon}

        <div className="recommendation-content">
          <span className="recommendation-label">
            {text.title}
          </span>

          <h2>
            {text.noRecommendation}
          </h2>

          <p>
            {error ||
              text.noRecommendation}
          </p>
        </div>
      </article>
    )
  }


  const {
    game,
    difficulty,
    reason,
    performance_status,
  } =
    recommendation.recommendation


  const gameSummary =
    recommendation.game_summaries?.[game]


  const getGameDisplayName = (
    gameName,
  ) => {
    const gameNames = {
      'Memory Match':
        text.games.memoryMatch,

      'Sequence Memory':
        text.games.sequenceMemory,

      'Object Recall':
        text.games.objectRecall,
    }

    return (
      gameNames[gameName] ||
      gameName
    )
  }


  const getPerformanceStatus = (
    status,
  ) => {
    const statusMap = {
      Improving: text.improving,
      Declining: text.declining,
      Stable: text.stable,
      'Not enough data':
        text.notEnoughData,
    }

    return (
      statusMap[status] ||
      status
    )
  }


  return (
    <article className="recommendation-card">

      <div className="recommendation-visual">
        {recommendationIcon}

        <span className="recommendation-visual-label">
          {text.title}
        </span>
      </div>


      <div className="recommendation-content">

        <span className="recommendation-label">
          {text.suggestedDifficulty}
        </span>


        <h2>
          {getGameDisplayName(game)}
        </h2>


        <div className="recommendation-difficulty">
          <span>
            {text.suggestedDifficulty}
          </span>

          <strong>
            {difficulty}
          </strong>
        </div>


        <p className="recommendation-reason">
          {reason}
        </p>


        <small className="recommendation-meta">
          {text.basedOn}{' '}
          {recommendation.based_on_sessions}{' '}
          {recommendation.based_on_sessions === 1
            ? text.session
            : text.sessions}
          .
        </small>


        <div className="recommendation-actions">

          <button
            type="button"
            className="recommendation-start-button"
            onClick={() =>
              onStart(
                game,
                difficulty,
              )
            }
          >
            {text.startRecommendedGame}
          </button>


          <button
            type="button"
            className="recommendation-details-button"
            onClick={() =>
              setShowDetails(
                (current) => !current,
              )
            }
            aria-expanded={showDetails}
          >
            {showDetails
              ? text.hideDetails
              : text.whyRecommendation}
          </button>

        </div>


        {showDetails &&
          gameSummary && (
            <div className="recommendation-details">

              <h3>
                {text.whyRecommendation}
              </h3>


              <div className="recommendation-detail-grid">

                <div>
                  <span>
                    {text.recentAccuracy}
                  </span>

                  <strong>
                    {
                      gameSummary.recent_accuracy
                    }%
                  </strong>
                </div>


                <div>
                  <span>
                    {text.overallAccuracy}
                  </span>

                  <strong>
                    {
                      gameSummary.overall_accuracy
                    }%
                  </strong>
                </div>


                <div>
                  <span>
                    {text.mistakesPerSession}
                  </span>

                  <strong>
                    {
                      gameSummary.average_mistakes
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    {text.performanceTrend}
                  </span>

                  <strong>
                    {
                      getPerformanceStatus(
                        performance_status,
                      )
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    {text.sessionsAnalyzed}
                  </span>

                  <strong>
                    {
                      recommendation.based_on_sessions
                    }
                  </strong>
                </div>

              </div>


              <p>
                {text.recommendationExplanation}
              </p>

            </div>
          )}

      </div>

    </article>
  )
}


export default RecommendationCard