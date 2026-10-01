import { useEffect, useRef, useState } from 'react'

import './SequenceMemory.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import {
  savePerformanceResult,
} from '../utils/performanceStorage'
import {
  getUserScopedStorageKey,
} from '../utils/userStorage'


const SYMBOLS = [
  '🍎',
  '🧠',
  '🌸',
  '⭐',
  '🍀',
]


const LEVELS = {
  Easy: 3,
  Medium: 4,
  Hard: 5,
}


const HISTORY_KEY_PREFIX =
  'cognicare-sequence-memory-history'


function getHistoryKey() {
  return getUserScopedStorageKey(
    HISTORY_KEY_PREFIX,
  )
}


function shuffleItems(items) {
  return [...items].sort(
    () => Math.random() - 0.5,
  )
}


function getValidDifficulty(value) {
  return LEVELS[value]
    ? value
    : 'Easy'
}


/* --------------------------------------------
   Sequence Memory Icons
   -------------------------------------------- */

function SequenceIcon({ type = 'sequence' }) {
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

  if (type === 'history') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="11"
          y="12"
          width="42"
          height="40"
          rx="8"
          stroke="currentColor"
          strokeWidth="4"
        />

        <path
          d="M21 24H43"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M21 33H36"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M21 42H31"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <circle
          cx="43"
          cy="41"
          r="4"
          stroke="currentColor"
          strokeWidth="3"
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
      <rect
        x="10"
        y="10"
        width="44"
        height="44"
        rx="10"
        stroke="currentColor"
        strokeWidth="4"
      />

      <circle
        cx="21"
        cy="22"
        r="3.5"
        fill="currentColor"
      />

      <circle
        cx="32"
        cy="32"
        r="3.5"
        fill="currentColor"
      />

      <circle
        cx="43"
        cy="42"
        r="3.5"
        fill="currentColor"
      />

      <path
        d="M21 22L32 32L43 42"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


function SequenceMemory({
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
  onBack,
  initialDifficulty = 'Easy',
}) {
  const [difficulty, setDifficulty] =
    useState(
      getValidDifficulty(
        initialDifficulty,
      ),
    )

  const [sequence, setSequence] =
    useState([])

  const [options, setOptions] =
    useState([])

  const [userSequence, setUserSequence] =
    useState([])

  const [phase, setPhase] =
    useState('idle')


  const [message, setMessage] =
    useState(
      text.chooseDifficulty,
    )


  const [mistakes, setMistakes] =
    useState(0)

  const [timeElapsed, setTimeElapsed] =
    useState(0)

  const [timerStarted, setTimerStarted] =
    useState(false)

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


  const hasSavedResult =
    useRef(false)


  // ==========================================
  // Always guarantee a valid sequence length
  // ==========================================

  const sequenceLength =
    LEVELS[difficulty] ||
    LEVELS.Easy



  // ==========================================
  // Timer
  // ==========================================

  useEffect(() => {
    if (
      !timerStarted ||
      phase !== 'answering'
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
    phase,
  ])


  // ==========================================
  // Format Time
  // ==========================================

  const formatTime = (
    seconds,
  ) => {
    const safeSeconds =
      Number.isFinite(
        Number(seconds),
      )
        ? Number(seconds)
        : 0

    const minutes =
      Math.floor(
        safeSeconds / 60,
      )

    const remainingSeconds =
      safeSeconds % 60

    return `${String(
      minutes,
    ).padStart(2, '0')}:${String(
      remainingSeconds,
    ).padStart(2, '0')}`
  }


  // ==========================================
  // Start Game
  // ==========================================

  const startGame = () => {
    const newSequence =
      shuffleItems(SYMBOLS).slice(
        0,
        sequenceLength,
      )

    const shuffledOptions =
      shuffleItems(
        newSequence,
      )

    setSequence(
      newSequence,
    )

    setOptions(
      shuffledOptions,
    )

    setUserSequence([])

    setMistakes(0)

    setTimeElapsed(0)

    setTimerStarted(false)

    setPhase('showing')

    setMessage(
      text.rememberSequence,
    )

    hasSavedResult.current = false


    setTimeout(() => {
      setPhase('answering')

      setTimerStarted(true)

      setMessage(
        text.selectSameOrder,
      )
    }, 2500)
  }


  // ==========================================
  // Handle Option Click
  // ==========================================

  const handleOptionClick = (
    symbol,
  ) => {
    if (
      phase !== 'answering'
    ) {
      return
    }

    const nextIndex =
      userSequence.length

    const correctSymbol =
      sequence[nextIndex]

    if (
      symbol !== correctSymbol
    ) {
      setMistakes(
        (currentMistakes) =>
          currentMistakes + 1,
      )

      setMessage(
        text.notQuite,
      )

      return
    }


    const updatedSequence = [
      ...userSequence,
      symbol,
    ]

    setUserSequence(
      updatedSequence,
    )


    if (
      updatedSequence.length ===
      sequence.length
    ) {
      setPhase('complete')

      setTimerStarted(false)

      setMessage(
        text.excellent,
      )
    }
  }


  /*
   * Accuracy:
   * Correct selections = sequenceLength
   * Total attempts = correct selections + mistakes
   *
   * Example:
   * 3 items, 0 mistakes = 100%
   * 3 items, 1 mistake  = 75%
   * 3 items, 2 mistakes = 60%
   */

  const totalAttempts =
    sequenceLength +
    mistakes


  const accuracy =
    Number.isFinite(
      totalAttempts,
    ) &&
      totalAttempts > 0
      ? Math.round(
        (sequenceLength /
          totalAttempts) *
        100,
      )
      : 0


  const safeAccuracy =
    Number.isFinite(
      accuracy,
    )
      ? accuracy
      : 0


  const gameCompleted =
    phase === 'complete'


  // ==========================================
  // Save completed game
  // ==========================================

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
      difficulty,
      sequenceLength,
      mistakes,
      time: timeElapsed,
      accuracy: safeAccuracy,
    }


    savePerformanceResult({
      game: 'Sequence Memory',
      difficulty,
      sequenceLength,
      mistakes,
      time: timeElapsed,
      accuracy: safeAccuracy,
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
    difficulty,
    sequenceLength,
    mistakes,
    timeElapsed,
    safeAccuracy,
    history,
  ])


  // ==========================================
  // Clear History
  // ==========================================

  const handleClearHistory = () => {
    setHistory([])

    localStorage.removeItem(
      getHistoryKey(),
    )
  }


  return (
    <div className="sequence-memory-page">

      {/* ======================================
          Header
          ====================================== */}

      <header className="sequence-header">

        <button
          type="button"
          className="sequence-back-button"
          onClick={onBack}
        >
          <span
            className="sequence-back-icon"
            aria-hidden="true"
          >
            ←
          </span>

          {text.backToGames}
        </button>


        <div className="sequence-heading">

          <div
            className="sequence-heading-icon"
            aria-hidden="true"
          >
            <SequenceIcon />
          </div>


          <div>

            <span className="sequence-eyebrow">
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


      {/* ======================================
          Difficulty & Start
          ====================================== */}

      <section className="sequence-controls">

        <div className="sequence-controls-heading">

          <div
            className="sequence-controls-icon"
            aria-hidden="true"
          >
            <SequenceIcon />
          </div>

          <div>

            <span className="sequence-section-label">
              Choose your level
            </span>

            <h2>
              {text.selectDifficulty}
            </h2>

          </div>

        </div>


        <div className="difficulty-buttons">

          {Object.keys(LEVELS).map(
            (level) => (
              <button
                key={level}
                type="button"
                className={`difficulty-button ${
                  difficulty === level
                    ? 'difficulty-button--active'
                    : ''
                } difficulty-button--${level.toLowerCase()}`}
                onClick={() =>
                  setDifficulty(
                    level,
                  )
                }
                disabled={
                  phase ===
                    'showing' ||
                  phase ===
                    'answering'
                }
              >
                {
                  text.difficulties[
                    level
                  ]
                }
              </button>
            ),
          )}

        </div>


        <button
          type="button"
          className="start-sequence-button"
          onClick={startGame}
          disabled={
            phase === 'showing' ||
            phase === 'answering'
          }
        >
          <span
            className="start-sequence-icon"
            aria-hidden="true"
          >
            ▶
          </span>

          {phase === 'complete'
            ? text.playAgain
            : text.startGame}
        </button>

      </section>


      {/* ======================================
          Current Statistics
          ====================================== */}

      <section className="sequence-stats">

        <div className="sequence-stat sequence-stat--items">

          <strong>
            {sequenceLength}
          </strong>

          <span>
            {text.items}
          </span>

        </div>


        <div className="sequence-stat sequence-stat--mistakes">

          <strong>
            {mistakes}
          </strong>

          <span>
            {text.mistakes}
          </span>

        </div>


        <div className="sequence-stat sequence-stat--time">

          <strong>
            {formatTime(
              timeElapsed,
            )}
          </strong>

          <span>
            {text.time}
          </span>

        </div>


        <div className="sequence-stat sequence-stat--accuracy">

          <strong>
            {safeAccuracy}%
          </strong>

          <span>
            {text.accuracy}
          </span>

        </div>

      </section>


      {/* ======================================
          Current Message
          ====================================== */}

      <div className="sequence-message-wrap">

        <span className="sequence-message-label">
          Game status
        </span>

        <p className="sequence-message">
          {message}
        </p>

      </div>


      {/* ======================================
          Sequence to Remember
          ====================================== */}

      {phase === 'showing' && (
        <section
          className="sequence-display"
          aria-label={
            text.sequenceToRemember
          }
        >

          <div className="sequence-display-heading">

            <span>
              Remember this order
            </span>

            <strong>
              {sequenceLength} items
            </strong>

          </div>


          <div className="sequence-display-items">

            {sequence.map(
              (symbol, index) => (
                <div
                  className={`sequence-symbol sequence-symbol--large sequence-symbol--color-${index + 1}`}
                  key={`${symbol}-${index}`}
                >
                  <span className="sequence-symbol-number">
                    {index + 1}
                  </span>

                  <span className="sequence-symbol-value">
                    {symbol}
                  </span>

                </div>
              ),
            )}

          </div>

        </section>
      )}


      {/* ======================================
          Answer Buttons
          ====================================== */}

      {phase === 'answering' && (
        <section
          className="sequence-options"
          aria-label={
            text.sequenceChoices
          }
        >

          <div className="sequence-options-heading">

            <span>
              Your turn
            </span>

            <strong>
              {userSequence.length} / {sequence.length}
            </strong>

          </div>


          <div className="sequence-options-grid">

            {options.map(
              (symbol, index) => {

                const alreadySelected =
                  userSequence.includes(
                    symbol,
                  )

                return (
                  <button
                    key={symbol}
                    type="button"
                    className={`sequence-symbol sequence-symbol--option sequence-symbol--color-${index + 1} ${
                      alreadySelected
                        ? 'sequence-symbol--selected'
                        : ''
                    }`}
                    onClick={() =>
                      handleOptionClick(
                        symbol,
                      )
                    }
                    disabled={
                      alreadySelected
                    }
                  >
                    <span className="sequence-symbol-value">
                      {symbol}
                    </span>

                    {alreadySelected && (
                      <span className="sequence-selected-mark">
                        ✓
                      </span>
                    )}

                  </button>
                )
              },
            )}

          </div>

        </section>
      )}


      {/* ======================================
          Completion
          ====================================== */}

      {gameCompleted && (
        <section className="sequence-complete">

          <div
            className="sequence-complete-icon"
            aria-hidden="true"
          >
            <SequenceIcon
              type="success"
            />
          </div>


          <span className="sequence-complete-eyebrow">
            Game completed
          </span>

          <h2>
            {text.wellDone}
          </h2>


          <p className="sequence-complete-description">
            {text.completeDescription}
          </p>


          <div className="sequence-completion-grid">

            <div>
              <span>
                {text.difficulty}
              </span>

              <strong>
                {
                  text.difficulties[
                    difficulty
                  ]
                }
              </strong>
            </div>


            <div>
              <span>
                {text.time}
              </span>

              <strong>
                {formatTime(
                  timeElapsed,
                )}
              </strong>
            </div>


            <div>
              <span>
                {text.mistakes}
              </span>

              <strong>
                {mistakes}
              </strong>
            </div>


            <div>
              <span>
                {text.accuracy}
              </span>

              <strong>
                {safeAccuracy}%
              </strong>
            </div>

          </div>

        </section>
      )}


      {/* ======================================
          History
          ====================================== */}

      {history.length > 0 && (
        <section className="sequence-history">

          <div className="sequence-history-header">

            <div className="sequence-history-heading">

              <div
                className="sequence-history-icon"
                aria-hidden="true"
              >
                <SequenceIcon
                  type="history"
                />
              </div>


              <div>

                <span className="sequence-history-eyebrow">
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
              className="sequence-clear-button"
              onClick={
                handleClearHistory
              }
            >
              {text.clearHistory}
            </button>

          </div>


          <div className="sequence-history-list">

            {history.map(
              (result) => (
                <article
                  className="sequence-history-item"
                  key={result.id}
                >

                  <div className="sequence-history-date">

                    <strong>
                      {result.date}
                    </strong>

                  </div>


                  <div className="sequence-history-metrics">

                    <span>
                      {text.difficulty}:{' '}

                      {
                        text.difficulties[
                          result.difficulty
                        ] ||
                        result.difficulty
                      }
                    </span>


                    <span>
                      {text.items}:{' '}

                      {
                        result.sequenceLength
                      }
                    </span>


                    <span>
                      {text.accuracy}:{' '}

                      {result.accuracy}%
                    </span>


                    <span>
                      {text.mistakes}:{' '}

                      {result.mistakes}
                    </span>


                    <span>
                      {text.time}:{' '}

                      {formatTime(
                        result.time,
                      )}
                    </span>

                  </div>

                </article>
              ),
            )}

          </div>


          <p className="sequence-local-note">
            {text.localHistoryNote}
          </p>

        </section>
      )}

    </div>
  )
}


export default SequenceMemory