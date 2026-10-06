import { useEffect, useState } from 'react'

import './VoiceReadAloud.css'

function VoiceReadAloud({
    text,
    language = 'en-IN',
    label = 'Read Aloud',
    stopLabel = 'Stop',
}) {
    const [isSpeaking, setIsSpeaking] =
        useState(false)

    useEffect(() => {
        const handleSpeechEnd = () => {
            setIsSpeaking(false)
        }

        window.speechSynthesis?.addEventListener(
            'end',
            handleSpeechEnd,
        )

        return () => {
            window.speechSynthesis?.removeEventListener(
                'end',
                handleSpeechEnd,
            )

            window.speechSynthesis?.cancel()
        }
    }, [])

    const speak = () => {
        if (
            !text ||
            !window.speechSynthesis
        ) {
            return
        }

        window.speechSynthesis.cancel()

        const utterance =
            new SpeechSynthesisUtterance(text)

        utterance.lang = language
        utterance.rate = 0.85
        utterance.pitch = 1
        utterance.volume = 1

        utterance.onstart = () => {
            setIsSpeaking(true)
        }

        utterance.onend = () => {
            setIsSpeaking(false)
        }

        utterance.onerror = () => {
            setIsSpeaking(false)
        }

        window.speechSynthesis.speak(
            utterance,
        )
    }

    const stopSpeaking = () => {
        window.speechSynthesis?.cancel()
        setIsSpeaking(false)
    }

    if (
        typeof window === 'undefined' ||
        !('speechSynthesis' in window)
    ) {
        return null
    }

    return (
        <button
            type="button"
            className={`voice-read-aloud${
                isSpeaking
                    ? ' voice-read-aloud--speaking'
                    : ''
            }`}
            onClick={
                isSpeaking
                    ? stopSpeaking
                    : speak
            }
            aria-label={
                isSpeaking
                    ? stopLabel
                    : label
            }
            aria-pressed={isSpeaking}
        >
            <span
                className="voice-read-aloud-icon"
                aria-hidden="true"
            >
                {isSpeaking ? (
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M5 9V15H9L14 20V4L9 9H5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M17 9L21 15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <path
                            d="M21 9L17 15"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                ) : (
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M5 9V15H9L14 20V4L9 9H5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M17 8C18.333 9.333 19 10.667 19 12C19 13.333 18.333 14.667 17 16"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                )}
            </span>

            <span className="voice-read-aloud-text">
                {isSpeaking
                    ? stopLabel
                    : label}
            </span>
        </button>
    )
}

export default VoiceReadAloud