import {
    useEffect,
    useState,
} from 'react'

import './PersonalMemoryRecall.css'

import VoiceReadAloud from '../Components/VoiceReadAloud'
import VoiceInput from '../Components/VoiceInput'

import {
    apiGet,
} from '../utils/api'

import {
    savePerformanceResult,
} from '../utils/performanceStorage'


// ============================================================
// Default UI text
// ============================================================

const DEFAULT_TEXT = {
    backToGames:
        'Back to Games',

    eyebrow:
        'Personalized Activity',

    title:
        'Personal Memory Recall',

    description:
        'Use your own saved memories to exercise recall and recognition.',

    loading:
        'Loading your saved memories...',

    noMemoriesTitle:
        'No memories available yet.',

    noMemoriesDescription:
        'Save at least one memory in your Memory Vault before starting this activity.',

    goBack:
        'Back to Games',

    startActivity:
        'Start Activity',

    studyLabel:
        'Remember this story',

    studyInstruction:
        'Read the memory carefully. Take your time.',

    iRemember:
        'I Remember',

    questionLabel:
        'Recall the memory',

    recallQuestion:
        'Which saved memory does this story belong to?',

    categoryQuestion:
        'Which category was this memory saved under?',

    correct:
        'Correct!',

    incorrect:
        'Not quite. Let us continue.',

    next:
        'Next Memory',

    finish:
        'Finish Activity',

    wellDone:
        'Well done!',

    completionMessage:
        'You completed your personalized memory activity.',

    rounds:
        'Rounds',

    correctAnswers:
        'Correct',

    wrongAnswers:
        'Wrong',

    accuracy:
        'Accuracy',

    time:
        'Time',

    saved:
        'Your activity result has been saved.',

    tryAgain:
        'Try Again',

    readAloud:
        'Read Aloud',

    stopReading:
        'Stop Reading',

    speakAnswer:
        'Speak Your Answer',

    listening:
        'Listening...',

    unsupportedVoice:
        'Voice input is not supported in this browser.',

    voiceError:
        'Could not understand your voice. Please try again.',
}


// ============================================================
// Fallback categories
// ============================================================

const CATEGORY_OPTIONS = [
    'General',
    'Family',
    'Friends',
    'Travel',
    'Celebration',
    'Childhood',
    'Other',
]


// ============================================================
// Shuffle
// ============================================================

function shuffleArray(
    items,
) {
    const shuffled = [
        ...items,
    ]

    for (
        let index = shuffled.length - 1;
        index > 0;
        index -= 1
    ) {
        const randomIndex =
            Math.floor(
                Math.random() *
                (index + 1),
            )

        const current =
            shuffled[index]

        shuffled[index] =
            shuffled[randomIndex]

        shuffled[randomIndex] =
            current
    }

    return shuffled
}


// ============================================================
// Normalize spoken text
// ============================================================

function normalizeVoiceText(
    value,
) {
    return String(
        value || '',
    )
        .toLowerCase()
        .trim()
        .replace(
            /[.,!?;:'"()[\]{}-]/g,
            ' ',
        )
        .replace(
            /\s+/g,
            ' ',
        )
}


// ============================================================
// Find an option from spoken answer
// ============================================================

function findMatchingOption(
    transcript,
    options,
) {
    const spoken =
        normalizeVoiceText(
            transcript,
        )

    if (!spoken) {
        return null
    }


    // Exact match
    for (
        const option of options
    ) {
        if (
            normalizeVoiceText(
                option,
            ) === spoken
        ) {
            return option
        }
    }


    // Spoken sentence contains the option.
    for (
        const option of options
    ) {
        const normalizedOption =
            normalizeVoiceText(
                option,
            )

        if (
            spoken.includes(
                normalizedOption,
            )
        ) {
            return option
        }
    }


    // Option contains the spoken phrase.
    for (
        const option of options
    ) {
        const normalizedOption =
            normalizeVoiceText(
                option,
            )

        if (
            normalizedOption.includes(
                spoken,
            )
        ) {
            return option
        }
    }


    return null
}


// ============================================================
// Build personalized activity questions
// ============================================================

function buildQuestions(
    memories,
) {
    if (
        !Array.isArray(memories) ||
        memories.length === 0
    ) {
        return []
    }


    /*
     * Use up to three memories per activity.
     * Selecting randomly makes repeated attempts
     * slightly different.
     */

    const selectedMemories =
        shuffleArray(
            memories,
        ).slice(
            0,
            Math.min(
                memories.length,
                3,
            ),
        )


    /*
     * One-memory case:
     *
     * Ask the user to remember its category.
     */

    if (
        selectedMemories.length === 1
    ) {
        const memory =
            selectedMemories[0]

        const otherCategories =
            CATEGORY_OPTIONS.filter(
                (category) =>
                    category !==
                    memory.category,
            )

        const categoryChoices =
            shuffleArray([
                memory.category ||
                'General',

                ...shuffleArray(
                    otherCategories,
                ).slice(0, 3),
            ])


        return [
            {
                id:
                    `category-${memory.id}`,

                memory,

                type:
                    'category',

                prompt:
                    'Which category was this memory saved under?',

                options:
                    categoryChoices,

                answer:
                    memory.category ||
                    'General',
            },
        ]
    }


    /*
     * Two or more memories:
     *
     * Show the description and ask the user
     * which saved title it belongs to.
     */

    return selectedMemories.map(
        (memory) => {

            const otherTitles =
                shuffleArray(
                    memories
                        .filter(
                            (item) =>
                                item.id !==
                                memory.id,
                        )
                        .map(
                            (item) =>
                                item.title,
                        ),
                ).slice(
                    0,
                    Math.min(
                        2,
                        memories.length - 1,
                    ),
                )


            const options =
                shuffleArray([
                    memory.title,
                    ...otherTitles,
                ])


            return {
                id:
                    `memory-${memory.id}`,

                memory,

                type:
                    'title',

                prompt:
                    'Which saved memory does this story belong to?',

                options,

                answer:
                    memory.title,
            }
        },
    )
}


// ============================================================
// Format elapsed seconds
// ============================================================

function formatTime(
    seconds,
) {
    const safeSeconds =
        Math.max(
            0,
            Number(seconds) || 0,
        )

    const minutes =
        Math.floor(
            safeSeconds / 60,
        )

    const remainingSeconds =
        safeSeconds % 60

    return (
        `${String(
            minutes,
        ).padStart(
            2,
            '0',
        )}:` +
        `${String(
            remainingSeconds,
        ).padStart(
            2,
            '0',
        )}`
    )
}


// ============================================================
// Personal Memory Recall
// ============================================================

function PersonalMemoryRecall({
    text = {},
    language = 'en-IN',
    readAloudLabel,
    stopReadingLabel,
    onBack,
}) {
    const ui = {
        ...DEFAULT_TEXT,
        ...(text || {}),
    }


    // ========================================================
    // Memory data
    // ========================================================

    const [memories, setMemories] =
        useState([])

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState('')


    // ========================================================
    // Activity data
    // ========================================================

    const [questions, setQuestions] =
        useState([])

    const [activityStarted, setActivityStarted] =
        useState(false)

    const [phase, setPhase] =
        useState('intro')

    const [currentIndex, setCurrentIndex] =
        useState(0)

    const [selectedAnswer, setSelectedAnswer] =
        useState(null)

    const [lastAnswerCorrect, setLastAnswerCorrect] =
        useState(null)


    // ========================================================
    // Score
    // ========================================================

    const [score, setScore] =
        useState({
            correct: 0,
            wrong: 0,
        })


    // ========================================================
    // Timer
    // ========================================================

    const [timeElapsed, setTimeElapsed] =
        useState(0)


    // ========================================================
    // Save state
    // ========================================================

    const [saving, setSaving] =
        useState(false)

    const [saved, setSaved] =
        useState(false)


    // ========================================================
    // Load memories
    // ========================================================

    useEffect(() => {
        let active = true


        const loadMemories =
            async () => {
                try {
                    setLoading(true)
                    setError('')

                    const data =
                        await apiGet(
                            '/memories',
                        )

                    if (!active) {
                        return
                    }

                    const loadedMemories =
                        Array.isArray(
                            data?.memories,
                        )
                            ? data.memories
                            : []

                    setMemories(
                        loadedMemories,
                    )

                } catch (err) {

                    if (!active) {
                        return
                    }

                    setError(
                        err?.message ||
                        'Could not load your memories.',
                    )

                } finally {

                    if (active) {
                        setLoading(false)
                    }
                }
            }


        loadMemories()


        return () => {
            active = false
        }
    }, [])


    // ========================================================
    // Timer
    // ========================================================

    useEffect(() => {

        if (
            !activityStarted ||
            phase === 'completed' ||
            saving
        ) {
            return undefined
        }


        const timer =
            window.setInterval(
                () => {
                    setTimeElapsed(
                        (currentTime) =>
                            currentTime + 1,
                    )
                },
                1000,
            )


        return () => {
            window.clearInterval(
                timer,
            )
        }

    }, [
        activityStarted,
        phase,
        saving,
    ])


    // ========================================================
    // Current question
    // ========================================================

    const currentQuestion =
        questions[currentIndex]


    // ========================================================
    // Start activity
    // ========================================================

    const handleStart =
        () => {

            const newQuestions =
                buildQuestions(
                    memories,
                )


            if (
                newQuestions.length === 0
            ) {
                setError(
                    ui.noMemoriesDescription,
                )

                return
            }


            setQuestions(
                newQuestions,
            )

            setCurrentIndex(0)

            setScore({
                correct: 0,
                wrong: 0,
            })

            setSelectedAnswer(null)

            setLastAnswerCorrect(null)

            setTimeElapsed(0)

            setSaved(false)

            setSaving(false)

            setError('')

            setActivityStarted(true)

            setPhase('study')
        }


    // ========================================================
    // Show answer choices
    // ========================================================

    const handleRemember =
        () => {

            if (
                !currentQuestion
            ) {
                return
            }

            setSelectedAnswer(
                null,
            )

            setLastAnswerCorrect(
                null,
            )

            setError('')

            setPhase(
                'answering',
            )
        }


    // ========================================================
    // Submit answer
    // ========================================================

    const handleAnswer =
        (answer) => {

            if (
                !currentQuestion ||
                selectedAnswer !== null ||
                phase !== 'answering'
            ) {
                return
            }


            const isCorrect =
                answer ===
                currentQuestion.answer


            setSelectedAnswer(
                answer,
            )

            setLastAnswerCorrect(
                isCorrect,
            )


            setScore(
                (previousScore) => ({
                    correct:
                        previousScore.correct +
                        (
                            isCorrect
                                ? 1
                                : 0
                        ),

                    wrong:
                        previousScore.wrong +
                        (
                            isCorrect
                                ? 0
                                : 1
                        ),
                }),
            )


            setPhase(
                'feedback',
            )
        }


    // ========================================================
    // Voice answer
    // ========================================================

    const handleVoiceAnswer =
        (transcript) => {

            if (
                !currentQuestion ||
                selectedAnswer !== null ||
                phase !== 'answering'
            ) {
                return
            }


            const matchedOption =
                findMatchingOption(
                    transcript,
                    currentQuestion.options,
                )


            if (
                matchedOption
            ) {
                setError('')

                handleAnswer(
                    matchedOption,
                )

                return
            }


            setError(
                `I heard "${transcript}", ` +
                'but could not match it to one of the displayed choices. ' +
                'Please try again.',
            )
        }


    // ========================================================
    // Finish activity
    // ========================================================

    const finishActivity =
        async () => {

            if (
                saving ||
                saved
            ) {
                return
            }


            const totalRounds =
                questions.length


            if (
                totalRounds === 0
            ) {
                return
            }


            const accuracy =
                Math.round(
                    (
                        score.correct /
                        totalRounds
                    ) *
                    100,
                )


            try {

                setSaving(true)
                setError('')


                await savePerformanceResult({
                    game:
                        'Personal Memory Recall',

                    difficulty:
                        'Personalized',

                    accuracy,

                    mistakes:
                        score.wrong,

                    time:
                        timeElapsed,

                    completed:
                        true,

                    targetCount:
                        totalRounds,

                    correct:
                        score.correct,

                    wrong:
                        score.wrong,
                })


                setSaved(true)

                setPhase(
                    'completed',
                )

            } catch (err) {

                setError(
                    err?.message ||
                    'Could not save your activity result.',
                )

            } finally {

                setSaving(false)
            }
        }


    // ========================================================
    // Next question
    // ========================================================

    const handleNext =
        async () => {

            if (
                currentIndex >=
                questions.length - 1
            ) {
                await finishActivity()

                return
            }


            setCurrentIndex(
                (index) =>
                    index + 1,
            )

            setSelectedAnswer(
                null,
            )

            setLastAnswerCorrect(
                null,
            )

            setError('')

            setPhase('study')
        }


    // ========================================================
    // Restart
    // ========================================================

    const handleRestart =
        () => {

            const newQuestions =
                buildQuestions(
                    memories,
                )


            if (
                newQuestions.length === 0
            ) {
                setError(
                    ui.noMemoriesDescription,
                )

                return
            }


            setQuestions(
                newQuestions,
            )

            setCurrentIndex(0)

            setScore({
                correct: 0,
                wrong: 0,
            })

            setSelectedAnswer(null)

            setLastAnswerCorrect(null)

            setTimeElapsed(0)

            setSaved(false)

            setSaving(false)

            setError('')

            setActivityStarted(true)

            setPhase('study')
        }


    // ========================================================
    // Read Aloud content
    // ========================================================

    const readText =
        currentQuestion
            ? (
                currentQuestion.type ===
                    'category'
                    ? `${ui.title}. ${currentQuestion.memory?.description || ''}`
                    : `${ui.title}. ${currentQuestion.memory?.description || ''}`
            )
            : `${ui.title}. ${ui.description}`


    // ========================================================
    // Loading
    // ========================================================

    if (loading) {
        return (
            <div className="personal-memory-page">

                <div className="personal-memory-loading">
                    {ui.loading}
                </div>

            </div>
        )
    }


    // ========================================================
    // No memories
    // ========================================================

    if (
        memories.length === 0
    ) {
        return (
            <div className="personal-memory-page">

                <header className="personal-memory-header">

                    <button
                        type="button"
                        className="personal-memory-back"
                        onClick={onBack}
                    >
                        ← {ui.backToGames}
                    </button>


                    <div className="personal-memory-heading">

                        <span className="personal-memory-eyebrow">
                            {ui.eyebrow}
                        </span>

                        <h1>
                            {ui.title}
                        </h1>

                        <p>
                            {ui.description}
                        </p>

                    </div>

                </header>


                <main className="personal-memory-empty">

                    <div
                        className="personal-memory-empty-icon"
                        aria-hidden="true"
                    >
                        🧠
                    </div>


                    <h2>
                        {ui.noMemoriesTitle}
                    </h2>


                    <p>
                        {
                            error ||
                            ui.noMemoriesDescription
                        }
                    </p>


                    <button
                        type="button"
                        className="personal-memory-primary-button"
                        onClick={onBack}
                    >
                        {ui.goBack}
                    </button>

                </main>

            </div>
        )
    }


    // ========================================================
    // Completed
    // ========================================================

    if (
        phase === 'completed'
    ) {
        const accuracy =
            questions.length === 0
                ? 0
                : Math.round(
                    (
                        score.correct /
                        questions.length
                    ) *
                    100,
                )


        return (
            <div className="personal-memory-page">

                <header className="personal-memory-header">

                    <button
                        type="button"
                        className="personal-memory-back"
                        onClick={onBack}
                    >
                        ← {ui.backToGames}
                    </button>


                    <div className="personal-memory-heading">

                        <span className="personal-memory-eyebrow">
                            {ui.eyebrow}
                        </span>

                        <h1>
                            {ui.title}
                        </h1>

                    </div>

                </header>


                <main className="personal-memory-complete">

                    <div
                        className="personal-memory-complete-icon"
                        aria-hidden="true"
                    >
                        ✓
                    </div>


                    <span className="personal-memory-eyebrow">
                        {ui.wellDone}
                    </span>


                    <h2>
                        {ui.completionMessage}
                    </h2>


                    <div className="personal-memory-results">

                        <div>
                            <span>
                                {ui.rounds}
                            </span>

                            <strong>
                                {questions.length}
                            </strong>
                        </div>


                        <div>
                            <span>
                                {ui.correctAnswers}
                            </span>

                            <strong>
                                {score.correct}
                            </strong>
                        </div>


                        <div>
                            <span>
                                {ui.wrongAnswers}
                            </span>

                            <strong>
                                {score.wrong}
                            </strong>
                        </div>


                        <div>
                            <span>
                                {ui.accuracy}
                            </span>

                            <strong>
                                {accuracy}%
                            </strong>
                        </div>


                        <div>
                            <span>
                                {ui.time}
                            </span>

                            <strong>
                                {formatTime(
                                    timeElapsed,
                                )}
                            </strong>
                        </div>

                    </div>


                    {saved && (
                        <p className="personal-memory-saved-message">
                            {ui.saved}
                        </p>
                    )}


                    <div className="personal-memory-complete-actions">

                        <button
                            type="button"
                            className="personal-memory-primary-button"
                            onClick={handleRestart}
                        >
                            {ui.tryAgain}
                        </button>


                        <button
                            type="button"
                            className="personal-memory-secondary-button"
                            onClick={onBack}
                        >
                            {ui.backToGames}
                        </button>

                    </div>

                </main>

            </div>
        )
    }


    // ========================================================
    // Activity intro
    // ========================================================

    if (
        !activityStarted
    ) {
        return (
            <div className="personal-memory-page">

                <header className="personal-memory-header">

                    <button
                        type="button"
                        className="personal-memory-back"
                        onClick={onBack}
                    >
                        ← {ui.backToGames}
                    </button>


                    <div className="personal-memory-heading">

                        <span className="personal-memory-eyebrow">
                            {ui.eyebrow}
                        </span>

                        <h1>
                            {ui.title}
                        </h1>

                        <p>
                            {ui.description}
                        </p>

                    </div>


                    <VoiceReadAloud
                        text={
                            `${ui.title}. ${ui.description}`
                        }
                        language={
                            language
                        }
                        label={
                            readAloudLabel ||
                            ui.readAloud
                        }
                        stopLabel={
                            stopReadingLabel ||
                            ui.stopReading
                        }
                    />

                </header>


                <main className="personal-memory-intro">

                    <div
                        className="personal-memory-hero-icon"
                        aria-hidden="true"
                    >
                        🧠
                    </div>


                    <span className="personal-memory-eyebrow">
                        {ui.eyebrow}
                    </span>


                    <h2>
                        {ui.title}
                    </h2>


                    <p>
                        {ui.description}
                    </p>


                    <button
                        type="button"
                        className="personal-memory-primary-button"
                        onClick={
                            handleStart
                        }
                    >
                        {ui.startActivity}
                    </button>

                </main>

            </div>
        )
    }


    // ========================================================
    // Progress
    // ========================================================

    const progress =
        questions.length === 0
            ? 0
            : Math.round(
                (
                    (
                        currentIndex +
                        1
                    ) /
                    questions.length
                ) *
                100,
            )


    // ========================================================
    // Main activity screen
    // ========================================================

    return (
        <div className="personal-memory-page">

            {/* ==================================================
                Header
                ================================================== */}

            <header className="personal-memory-header">

                <button
                    type="button"
                    className="personal-memory-back"
                    onClick={onBack}
                >
                    ← {ui.backToGames}
                </button>


                <div className="personal-memory-heading">

                    <span className="personal-memory-eyebrow">
                        {ui.eyebrow}
                    </span>

                    <h1>
                        {ui.title}
                    </h1>

                    <p>
                        {ui.description}
                    </p>

                </div>


                <VoiceReadAloud
                    text={
                        readText
                    }
                    language={
                        language
                    }
                    label={
                        readAloudLabel ||
                        ui.readAloud
                    }
                    stopLabel={
                        stopReadingLabel ||
                        ui.stopReading
                    }
                />

            </header>


            {/* ==================================================
                Main content
                ================================================== */}

            <main className="personal-memory-content">

                {/* Progress */}

                <section className="personal-memory-progress">

                    <div className="personal-memory-progress-top">

                        <span>
                            {currentIndex + 1}
                            {' / '}
                            {questions.length}
                        </span>

                        <span>
                            {formatTime(
                                timeElapsed,
                            )}
                        </span>

                    </div>


                    <div className="personal-memory-progress-track">

                        <div
                            className="personal-memory-progress-fill"
                            style={{
                                width:
                                    `${progress}%`,
                            }}
                        />

                    </div>

                </section>


                {/* =================================================
                    Study phase
                    ================================================= */}

                {phase === 'study' && (
                    <section className="personal-memory-study">

                        <span className="personal-memory-section-label">
                            {ui.studyLabel}
                        </span>


                        <h2>
                            {ui.studyInstruction}
                        </h2>


                        <div className="personal-memory-story">

                            <div
                                className="personal-memory-story-icon"
                                aria-hidden="true"
                            >
                                💭
                            </div>


                            <h3>
                                {
                                    currentQuestion
                                        ?.memory
                                        ?.title
                                }
                            </h3>


                            <p>
                                {
                                    currentQuestion
                                        ?.memory
                                        ?.description
                                }
                            </p>

                        </div>


                        <button
                            type="button"
                            className="personal-memory-primary-button"
                            onClick={
                                handleRemember
                            }
                        >
                            {ui.iRemember}
                        </button>

                    </section>
                )}


                {/* =================================================
                    Answering phase
                    ================================================= */}

                {phase === 'answering' && (
                    <section className="personal-memory-question">

                        <span className="personal-memory-section-label">
                            {ui.questionLabel}
                        </span>


                        <h2>
                            {
                                currentQuestion?.type ===
                                    'category'
                                    ? ui.categoryQuestion
                                    : ui.recallQuestion
                            }
                        </h2>


                        {error && (
                            <p
                                className="personal-memory-inline-error"
                                role="status"
                            >
                                {error}
                            </p>
                        )}


                        <div className="personal-memory-answer-grid">

                            {currentQuestion?.options?.map(
                                (option) => (
                                    <button
                                        key={
                                            option
                                        }
                                        type="button"
                                        className="personal-memory-answer-button"
                                        onClick={() =>
                                            handleAnswer(
                                                option,
                                            )
                                        }
                                    >
                                        {option}
                                    </button>
                                ),
                            )}

                        </div>


                        <VoiceInput
                            language={
                                language
                            }
                            onResult={
                                handleVoiceAnswer
                            }
                            label={
                                ui.speakAnswer
                            }
                            listeningLabel={
                                ui.listening
                            }
                            unsupportedLabel={
                                ui.unsupportedVoice
                            }
                            errorLabel={
                                ui.voiceError
                            }
                        />

                    </section>
                )}


                {/* =================================================
                    Feedback phase
                    ================================================= */}

                {phase === 'feedback' && (
                    <section className="personal-memory-feedback">

                        <div
                            className={`personal-memory-feedback-icon ${lastAnswerCorrect
                                    ? 'personal-memory-feedback-icon--correct'
                                    : 'personal-memory-feedback-icon--wrong'
                                }`}
                            aria-hidden="true"
                        >
                            {
                                lastAnswerCorrect
                                    ? '✓'
                                    : '!'
                            }
                        </div>


                        <h2>
                            {
                                lastAnswerCorrect
                                    ? ui.correct
                                    : ui.incorrect
                            }
                        </h2>


                        <p>
                            The correct answer is:
                            {' '}
                            <strong>
                                {
                                    currentQuestion
                                        ?.answer
                                }
                            </strong>
                        </p>


                        {error && (
                            <p
                                className="personal-memory-inline-error"
                                role="status"
                            >
                                {error}
                            </p>
                        )}


                        <button
                            type="button"
                            className="personal-memory-primary-button"
                            onClick={
                                handleNext
                            }
                            disabled={
                                saving
                            }
                        >
                            {
                                currentIndex >=
                                    questions.length - 1
                                    ? ui.finish
                                    : ui.next
                            }
                        </button>

                    </section>
                )}

            </main>

        </div>
    )
}


export default PersonalMemoryRecall