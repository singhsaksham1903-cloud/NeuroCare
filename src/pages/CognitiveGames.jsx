import { useState } from 'react'

import './CognitiveGames.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import MemoryMatch from './MemoryMatch'
import SequenceMemory from './SequenceMemory'
import ObjectRecall from './ObjectRecall'
import PersonalMemoryRecall from './PersonalMemoryRecall'
import NERCulturalRecall from './NERCulturalRecall'
import {
    getAdaptiveDifficulty,
} from '../utils/adaptiveDifficulty'


// ============================================
// Game Visual
// ============================================

function GameVisual({ gameId }) {
    if (gameId === 'ner-cultural-recall') {
        return (
            <svg
                viewBox="0 0 120 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <circle
                    cx="60"
                    cy="48"
                    r="30"
                    stroke="currentColor"
                    strokeWidth="3"
                />

                <path
                    d="M38 48H82"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                <path
                    d="M60 18C50 28 46 38 46 48C46 58 50 68 60 78"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                <path
                    d="M60 18C70 28 74 38 74 48C74 58 70 68 60 78"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                <path
                    d="M33 35C41 28 50 25 60 25C70 25 79 28 87 35"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                <path
                    d="M33 61C41 68 50 71 60 71C70 71 79 68 87 61"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                <path
                    d="M91 15L94 22L101 25L94 28L91 35L88 28L81 25L88 22L91 15Z"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                />
            </svg>
        )
    }

    if (gameId === 'personal-memory') {
        return (
            <svg
                viewBox="0 0 120 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <circle
                    cx="60"
                    cy="48"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="3"
                />

                <path
                    d="M48 47C48 40 53 35 60 35C67 35 72 40 72 47V52C72 59 67 64 60 64C53 64 48 59 48 52V47Z"
                    stroke="currentColor"
                    strokeWidth="3"
                />

                <circle
                    cx="54"
                    cy="47"
                    r="2"
                    fill="currentColor"
                />

                <circle
                    cx="66"
                    cy="47"
                    r="2"
                    fill="currentColor"
                />

                <path
                    d="M54 56C57 59 63 59 66 56"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                <path
                    d="M82 20L85 27L92 30L85 33L82 40L79 33L72 30L79 27L82 20Z"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                />
            </svg>
        )
    }

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
    number,
}) {
    const isAvailable = Boolean(onClick)

    return (
        <article className="game-card">

            <div className="game-card-visual">
                <GameVisual gameId={id} />
            </div>

            <div className="game-card-content">

                <span className="game-card-number">
                    {String(number).padStart(2, '0')}
                </span>
                <h2 className="game-card-title">
                    {title}
                </h2>

                <p className="game-card-description">
                    {description}
                </p>

                <button
                    type="button"
                    className={`game-card-button${isAvailable
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
    personalMemoryText,
    language = 'en-IN',
    readAloudLabel = 'Read Aloud',
    stopReadingLabel = 'Stop Reading',
    onNavigate,
    initialGame = null,
    initialDifficulty = null,
}) {
    const [selectedGame, setSelectedGame] =
        useState(initialGame)

    const [launchDifficulty, setLaunchDifficulty] =
        useState(initialDifficulty)



    // ==========================================
    // Open Personal Memory Recall
    // ==========================================

    if (
        selectedGame === 'personal-memory'
    ) {
        return (
            <PersonalMemoryRecall
                text={personalMemoryText}
                language={language}
                readAloudLabel={
                    readAloudLabel
                }
                stopReadingLabel={
                    stopReadingLabel
                }
                onBack={() =>
                    setSelectedGame(null)
                }
            />
        )
    }
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
                    launchDifficulty || 'Easy'
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
                    launchDifficulty || 'Easy'
                }
                onBack={() =>
                    setSelectedGame(null)
                }
            />
        )
    }
    // ==========================================
    // Open NER Cultural Recall
    // ==========================================

    if (
        selectedGame === 'ner-cultural-recall'
    ) {
        return (
            <NERCulturalRecall
                language={language}
                readAloudLabel={
                    readAloudLabel
                }
                stopReadingLabel={
                    stopReadingLabel
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

        // --------------------------------------------------------
        // Direct launch:
        // automatically determine difficulty from recent history.
        // --------------------------------------------------------

        if (
            gameId ===
            'sequence-memory'
        ) {
            const adaptive =
                getAdaptiveDifficulty(
                    'Sequence Memory',
                )

            setLaunchDifficulty(
                adaptive.difficulty,
            )
        }


        if (
            gameId ===
            'object-recall'
        ) {
            const adaptive =
                getAdaptiveDifficulty(
                    'Object Recall',
                )

            setLaunchDifficulty(
                adaptive.difficulty,
            )
        }


        // Memory Match has one fixed level.

        if (
            gameId ===
            'memory-match'
        ) {
            setLaunchDifficulty(
                'Standard',
            )
        }


        // Personal Memory Recall
        // has its own Personalized level.

        if (
            gameId ===
            'personal-memory'
        ) {
            setLaunchDifficulty(
                'Personalized',
            )
        }


        setSelectedGame(
            gameId,
        )
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
                    (game, index) => (
                        <GameCard
                            key={game.id}
                            id={game.id}
                            number={index + 1}
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
                <GameCard
                    id="personal-memory"
                    number={text.games.length + 1}
                    title={
                        personalMemoryText?.cardTitle ||
                        'Personal Memory Recall'
                    }
                    description={
                        personalMemoryText?.cardDescription ||
                        'Use your own saved memories to practice recall and recognition.'
                    }
                    buttonLabel={
                        personalMemoryText?.cardButton ||
                        'Start Activity'
                    }
                    onClick={() =>
                        handleGameClick(
                            'personal-memory',
                        )
                    }
                />

            </main>

        </div>
    )
}


export default CognitiveGames