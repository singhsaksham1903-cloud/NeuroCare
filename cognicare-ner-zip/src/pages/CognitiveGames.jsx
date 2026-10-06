import { useEffect, useState } from 'react'

import './CognitiveGames.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import MemoryMatch from './MemoryMatch'
import SequenceMemory from './SequenceMemory'
import ObjectRecall from './ObjectRecall'


// ============================================
// Game Visual
// ============================================

function GameVisual({ gameId }) {
    if (gameId === 'memory-match') {
        return (
            <svg
                viewBox="0 0 120 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <rect
                    x="18"
                    y="18"
                    width="36"
                    height="42"
                    rx="8"
                    stroke="currentColor"
                    strokeWidth="3"
                />
                <rect
                    x="66"
                    y="18"
                    width="36"
                    height="42"
                    rx="8"
                    stroke="currentColor"
                    strokeWidth="3"
                />
                <path
                    d="M30 39L36 45L44 34"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M77 38C77 33.6 80.6 30 85 30C89.4 30 93 33.6 93 38"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <path
                    d="M82 44H88"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <path
                    d="M28 75H92"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </svg>
        )
    }

    if (gameId === 'sequence-memory') {
        return (
            <svg
                viewBox="0 0 120 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <circle
                    cx="30"
                    cy="35"
                    r="13"
                    stroke="currentColor"
                    strokeWidth="3"
                />
                <circle
                    cx="60"
                    cy="35"
                    r="13"
                    stroke="currentColor"
                    strokeWidth="3"
                />
                <circle
                    cx="90"
                    cy="35"
                    r="13"
                    stroke="currentColor"
                    strokeWidth="3"
                />
                <path
                    d="M44 35H46"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <path
                    d="M74 35H76"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
                <path
                    d="M29 65L36 72L50 58"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M57 73H91"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </svg>
        )
    }

    return (
        <svg
            viewBox="0 0 120 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <rect
                x="16"
                y="24"
                width="88"
                height="56"
                rx="12"
                stroke="currentColor"
                strokeWidth="3"
            />
            <circle
                cx="39"
                cy="46"
                r="8"
                stroke="currentColor"
                strokeWidth="3"
            />
            <path
                d="M28 69C31 61 37 58 44 58C51 58 57 61 60 69"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M72 41H91"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M72 54H91"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M72 67H84"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    )
}


// ============================================
// Game Card Component
// ============================================

function GameCard({
    id,
    title,
    description,
    buttonLabel,
    onClick,
}) {
    const isAvailable = Boolean(onClick)

    return (
        <article className="game-card">

            <div className="game-card-visual">
                <GameVisual gameId={id} />
            </div>

            <div className="game-card-content">

                <span className="game-card-number">
                    {id === 'memory-match'
                        ? '01'
                        : id === 'sequence-memory'
                            ? '02'
                            : '03'}
                </span>

                <h2 className="game-card-title">
                    {title}
                </h2>

                <p className="game-card-description">
                    {description}
                </p>

                <button
                    type="button"
                    className={`game-card-button${
                        isAvailable
                            ? ''
                            : ' game-card-button--disabled'
                    }`}
                    disabled={!isAvailable}
                    onClick={onClick}
                    aria-label={`${title} — ${buttonLabel}`}
                >
                    <span>
                        {buttonLabel}
                    </span>

                    <span
                        className="game-card-button-arrow"
                        aria-hidden="true"
                    >
                        →
                    </span>
                </button>

            </div>

        </article>
    )
}


// ============================================
// Cognitive Games Page
// ============================================

function CognitiveGames({
    text,
    memoryMatchText,
    sequenceMemoryText,
    objectRecallText,
    language = 'en-IN',
    readAloudLabel = 'Read Aloud',
    stopReadingLabel = 'Stop Reading',
    onNavigate,
    initialGame = null,
    initialDifficulty = null,
}) {
    const [selectedGame, setSelectedGame] =
        useState(initialGame)

    useEffect(() => {
        if (initialGame) {
            setSelectedGame(initialGame)
        }
    }, [initialGame])


    // ==========================================
    // Open Memory Match
    // ==========================================

    if (
        selectedGame === 'memory-match'
    ) {
        return (
            <MemoryMatch
                text={memoryMatchText}
                language={language}
                readAloudLabel={readAloudLabel}
                stopReadingLabel={stopReadingLabel}
                onBack={() => setSelectedGame(null)}
            />
        )
    }


    // ==========================================
    // Open Sequence Memory
    // ==========================================

    if (
        selectedGame === 'sequence-memory'
    ) {
        return (
            <SequenceMemory
                text={sequenceMemoryText}
                language={language}
                readAloudLabel={readAloudLabel}
                stopReadingLabel={stopReadingLabel}
                initialDifficulty={
                    initialDifficulty || 'Easy'
                }
                onBack={() =>
                    setSelectedGame(null)
                }
            />
        )
    }


    // ==========================================
    // Open Object Recall
    // ==========================================

    if (
        selectedGame === 'object-recall'
    ) {
        return (
            <ObjectRecall
                text={objectRecallText}
                language={language}
                readAloudLabel={readAloudLabel}
                stopReadingLabel={stopReadingLabel}
                initialDifficulty={
                    initialDifficulty || 'Easy'
                }
                onBack={() =>
                    setSelectedGame(null)
                }
            />
        )
    }


    // ==========================================
    // Game Card Click Handler
    // ==========================================

    const handleGameClick = (
        gameId,
    ) => {
        setSelectedGame(gameId)
    }


    return (
        <div className="games-page">

            {/* Back */}

            <button
                type="button"
                className="back-button"
                onClick={() =>
                    onNavigate('dashboard')
                }
            >
                <span aria-hidden="true">
                    ←
                </span>

                {text.backButton}
            </button>


            {/* Header */}

            <header className="games-header">

                <div className="games-header-visual">
                    <svg
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                    >
                        <circle
                            cx="50"
                            cy="50"
                            r="38"
                            stroke="currentColor"
                            strokeWidth="3"
                        />

                        <path
                            d="M35 47C35 39.3 41.3 33 49 33H53C60.7 33 67 39.3 67 47V51C67 58.7 60.7 65 53 65H49C41.3 65 35 58.7 35 51V47Z"
                            stroke="currentColor"
                            strokeWidth="3"
                        />

                        <path
                            d="M43 43H43.01"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                        />

                        <path
                            d="M57 43H57.01"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                        />

                        <path
                            d="M43 55C46 58 54 58 57 55"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />

                        <path
                            d="M71 28L74 35L81 38L74 41L71 48L68 41L61 38L68 35L71 28Z"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <div className="games-header-content">

                    <span className="games-eyebrow">
                        {text.title}
                    </span>

                    <h1 className="games-title">
                        {text.title}
                    </h1>

                    <p className="games-subtitle">
                        {text.subtitle}
                    </p>

                    <VoiceReadAloud
                        text={`${text.title}. ${text.subtitle}`}
                        language={language}
                        label={readAloudLabel}
                        stopLabel={stopReadingLabel}
                    />

                </div>

            </header>


            {/* Game Cards */}

            <main className="games-grid">

                {text.games.map(
                    (game) => (
                        <GameCard
                            key={game.id}
                            id={game.id}
                            title={game.title}
                            description={
                                game.description
                            }
                            buttonLabel={
                                game.button
                            }
                            onClick={() =>
                                handleGameClick(
                                    game.id,
                                )
                            }
                        />
                    ),
                )}

            </main>

        </div>
    )
}


export default CognitiveGames