import {
    useEffect,
    useRef,
    useState,
} from 'react'

import './VoiceInput.css'


function VoiceInput({
    language = 'en-IN',
    onResult,
    label = 'Speak Answer',
    listeningLabel = 'Listening...',
    unsupportedLabel = 'Voice input is not supported in this browser.',
    errorLabel = 'Could not understand your voice. Please try again.',
}) {
    const [isListening, setIsListening] =
        useState(false)

    const [error, setError] =
        useState('')

    const recognitionRef =
        useRef(null)

    const SpeechRecognition =
        typeof window !== 'undefined'
            ? window.SpeechRecognition ||
              window.webkitSpeechRecognition
            : null

    const isSupported =
        Boolean(SpeechRecognition)


    // ==========================================
    // Detect browser speech recognition
    // ==========================================

    useEffect(() => {
        if (!SpeechRecognition) {
            return undefined
        }

        const recognition =
            new SpeechRecognition()

        recognition.lang =
            language

        recognition.continuous =
            false

        recognition.interimResults =
            false

        recognition.maxAlternatives =
            1


        // ======================================
        // Recognition starts
        // ======================================

        recognition.onstart = () => {
            setIsListening(true)
            setError('')
        }


        // ======================================
        // Recognition result
        // ======================================

        recognition.onresult =
            (event) => {

                const transcript =
                    event.results?.[0]?.[0]
                        ?.transcript
                        ?.trim()

                if (transcript) {
                    onResult?.(
                        transcript,
                    )
                }
            }


        // ======================================
        // Recognition errors
        // ======================================

        recognition.onerror =
            (event) => {

                setIsListening(false)

                if (
                    event.error ===
                    'aborted'
                ) {
                    return
                }

                setError(
                    errorLabel,
                )
            }


        // ======================================
        // Recognition ends
        // ======================================

        recognition.onend =
            () => {
                setIsListening(false)
            }


        recognitionRef.current =
            recognition


        return () => {
            try {
                recognition.stop()
            } catch {
                // Recognition was already stopped.
            }

            recognitionRef.current =
                null
        }

    }, [
        language,
        onResult,
        errorLabel,
        SpeechRecognition,
    ])


    // ==========================================
    // Start / stop
    // ==========================================

    const toggleListening =
        () => {

            if (!isSupported) {
                return
            }

            const recognition =
                recognitionRef.current

            if (!recognition) {
                return
            }


            if (isListening) {

                try {
                    recognition.stop()
                } catch {
                    // Already stopped.
                }

                return
            }


            setError('')


            recognition.lang =
                language

            try {
                recognition.start()
            } catch (startError) {

                /*
                 * Browser may throw InvalidStateError
                 * if recognition is already running.
                 */

                if (
                    startError?.name !==
                    'InvalidStateError'
                ) {
                    setError(
                        errorLabel,
                    )
                }
            }
        }


    // ==========================================
    // Unsupported browser
    // ==========================================

    if (!isSupported) {
        return (
            <div
                className="voice-input voice-input--unsupported"
            >
                <span
                    className="voice-input-icon"
                    aria-hidden="true"
                >
                    🎤
                </span>

                <span>
                    {unsupportedLabel}
                </span>
            </div>
        )
    }


    return (
        <div className="voice-input">

            <button
                type="button"
                className={`voice-input-button${isListening
                        ? ' voice-input-button--listening'
                        : ''
                    }`}
                onClick={
                    toggleListening
                }
                aria-label={
                    isListening
                        ? listeningLabel
                        : label
                }
                aria-pressed={
                    isListening
                }
            >

                <span
                    className="voice-input-icon"
                    aria-hidden="true"
                >
                    🎤
                </span>

                <span className="voice-input-label">
                    {isListening
                        ? listeningLabel
                        : label}
                </span>

                {isListening && (
                    <span
                        className="voice-input-pulse"
                        aria-hidden="true"
                    />
                )}

            </button>


            {isListening && (
                <p className="voice-input-status">
                    Speak clearly and take your time.
                </p>
            )}


            {error && (
                <p
                    className="voice-input-error"
                    role="status"
                >
                    {error}
                </p>
            )}

        </div>
    )
}


export default VoiceInput