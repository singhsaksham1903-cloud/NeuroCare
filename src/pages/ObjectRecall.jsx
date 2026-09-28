import { useEffect, useRef, useState } from 'react'

import './ObjectRecall.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import {
  savePerformanceResult,
} from '../utils/performanceStorage'


const OBJECTS = [
  '🍎',
  '☕',
  '📖',
  '🌸',
  '⭐',
  '🚗',
  '🎈',
  '🍀',
  '🐘',
  '⚽',
  '🎵',
  '🏠',
]


const LEVELS = {
  Easy: 4,
  Medium: 5,
  Hard: 6,
}


const HISTORY_KEY =
  'cognicare-object-recall-history'


function shuffleItems(items) {
  return [...items].sort(
    () => Math.random() - 0.5,
  )
}


/* --------------------------------------------
   Object Recall Icons
   -------------------------------------------- */

function ObjectRecallIcon({
  type = 'recall',
}) {
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

        <circle
          cx="23"
          cy="25"
          r="5"
          stroke="currentColor"
          strokeWidth="3.5"
        />

        <path
          d="M16 42C18 36 22 34 27 34C32 34 36 36 38 42"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        <path
          d="M40 22H46"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        <path
          d="M40 30H46"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    )
  }


  if (type === 'objects') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect
          x="12"
          y="12"
          width="17"
          height="17"
          rx="4"
          stroke="currentColor"
          strokeWidth="3.5"
        />

        <rect
          x="35"
          y="12"
          width="17"
          height="17"
          rx="4"
          stroke="currentColor"
          strokeWidth="3.5"
        />

        <rect
          x="12"
          y="35"
          width="17"
          height="17"
          rx="4"
          stroke="currentColor"
          strokeWidth="3.5"
        />

        <rect
          x="35"
          y="35"
          width="17"
          height="17"
          rx="4"
          stroke="currentColor"
          strokeWidth="3.5"
        />

        <path
          d="M20 20H21"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M43 20H44"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M20 43H21"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M43 43H44"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
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
        d="M22 17C22 13 25 10 29 10C32 10 34 11 36 13C38 11 40 10 43 10C47 10 50 13 50 17C54 18 56 21 56 25C56 29 54 32 51 34C52 36 52 38 51 41C50 45 47 48 43 48C41 48 39 47 37 46C35 49 32 51 28 51C24 51 21 49 19 46C15 47 11 44 10 40C9 36 11 33 14 31C12 29 11 27 11 24C11 20 15 17 19 17H22Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M22 24C24 22 27 22 29 24"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M36 24C39 22 42 22 44 24"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <circle
        cx="24"
        cy="31"
        r="2"
        fill="currentColor"
      />

      <circle
        cx="41"
        cy="31"
        r="2"
        fill="currentColor"
      />

      <path
        d="M26 39C29 41 34 41 38 39"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}


function ObjectRecall({
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
  onBack,
  initialDifficulty = 'Easy',
}) {
  const [difficulty, setDifficulty] =
    useState(initialDifficulty)

  const [targetObjects, setTargetObjects] =
    useState([])

  const [options, setOptions] =
    useState([])

  const [selectedObjects, setSelectedObjects] =
    useState([])


  const [phase, setPhase] =
    useState('idle')

  const [message, setMessage] =
    useState(
      text.chooseDifficulty,
    )


  const [correctSelections, setCorrectSelections] =
    useState(0)

  const [wrongSelections, setWrongSelections] =
    useState(0)

  const [timeElapsed, setTimeElapsed] =
    useState(0)

  const [timerStarted, setTimerStarted] =
    useState(false)


  const [history, setHistory] =
    useState([])


  const hasSavedResult =
    useRef(false)


  const targetCount =
    LEVELS[difficulty]


  // ==========================================
  // Load previous sessions
  // ==========================================

  useEffect(() => {
    const savedHistory =
      localStorage.getItem(
        HISTORY_KEY,
      )

    if (!savedHistory) {
      return
    }

    try {
      const parsedHistory =
        JSON.parse(savedHistory)

      if (
        Array.isArray(
          parsedHistory,
        )
      ) {
        setHistory(
          parsedHistory,
        )
      }
    } catch {
      localStorage.removeItem(
        HISTORY_KEY,
      )
    }
  }, [])


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


  // ==========================================
  // Start Game
  // ==========================================

  const startGame = () => {
    const shuffledObjects =
      shuffleItems(
        OBJECTS,
      )

    const newTargets =
      shuffledObjects.slice(
        0,
        targetCount,
      )

    const distractors =
      shuffledObjects.slice(
        targetCount,
        targetCount + 3,
      )

    const newOptions =
      shuffleItems([
        ...newTargets,
        ...distractors,
      ])


    setTargetObjects(
      newTargets,
    )

    setOptions(
      newOptions,
    )

    setSelectedObjects([])

    setCorrectSelections(0)

    setWrongSelections(0)

    setTimeElapsed(0)

    setTimerStarted(false)

    setPhase('showing')

    setMessage(
      text.rememberObjects,
    )

    hasSavedResult.current = false


    setTimeout(() => {
      setPhase('answering')

      setTimerStarted(true)

      setMessage(
        text.whichObjects,
      )
    }, 3000)
  }


  // ==========================================
  // Handle Object Click
  // ==========================================

  const handleObjectClick = (
    object,
  ) => {
    if (
      phase !== 'answering' ||
      selectedObjects.includes(
        object,
      )
    ) {
      return
    }


    const newSelectedObjects = [
      ...selectedObjects,
      object,
    ]

    setSelectedObjects(
      newSelectedObjects,
    )


    if (
      targetObjects.includes(
        object,
      )
    ) {
      setCorrectSelections(
        (currentCorrect) =>
          currentCorrect + 1,
      )

      setMessage(
        text.goodChoice,
      )


      if (
        correctSelections + 1 ===
        targetObjects.length
      ) {
        setPhase('complete')

        setTimerStarted(false)

        setMessage(
          text.excellent,
        )
      }
    } else {
      setWrongSelections(
        (currentWrong) =>
          currentWrong + 1,
      )

      setMessage(
        text.wrongObject,
      )
    }
  }


  // ==========================================
  // Accuracy
  // ==========================================

  const totalSelections =
    correctSelections +
    wrongSelections


  const accuracy =
    totalSelections === 0
      ? 0
      : Math.round(
        (correctSelections /
          totalSelections) *
        100,
      )


  const gameCompleted =
    phase === 'complete'


  // ==========================================
  // Save completed session
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
      targetCount,
      correct:
        correctSelections,
      wrong:
        wrongSelections,
      time:
        timeElapsed,
      accuracy,
    }


    savePerformanceResult({
      game: 'Object Recall',
      difficulty,
      targetCount,
      correct:
        correctSelections,
      wrong:
        wrongSelections,
      mistakes:
        wrongSelections,
      time:
        timeElapsed,
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
      HISTORY_KEY,
      JSON.stringify(
        updatedHistory,
      ),
    )


    hasSavedResult.current = true
  }, [
    gameCompleted,
    difficulty,
    targetCount,
    correctSelections,
    wrongSelections,
    timeElapsed,
    accuracy,
    history,
  ])


  // ==========================================
  // Restart
  // ==========================================

  const handleRestart = () => {
    setTargetObjects([])

    setOptions([])

    setSelectedObjects([])

    setCorrectSelections(0)

    setWrongSelections(0)

    setTimeElapsed(0)

    setTimerStarted(false)

    setPhase('idle')

    setMessage(
      text.chooseDifficulty,
    )

    hasSavedResult.current = false
  }


  // ==========================================
  // Clear History
  // ==========================================

  const handleClearHistory = () => {
    setHistory([])

    localStorage.removeItem(
      HISTORY_KEY,
    )
  }


  return (
    <div className="object-recall-page">

      {/* ======================================
          Header
          ====================================== */}

      <header className="object-recall-header">

        <button
          type="button"
          className="object-recall-back-button"
          onClick={onBack}
        >
          <span
            className="object-recall-back-icon"
            aria-hidden="true"
          >
            ←
          </span>

          {text.backToGames}
        </button>


        <div className="object-recall-heading">

          <div
            className="object-recall-heading-icon"
            aria-hidden="true"
          >
            <ObjectRecallIcon />
          </div>


          <div>

            <span className="object-recall-eyebrow">
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
          Difficulty
          ====================================== */}

      <section className="object-recall-controls">

        <div className="object-recall-controls-heading">

          <div
            className="object-recall-controls-icon"
            aria-hidden="true"
          >
            <ObjectRecallIcon
              type="objects"
            />
          </div>


          <div>

            <span className="object-recall-section-label">
              {text.selectDifficulty}
            </span>

            <h2>
              {text.selectDifficulty}
            </h2>

          </div>

        </div>


        <div className="object-difficulty-buttons">

          {Object.keys(LEVELS).map(
            (level) => (
              <button
                key={level}
                type="button"
                className={`object-difficulty-button ${difficulty === level
                    ? 'object-difficulty-button--active'
                    : ''
                  } object-difficulty-button--${level.toLowerCase()}`}
                onClick={() =>
                  setDifficulty(level)
                }
                disabled={
                  phase === 'showing' ||
                  phase === 'answering'
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
          className="object-start-button"
          onClick={startGame}
          disabled={
            phase === 'showing' ||
            phase === 'answering'
          }
        >
          <span
            className="object-start-icon"
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
          Statistics
          ====================================== */}

      <section className="object-recall-stats">

        <div className="object-recall-stat object-recall-stat--objects">

          <strong>
            {targetCount}
          </strong>

          <span>
            {text.objects}
          </span>

        </div>


        <div className="object-recall-stat object-recall-stat--correct">

          <strong>
            {correctSelections}
          </strong>

          <span>
            {text.correct}
          </span>

        </div>


        <div className="object-recall-stat object-recall-stat--wrong">

          <strong>
            {wrongSelections}
          </strong>

          <span>
            {text.wrong}
          </span>

        </div>


        <div className="object-recall-stat object-recall-stat--time">

          <strong>
            {formatTime(
              timeElapsed,
            )}
          </strong>

          <span>
            {text.time}
          </span>

        </div>


        <div className="object-recall-stat object-recall-stat--accuracy">

          <strong>
            {accuracy}%
          </strong>

          <span>
            {text.accuracy}
          </span>

        </div>

      </section>


      {/* ======================================
          Current Message
          ====================================== */}

      <div className="object-recall-message-wrap">

        <span className="object-recall-message-label">
          {text.description}
        </span>

        <p className="object-recall-message">
          {message}
        </p>

      </div>


      {/* ======================================
          Objects to Remember
          ====================================== */}

      {phase === 'showing' && (
        <section
          className="object-target-display"
          aria-label={
            text.objectsToRemember
          }
        >

          <div className="object-target-heading">

            <span>
              {text.objectsToRemember}
            </span>

            <strong>
              {targetCount}
            </strong>

          </div>


          <div className="object-target-grid">

            {targetObjects.map(
              (object, index) => (
                <div
                  className={`object-target object-target--${(
                    index % 5
                  ) + 1}`}
                  key={`${object}-${index}`}
                >
                  {object}
                </div>
              ),
            )}

          </div>

        </section>
      )}


      {/* ======================================
          Answer Choices
          ====================================== */}

      {phase === 'answering' && (
        <section
          className="object-options"
          aria-label={
            text.whichObjects
          }
        >

          <div className="object-options-heading">

            <div>

              <span>
                {text.whichObjects}
              </span>

            </div>

            <strong>
              {correctSelections} / {targetCount}
            </strong>

          </div>


          <div className="object-options-grid">

            {options.map(
              (object, index) => {

                const selected =
                  selectedObjects.includes(
                    object,
                  )

                const correct =
                  targetObjects.includes(
                    object,
                  )

                return (
                  <button
                    key={object}
                    type="button"
                    className={`object-option object-option--${(
                      index % 5
                    ) + 1} ${selected
                        ? correct
                          ? 'object-option--correct'
                          : 'object-option--wrong'
                        : ''
                      }`}
                    onClick={() =>
                      handleObjectClick(
                        object,
                      )
                    }
                    disabled={selected}
                    aria-label={
                      `${text.objectChoice} ${object}`
                    }
                  >
                    <span>
                      {object}
                    </span>

                    {selected && (
                      <span
                        className="object-selection-mark"
                        aria-hidden="true"
                      >
                        {correct
                          ? '✓'
                          : '×'}
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
        <section className="object-recall-complete">

          <div
            className="object-recall-complete-icon"
            aria-hidden="true"
          >
            <ObjectRecallIcon
              type="success"
            />
          </div>


          <span className="object-recall-complete-eyebrow">
            {text.wellDone}
          </span>

          <h2>
            {text.wellDone}
          </h2>


          <p className="object-recall-complete-description">
            {text.completedMessage(
              targetCount,
            )}
          </p>


          <div className="object-completion-grid">

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
                {text.correct}
              </span>

              <strong>
                {correctSelections}
              </strong>
            </div>


            <div>
              <span>
                {text.wrong}
              </span>

              <strong>
                {wrongSelections}
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
                {text.accuracy}
              </span>

              <strong>
                {accuracy}%
              </strong>
            </div>

          </div>


          <button
            type="button"
            className="object-start-button"
            onClick={handleRestart}
          >
            <span
              className="object-start-icon"
              aria-hidden="true"
            >
              ↻
            </span>

            {text.playAgain}
          </button>

        </section>
      )}


      {/* ======================================
          Local History
          ====================================== */}

      {history.length > 0 && (
        <section className="object-history">

          <div className="object-history-header">

            <div className="object-history-heading">

              <div
                className="object-history-icon"
                aria-hidden="true"
              >
                <ObjectRecallIcon
                  type="history"
                />
              </div>


              <div>

                <span className="object-history-eyebrow">
                  {text.previousSessions}
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
              className="object-clear-button"
              onClick={
                handleClearHistory
              }
            >
              {text.clearHistory}
            </button>

          </div>


          <div className="object-history-list">

            {history.map(
              (result) => (
                <article
                  className="object-history-item"
                  key={result.id}
                >

                  <div className="object-history-date">

                    <strong>
                      {result.date}
                    </strong>

                  </div>


                  <div className="object-history-metrics">

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
                      {text.objects}:{' '}

                      {
                        result.targetCount
                      }
                    </span>


                    <span>
                      {text.correct}:{' '}

                      {result.correct}
                    </span>


                    <span>
                      {text.wrong}:{' '}

                      {result.wrong}
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

                  </div>

                </article>
              ),
            )}

          </div>


          <p className="object-local-note">
            {text.localHistoryNote}
          </p>

        </section>
      )}

    </div>
  )
}


export default ObjectRecall