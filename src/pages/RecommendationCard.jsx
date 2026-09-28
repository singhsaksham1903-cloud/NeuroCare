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


  if (loading) {
    return (
      <article className="recommendation-card">

        <div className="recommendation-icon">
          ✨
        </div>

        <div>
          <h2>
            {text.title}
          </h2>

          <p>
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
      <article className="recommendation-card">

        <div className="recommendation-icon">
          ✨
        </div>

        <div>
          <h2>
            {text.title}
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

      <div className="recommendation-icon">
        ✨
      </div>


      <div className="recommendation-content">

        <span className="recommendation-label">
          {text.title}
        </span>


        <h2>
          {getGameDisplayName(game)}
        </h2>


        <div className="recommendation-difficulty">
          {text.suggestedDifficulty}{' '}
          <strong>
            {difficulty}
          </strong>
        </div>


        <p>
          {reason}
        </p>


        <small>
          {text.basedOn}{' '}
          {recommendation.based_on_sessions}{' '}
          {recommendation.based_on_sessions === 1
            ? text.session
            : text.sessions}
          .
        </small>


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