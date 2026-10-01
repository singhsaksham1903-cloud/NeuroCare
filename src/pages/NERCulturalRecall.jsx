import { useEffect, useRef, useState } from 'react'

import './NERCulturalRecall.css'

import VoiceReadAloud from '../Components/VoiceReadAloud'

import {
    NER_CULTURAL_CONTENT,
    NER_FALLBACK_CONTENT,
    NER_STATES,
} from '../data/nerCulturalContent'

import { savePerformanceResult } from '../utils/performanceStorage'


// ============================================
// Language Helpers
// ============================================

function getLanguageKey(language) {
    if (language === 'hi-IN') {
        return 'hi'
    }

    if (language === 'as-IN') {
        return 'as'
    }

    return 'en'
}


function getLocalizedText(value, language) {
    if (!value) {
        return ''
    }

    const key = getLanguageKey(language)

    return value[key] || value.en || ''
}


// ============================================
// Shuffle Helper
// ============================================

function shuffleItems(items) {
    return [...items].sort(
        () => Math.random() - 0.5,
    )
}


// ============================================
// Build One Question Per NER State
// ============================================

function buildQuestions() {
    const questions = []

    for (const state of NER_STATES) {
        const stateContent =
            NER_CULTURAL_CONTENT.filter(
                (item) =>
                    item.stateId === state.id,
            )

        if (stateContent.length === 0) {
            continue
        }

        const selectedContent =
            shuffleItems(stateContent)[0]

        const distractors =
            shuffleItems(
                NER_STATES.filter(
                    (optionState) =>
                        optionState.id !==
                        state.id,
                ),
            ).slice(0, 3)

        questions.push({
            ...selectedContent,

            optionStates: shuffleItems([
                state,
                ...distractors,
            ]),
        })
    }

    return shuffleItems(questions)
}


// ============================================
// Fallback Question
// ============================================

function buildFallbackQuestion() {
    return {
        ...NER_FALLBACK_CONTENT,

        optionStates: shuffleItems([
            ...NER_STATES.slice(0, 3),

            {
                id: 'north-east',
                en: 'North Eastern India',
                hi: 'उत्तर पूर्वी भारत',
                as: 'উত্তৰ-পূব ভাৰত',
            },
        ]),
    }
}


// ============================================
// Category Labels
// ============================================

const CATEGORY_LABELS = {
    en: {
        place: 'Place',
        festival: 'Festival',
        heritage: 'Heritage',
        regional: 'Regional',
    },

    hi: {
        place: 'स्थान',
        festival: 'त्योहार',
        heritage: 'विरासत',
        regional: 'क्षेत्रीय',
    },

    as: {
        place: 'ঠাই',
        festival: 'উৎসৱ',
        heritage: 'ঐতিহ্য',
        regional: 'আঞ্চলিক',
    },
}


// ============================================
// Main Component
// ============================================

function NERCulturalRecall({
    language = 'en-IN',
    readAloudLabel = 'Read Aloud',
    stopReadingLabel = 'Stop Reading',
    onBack,
}) {
    const languageKey =
        getLanguageKey(language)

    // ----------------------------------------
    // Game State
    // ----------------------------------------

    const [questions, setQuestions] =
        useState([])

    const [currentIndex, setCurrentIndex] =
        useState(0)

    const [selectedAnswer, setSelectedAnswer] =
        useState(null)

    const [correctAnswers, setCorrectAnswers] =
        useState(0)

    const [mistakes, setMistakes] =
        useState(0)

    const [timeElapsed, setTimeElapsed] =
        useState(0)

    const [phase, setPhase] =
        useState('idle')

    const [message, setMessage] =
        useState('')


    const resultSaved =
        useRef(false)


    // ----------------------------------------
    // Localized UI Text
    // ----------------------------------------

    const UI = {
        en: {
            back: 'Back to Games',
            title: 'NER Cultural Recall',
            description:
                'Remember familiar places, festivals, and landmarks from North Eastern India.',
            instruction:
                'Choose the state that matches the regional clue.',
            start: 'Start Game',
            next: 'Next Question',
            restart: 'Play Again',
            question: 'Question',
            of: 'of',
            category: 'Category',
            correct: 'Correct!',
            incorrect: 'Not quite. Try to remember it next time.',
            completed: 'Excellent! You completed the NER recall activity.',
            score: 'Your Score',
            mistakes: 'Mistakes',
            time: 'Time',
            regionalContent:
                'Regional content',
            exerciseNote:
                'This is a memory exercise, not a medical diagnosis.',
        },

        hi: {
            back: 'खेलों पर वापस जाएँ',
            title: 'NER सांस्कृतिक स्मृति',
            description:
                'उत्तर पूर्वी भारत के परिचित स्थानों, त्योहारों और विरासत स्थलों को याद करें।',
            instruction:
                'क्षेत्रीय संकेत से मेल खाने वाला राज्य चुनें।',
            start: 'खेल शुरू करें',
            next: 'अगला प्रश्न',
            restart: 'फिर खेलें',
            question: 'प्रश्न',
            of: 'में से',
            category: 'श्रेणी',
            correct: 'सही!',
            incorrect:
                'पूरी तरह सही नहीं। अगली बार इसे याद रखने की कोशिश करें।',
            completed:
                'बहुत अच्छा! आपने NER स्मृति गतिविधि पूरी कर ली।',
            score: 'आपका स्कोर',
            mistakes: 'गलतियाँ',
            time: 'समय',
            regionalContent:
                'क्षेत्रीय सामग्री',
            exerciseNote:
                'यह एक स्मृति अभ्यास है, चिकित्सीय निदान नहीं।',
        },

        as: {
            back: 'খেলালৈ উভতি যাওক',
            title: 'NER সাংস্কৃতিক স্মৃতি',
            description:
                'উত্তৰ-পূৰ্বাঞ্চলৰ চিনাকি ঠাই, উৎসৱ আৰু ঐতিহ্যস্থল মনত পেলাওক।',
            instruction:
                'আঞ্চলিক সংকেতৰ সৈতে মিল থকা ৰাজ্যখন বাছক।',
            start: 'খেল আৰম্ভ কৰক',
            next: 'পৰৱৰ্তী প্ৰশ্ন',
            restart: 'পুনৰ খেলক',
            question: 'প্ৰশ্ন',
            of: 'ৰ',
            category: 'শ্ৰেণী',
            correct: 'শুদ্ধ!',
            incorrect:
                'সম্পূৰ্ণ সঠিক নহয়। পৰৱৰ্তী বাৰ মনত পেলাবলৈ চেষ্টা কৰক।',
            completed:
                'বৰ ভাল! আপুনি NER স্মৃতি কাৰ্যকলাপ সম্পূৰ্ণ কৰিলে।',
            score: 'আপোনাৰ স্ক’ৰ',
            mistakes: 'ভুল',
            time: 'সময়',
            regionalContent:
                'আঞ্চলিক সামগ্ৰী',
            exerciseNote:
                'এইটো এটা স্মৃতি অনুশীলন, চিকিৎসাগত নিৰ্ণয় নহয়।',
        },
    }

    const text =
        UI[languageKey] || UI.en


    // ----------------------------------------
    // Current Question
    // ----------------------------------------

    const currentQuestion =
        questions[currentIndex] || null


    useEffect(() => {
        if (phase !== 'playing') {
            return undefined
        }

        const timer = window.setInterval(() => {
            setTimeElapsed(
                (currentValue) => currentValue + 1,
            )
        }, 1000)

        return () => {
            window.clearInterval(timer)
        }
    }, [phase])


    // ----------------------------------------
    // Start Game
    // ----------------------------------------

    const startGame = () => {
        const generatedQuestions =
            buildQuestions()

        const safeQuestions =
            generatedQuestions.length > 0
                ? generatedQuestions
                : [buildFallbackQuestion()]

        setQuestions(safeQuestions)
        setCurrentIndex(0)
        setSelectedAnswer(null)
        setCorrectAnswers(0)
        setMistakes(0)
        setTimeElapsed(0)
        setMessage('')
        setPhase('playing')


        resultSaved.current = false
    }


    // ----------------------------------------
    // Handle Answer
    // ----------------------------------------

    const handleAnswer = (
        stateId,
    ) => {
        if (
            phase !== 'playing' ||
            selectedAnswer !== null ||
            !currentQuestion
        ) {
            return
        }

        const isCorrect =
            stateId === currentQuestion.answer

        setSelectedAnswer(stateId)

        if (isCorrect) {
            setCorrectAnswers(
                (currentValue) =>
                    currentValue + 1,
            )

            setMessage(text.correct)
        } else {
            setMistakes(
                (currentValue) =>
                    currentValue + 1,
            )

            setMessage(text.incorrect)
        }

    }


    // ----------------------------------------
    // Move to Next Question
    // ----------------------------------------

    const handleNextQuestion = () => {
        if (!currentQuestion) {
            return
        }

        const isLastQuestion =
            currentIndex ===
            questions.length - 1

        if (isLastQuestion) {
            const finalCorrect =
                correctAnswers +
                (
                    selectedAnswer ===
                        currentQuestion.answer
                        ? 0
                        : 0
                )

            const finalTime =
                Math.max(0, timeElapsed)

            const totalAttempts =
                questions.length +
                mistakes

            const accuracy =
                totalAttempts > 0
                    ? Math.round(
                        (
                            questions.length /
                            totalAttempts
                        ) * 100,
                    )
                    : 0

            if (
                !resultSaved.current
            ) {
                savePerformanceResult({
                    game:
                        'NER Cultural Recall',
                    difficulty:
                        'Regional',
                    targetCount:
                        questions.length,
                    correct:
                        finalCorrect,
                    wrong:
                        mistakes,
                    mistakes,
                    time:
                        finalTime,
                    accuracy,
                    completed: true,
                })

                resultSaved.current = true
            }

            setTimeElapsed(finalTime)
            setPhase('complete')
            setMessage(text.completed)

            return
        }

        setCurrentIndex(
            (currentValue) =>
                currentValue + 1,
        )

        setSelectedAnswer(null)
        setMessage('')
    }


    // ----------------------------------------
    // Empty / Idle State
    // ----------------------------------------

    if (phase === 'idle') {
        return (
            <div className="ner-cultural-page">

                <header className="ner-cultural-header">

                    <button
                        type="button"
                        className="ner-cultural-back"
                        onClick={onBack}
                    >
                        ← {text.back}
                    </button>

                    <div className="ner-cultural-header-content">

                        <div className="ner-cultural-icon">
                            🌏
                        </div>

                        <h1>
                            {text.title}
                        </h1>

                        <p>
                            {text.description}
                        </p>

                        <VoiceReadAloud
                            text={`${text.title}. ${text.description}. ${text.instruction}`}
                            language={language}
                            label={readAloudLabel}
                            stopLabel={stopReadingLabel}
                        />

                    </div>

                </header>


                <main className="ner-cultural-start">

                    <div className="ner-cultural-info">
                        <strong>
                            {text.regionalContent}
                        </strong>

                        <p>
                            {text.instruction}
                        </p>

                        <p className="ner-cultural-note">
                            {text.exerciseNote}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ner-cultural-start-button"
                        onClick={startGame}
                    >
                        {text.start}
                    </button>

                </main>

            </div>
        )
    }


    // ----------------------------------------
    // Complete State
    // ----------------------------------------

    if (phase === 'complete') {
        return (
            <div className="ner-cultural-page">

                <header className="ner-cultural-header">

                    <button
                        type="button"
                        className="ner-cultural-back"
                        onClick={onBack}
                    >
                        ← {text.back}
                    </button>

                    <div className="ner-cultural-header-content">

                        <div className="ner-cultural-icon">
                            🌏
                        </div>

                        <h1>
                            {text.title}
                        </h1>

                        <p>
                            {text.completed}
                        </p>

                    </div>

                </header>


                <main className="ner-cultural-result">

                    <div className="ner-cultural-result-card">

                        <div className="ner-cultural-result-icon">
                            🎉
                        </div>

                        <h2>
                            {text.completed}
                        </h2>

                        <div className="ner-cultural-result-grid">

                            <div>
                                <strong>
                                    {text.score}
                                </strong>

                                <span>
                                    {correctAnswers}/
                                    {questions.length}
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {text.mistakes}
                                </strong>

                                <span>
                                    {mistakes}
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {text.time}
                                </strong>

                                <span>
                                    {timeElapsed}s
                                </span>
                            </div>

                        </div>


                        <button
                            type="button"
                            className="ner-cultural-start-button"
                            onClick={startGame}
                        >
                            {text.restart}
                        </button>

                    </div>

                </main>

            </div>
        )
    }


    // ----------------------------------------
    // Playing State
    // ----------------------------------------

    const questionNumber =
        currentIndex + 1

    const category =
        CATEGORY_LABELS[
        languageKey
        ][
        currentQuestion?.category ||
        'regional'
        ] ||
        CATEGORY_LABELS[
            languageKey
        ].regional

    const currentCorrectState =
        NER_STATES.find(
            (state) =>
                state.id ===
                currentQuestion?.answer,
        )

    return (
        <div className="ner-cultural-page">

            <header className="ner-cultural-header">

                <button
                    type="button"
                    className="ner-cultural-back"
                    onClick={onBack}
                >
                    ← {text.back}
                </button>

                <div className="ner-cultural-header-content">

                    <div className="ner-cultural-icon">
                        🌏
                    </div>

                    <h1>
                        {text.title}
                    </h1>

                    <p>
                        {text.instruction}
                    </p>

                </div>

            </header>


            <main className="ner-cultural-game">

                <div className="ner-cultural-progress">

                    <span>
                        {text.question}{' '}
                        {questionNumber}{' '}
                        {text.of}{' '}
                        {questions.length}
                    </span>

                    <span>
                        {text.mistakes}: {mistakes}
                    </span>

                </div>


                <section className="ner-cultural-question-card">

                    <div className="ner-cultural-category">
                        {text.category}: {category}
                    </div>

                    <h2>
                        {getLocalizedText(
                            currentQuestion?.title,
                            language,
                        )}
                    </h2>

                    <p>
                        {getLocalizedText(
                            currentQuestion?.clue,
                            language,
                        )}
                    </p>

                    <p className="ner-cultural-question">
                        {getLocalizedText(
                            currentQuestion?.question,
                            language,
                        )}
                    </p>

                </section>


                <section className="ner-cultural-options">

                    {currentQuestion?.optionStates.map(
                        (state) => {
                            const isSelected =
                                selectedAnswer ===
                                state.id

                            const isCorrect =
                                currentQuestion.answer ===
                                state.id

                            return (
                                <button
                                    key={state.id}
                                    type="button"
                                    className={`ner-cultural-option${isSelected
                                            ? isCorrect
                                                ? ' ner-cultural-option--correct'
                                                : ' ner-cultural-option--wrong'
                                            : ''
                                        }${selectedAnswer !== null &&
                                            isCorrect
                                            ? ' ner-cultural-option--answer'
                                            : ''
                                        }`}
                                    onClick={() =>
                                        handleAnswer(
                                            state.id,
                                        )
                                    }
                                    disabled={
                                        selectedAnswer !== null
                                    }
                                >
                                    {getLocalizedText(
                                        state,
                                        language,
                                    )}
                                </button>
                            )
                        },
                    )}

                </section>


                {selectedAnswer !== null && (
                    <div className="ner-cultural-feedback">

                        <p>
                            {message}
                        </p>

                        {!(
                            selectedAnswer ===
                            currentQuestion.answer
                        ) && currentCorrectState && (
                                <small>
                                    {getLocalizedText(
                                        currentCorrectState,
                                        language,
                                    )}
                                </small>
                            )}

                        <button
                            type="button"
                            className="ner-cultural-next-button"
                            onClick={
                                handleNextQuestion
                            }
                        >
                            {currentIndex ===
                                questions.length - 1
                                ? text.next
                                : text.next}
                        </button>

                    </div>
                )}

            </main>

        </div>
    )
}


export default NERCulturalRecall