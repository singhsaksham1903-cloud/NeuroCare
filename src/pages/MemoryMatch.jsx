import { useEffect, useRef, useState } from 'react'

import './MemoryMatch.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import {
  savePerformanceResult,
} from '../utils/performanceStorage'
import {
  getUserScopedStorageKey,
} from '../utils/userStorage'


const CARD_VALUES = [
  '🍎',
  '🧠',
  '🌸',
  '⭐',
]

const HISTORY_KEY_PREFIX =
  'cognicare-memory-match-history'


function getHistoryKey() {
  return getUserScopedStorageKey(
    HISTORY_KEY_PREFIX,
  )
}


/* --------------------------------------------
   Memory Match Icons
   -------------------------------------------- */

function MemoryMatchIcon({ type = 'brain' }) {
  if (type === 'history') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M13 15H51"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M18 15V48H46V15"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        <path
          d="M25 25L30 21L35 26L42 20"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M25 37H39"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'success') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r="23"
          stroke="currentColor"
          strokeWidth="4"
        />

        <path
          d="M21 32.5L28 39L43 24"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22 18C17 18 13 22 13 27C13 30 14 32 16 34C13 36 12 39 13 42C14 47 19 50 24 48C26 52 31 54 35 51C38 54 44 53 46 48C51 48 55 44 54 39C54 36 52 34 50 32C52 30 53 27 52 24C51 19 46 16 42 17C39 12 33 11 29 14C27 16 25 18 22 18Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M29 24C26 25 25 28 26 31"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M38 22C41 23 42 26 41 29"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M31 38C34 40 38 39 40 36"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <circle
        cx="24"
        cy="34"
        r="2"
        fill="currentColor"
      />

      <circle
        cx="44"
        cy="34"
        r="2"
        fill="currentColor"
      />
    </svg>
  )
}


function MemoryMatch({
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
  onBack,
}) {
  const [cards, setCards] =
    useState(shuffleCards)

  const [flipped, setFlipped] =
    useState([])

  const [matched, setMatched] =
    useState([])

  const [moves, setMoves] =
    useState(0)

  const [busy, setBusy] =
    useState(false)

  // Performance tracking

  const [timeElapsed, setTimeElapsed] =
    useState(0)

  const [timerStarted, setTimerStarted] =
    useState(false)

  // Local history

  const [history, setHistory] =
    useState(() => {
      const historyKey = getHistoryKey()

      if (!historyKey) {
        return []
      }

      const savedHistory =
        localStorage.getItem(historyKey)

      if (!savedHistory) {
        return []
      }

      try {
        const parsedHistory =
          JSON.parse(savedHistory)

        return Array.isArray(parsedHistory)
          ? parsedHistory
          : []
      } catch {
        localStorage.removeItem(historyKey)
        return []
      }
    })

  // Prevent the same completed
  // game from being saved twice

  const hasSavedResult =
    useRef(false)


  // Start and stop timer

  useEffect(() => {
    if (
      !timerStarted ||
      matched.length ===
      cards.length
    ) {
      return undefined
    }

    const timer = setInterval(
      () => {
        setTimeElapsed(
          (currentTime) =>
            currentTime + 1,
        )
      },
      1000,
    )

    return () =>
      clearInterval(timer)
  }, [
    timerStarted,
    matched.length,
    cards.length,
  ])


  const matchedPairs =
    matched.length / 2

  const mistakes =
    Math.max(
      moves - matchedPairs,
      0,
    )

  const accuracy =
    moves === 0
      ? 0
      : Math.round(
        (matchedPairs / moves) *
        100,
      )

  const gameCompleted =
    matched.length ===
    cards.length


  // Save completed game
  // to local history

  useEffect(() => {
    if (
      !gameCompleted ||
      hasSavedResult.current
    ) {
      return
    }

    const result = {
      id: Date.now(),
      date:
        new Date().toLocaleString(),
      moves,
      matches: matchedPairs,
      mistakes,
      time: timeElapsed,
      accuracy,
    }

    savePerformanceResult({
      game: 'Memory Match',
      difficulty: 'Standard',
      moves,
      matches: matchedPairs,
      mistakes,
      time: timeElapsed,
      accuracy,
      completed: true,
    })

    const updatedHistory = [
      result,
      ...history,
    ].slice(0, 10)

    setHistory(
      updatedHistory,
    )

    localStorage.setItem(
      getHistoryKey(),
      JSON.stringify(
        updatedHistory,
      ),
    )

    hasSavedResult.current = true
  }, [
    gameCompleted,
    moves,
    matchedPairs,
    mistakes,
    timeElapsed,
    accuracy,
    history,
  ])


  const handleCardClick = (
    index,
  ) => {
    if (
      busy ||
      flipped.includes(index) ||
      matched.includes(index) ||
      flipped.length === 2
    ) {
      return
    }

    if (!timerStarted) {
      setTimerStarted(true)
    }

    const newFlipped = [
      ...flipped,
      index,
    ]

    setFlipped(newFlipped)

    if (
      newFlipped.length === 2
    ) {
      setMoves(
        (currentMoves) =>
          currentMoves + 1,
      )

      const firstIndex =
        newFlipped[0]

      const secondIndex =
        newFlipped[1]

      if (
        cards[firstIndex].value ===
        cards[secondIndex].value
      ) {
        setMatched(
          (currentMatched) => [
            ...currentMatched,
            firstIndex,
            secondIndex,
          ],
        )

        setFlipped([])
      } else {
        setBusy(true)

        setTimeout(() => {
          setFlipped([])
          setBusy(false)
        }, 1000)
      }
    }
  }


  const handleRestart = () => {
    setCards(shuffleCards())
    setFlipped([])
    setMatched([])
    setMoves(0)
    setBusy(false)
    setTimeElapsed(0)
    setTimerStarted(false)
    hasSavedResult.current = false
  }


  const handleClearHistory = () => {
    setHistory([])
    localStorage.removeItem(
      getHistoryKey(),
    )
  }


  const formatTime = (
    seconds,
  ) => {
    const minutes =
      Math.floor(seconds / 60)

    const remainingSeconds =
      seconds % 60

    return `${String(
      minutes,
    ).padStart(2, '0')}:${String(
      remainingSeconds,
    ).padStart(2, '0')}`
  }


  return (
    <div className="memory-match-page">

      {/* ----------------------------------------
          Header
          ---------------------------------------- */}

      <header className="memory-match-header">

        <button
          type="button"
          className="memory-back-button"
          onClick={onBack}
        >
          <span
            className="memory-back-icon"
            aria-hidden="true"
          >
            ←
          </span>

          {text.backToGames}
        </button>


        <div className="memory-match-heading">

          <div
            className="memory-match-heading-icon"
            aria-hidden="true"
          >
            <MemoryMatchIcon />
          </div>


          <div>

            <span className="memory-match-eyebrow">
              Cognitive Game
            </span>

            <h1>
              {text.title}
            </h1>

            <p>
              {text.description}
            </p>

          </div>

        </div>


        <VoiceReadAloud
          text={`${text.title}. ${text.description}`}
          language={language}
          label={readAloudLabel}
          stopLabel={stopReadingLabel}
        />

      </header>


      {/* ----------------------------------------
          Current Game Statistics
          ---------------------------------------- */}

      <section
        className="memory-stats"
        aria-label={
          text.gameStatistics
        }
      >

        <div className="memory-stat memory-stat--moves">

          <strong>
            {moves}
          </strong>

          <span>
            {text.moves}
          </span>

        </div>


        <div className="memory-stat memory-stat--matches">

          <strong>
            {matchedPairs}
          </strong>

          <span>
            {text.matches}
          </span>

        </div>


        <div className="memory-stat memory-stat--mistakes">

          <strong>
            {mistakes}
          </strong>

          <span>
            {text.mistakes}
          </span>

        </div>


        <div className="memory-stat memory-stat--time">

          <strong>
            {formatTime(
              timeElapsed,
            )}
          </strong>

          <span>
            {text.time}
          </span>

        </div>


        <div className="memory-stat memory-stat--accuracy">

          <strong>
            {accuracy}%
          </strong>

          <span>
            {text.accuracy}
          </span>

        </div>

      </section>


      {/* ----------------------------------------
          Game Board
          ---------------------------------------- */}

      <main
        className="memory-board"
        aria-label={
          text.gameBoard
        }
      >

        {cards.map(
          (card, index) => {

            const isFlipped =
              flipped.includes(
                index,
              )

            const isMatched =
              matched.includes(
                index,
              )

            return (
              <button
                key={card.id}
                type="button"
                className={`memory-card ${isFlipped ||
                  isMatched
                  ? 'memory-card--visible'
                  : ''
                  } ${isMatched
                    ? 'memory-card--matched'
                    : ''
                  }`}
                onClick={() =>
                  handleCardClick(
                    index,
                  )
                }
                aria-label={
                  isFlipped ||
                    isMatched
                    ? `${text.cardShowing} ${card.value}`
                    : text.hiddenCard
                }
              >
                <span>
                  {isFlipped ||
                    isMatched
                    ? card.value
                    : '?'}
                </span>
              </button>
            )
          },
        )}

      </main>


      {/* ----------------------------------------
          Completion Summary
          ---------------------------------------- */}

      {gameCompleted && (
        <section className="memory-complete">

          <div
            className="memory-complete-icon"
            aria-hidden="true"
          >
            <MemoryMatchIcon
              type="success"
            />
          </div>


          <span className="memory-complete-eyebrow">
            Game completed
          </span>

          <h2>
            {text.wellDone}
          </h2>


          <p>
            {text.completedMessage(
              moves,
            )}
          </p>


          <div className="completion-summary">

            <p>
              <strong>
                {text.time}:
              </strong>{' '}

              {formatTime(
                timeElapsed,
              )}
            </p>


            <p>
              <strong>
                {text.accuracy}:
              </strong>{' '}

              {accuracy}%
            </p>


            <p>
              <strong>
                {text.mistakes}:
              </strong>{' '}

              {mistakes}
            </p>

          </div>


          <button
            type="button"
            className="memory-restart-button"
            onClick={handleRestart}
          >
            {text.playAgain}
          </button>

        </section>
      )}


      {!gameCompleted && (
        <button
          type="button"
          className="memory-restart-button"
          onClick={handleRestart}
        >
          {text.restartGame}
        </button>
      )}


      {/* ----------------------------------------
          Previous Game History
          ---------------------------------------- */}

      {history.length > 0 && (
        <section className="memory-history">

          <div className="memory-history-header">

            <div className="memory-history-heading">

              <div
                className="memory-history-icon"
                aria-hidden="true"
              >
                <MemoryMatchIcon
                  type="history"
                />
              </div>


              <div>

                <span className="memory-history-eyebrow">
                  Your progress
                </span>

                <h2>
                  {text.previousSessions}
                </h2>

                <p>
                  {text.recentResults}
                </p>

              </div>

            </div>


            <button
              type="button"
              className="memory-clear-button"
              onClick={
                handleClearHistory
              }
            >
              {text.clearHistory}
            </button>

          </div>


          <div className="memory-history-list">

            {history.map(
              (result) => (
                <article
                  className="memory-history-item"
                  key={result.id}
                >

                  <div className="memory-history-date">

                    <strong>
                      {result.date}
                    </strong>

                  </div>


                  <div className="memory-history-metrics">

                    <span>
                      {text.moves}:{' '}
                      {result.moves}
                    </span>

                    <span>
                      {text.accuracy}:{' '}
                      {result.accuracy}%
                    </span>

                    <span>
                      {text.time}:{' '}
                      {formatTime(
                        result.time,
                      )}
                    </span>

                    <span>
                      {text.mistakes}:{' '}
                      {result.mistakes}
                    </span>

                  </div>

                </article>
              ),
            )}

          </div>


          <p className="memory-local-note">
            {text.localHistoryNote}
          </p>

        </section>
      )}

    </div>
  )
}


export default MemoryMatch


/* --------------------------------------------
   Card shuffle helper
   -------------------------------------------- */

function shuffleCards() {
  const cards = [
    ...CARD_VALUES,
    ...CARD_VALUES,
  ]

  for (
    let i = cards.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1),
    )

      ;[cards[i], cards[j]] = [
        cards[j],
        cards[i],
      ]
  }

  return cards.map(
    (value, index) => ({
      id: index,
      value,
    }),
  )
}