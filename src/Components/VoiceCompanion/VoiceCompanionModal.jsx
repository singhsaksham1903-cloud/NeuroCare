import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  normalizeLanguageCode,
  parseVoiceNavigationCommand,
  speakText,
  stopSpeaking,
  SUPPORTED_LANGUAGES,
  toShortLanguageCode,
} from '../../utils/voiceCompanion'
import './VoiceCompanionModal.css'

const UI_STRINGS = {
  en: {
    title: 'Multilingual Voice Companion',
    subtitle: 'Assisting you with navigation and games in Hindi, Assamese & English',
    idle: 'Ready to listen. Tap "Start Listening" or pick a command below.',
    listening: 'Listening to your voice... Speak clearly.',
    processing: 'Processing your request...',
    speaking: 'Companion is speaking...',
    startListening: 'Start Listening',
    stopListening: 'Stop Listening',
    stopSpeaking: 'Stop Audio',
    replayAudio: 'Replay Response',
    repeatInstructions: 'Repeat Help',
    transcriptLabel: 'What You Said',
    responseLabel: 'Companion Response',
    transcriptPlaceholder: 'Your spoken words will appear here in real-time...',
    responsePlaceholder: 'Hello! I am your Cognicare Voice Companion. How can I help you today?',
    typeFallbackLabel: 'Or type your question/command:',
    typePlaceholder: 'e.g., Open home, Start the memory game...',
    send: 'Send',
    close: 'Close',
    unsupportedRecognition: 'Speech recognition is not supported in this browser. You can still type commands below.',
    micDenied: 'Microphone permission was denied. Please allow microphone access in browser settings or type below.',
    noSpeechDetected: 'No speech was detected. Please tap Start Listening and try speaking again.',
    networkError: 'Network error during speech recognition. Please check your connection.',
    suggestedTitle: 'Common Voice Commands:',
    chips: [
      { label: 'Open home', command: 'Open home' },
      { label: 'Start memory game', command: 'Start the memory game' },
      { label: 'Show my progress', command: 'Show my progress' },
      { label: 'Open my memories', command: 'Open my memories' },
      { label: 'Show reminders', command: 'Show reminders' },
      { label: 'Help', command: 'Help' },
    ],
  },
  hi: {
    title: 'बहुभाषी आवाज सहायक',
    subtitle: 'हिन्दी, असमिया और अंग्रेज़ी में नेविगेशन व खेलों में आपकी मदद',
    idle: 'सुनने के लिए तैयार। "सुनना शुरू करें" दबाएँ या नीचे से चुनें।',
    listening: 'आपकी आवाज सुनी जा रही है... कृपया स्पष्ट बोलें।',
    processing: 'आपके अनुरोध को समझा जा रहा है...',
    speaking: 'सहायक बोल रहा है...',
    startListening: 'सुनना शुरू करें',
    stopListening: 'सुनना बंद करें',
    stopSpeaking: 'आवाज रोकें',
    replayAudio: 'उत्तर फिर से सुनें',
    repeatInstructions: 'मदद दोहराएँ',
    transcriptLabel: 'आपने क्या कहा',
    responseLabel: 'सहायक का उत्तर',
    transcriptPlaceholder: 'आपके बोले गए शब्द यहाँ दिखाई देंगे...',
    responsePlaceholder: 'नमस्ते! मैं आपका कॉग्निकेयर आवाज सहायक हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?',
    typeFallbackLabel: 'या अपना सवाल/निर्देश यहाँ लिखें:',
    typePlaceholder: 'जैसे: होम खोलो, मेमोरी गेम शुरू करो...',
    send: 'भेजें',
    close: 'बंद करें',
    unsupportedRecognition: 'इस ब्राउज़र में आवाज पहचान उपलब्ध नहीं है। आप नीचे लिखकर निर्देश दे सकते हैं।',
    micDenied: 'माइक्रोफोन की अनुमति नहीं मिली। कृपया ब्राउज़र सेटिंग्स में अनुमति दें या नीचे लिखें।',
    noSpeechDetected: 'कोई आवाज सुनाई नहीं दी। कृपया फिर से कोशिश करें।',
    networkError: 'इंटरनेट की समस्या आई। कृपया नेटवर्क जाँचें।',
    suggestedTitle: 'प्रमुख आवाज निर्देश:',
    chips: [
      { label: 'होम खोलो', command: 'होम खोलो' },
      { label: 'मेमोरी गेम शुरू करो', command: 'मेमोरी गेम शुरू करो' },
      { label: 'मेरी प्रगति दिखाओ', command: 'मेरी प्रगति दिखाओ' },
      { label: 'मेरी यादें खोलो', command: 'मेरी यादें खोलो' },
      { label: 'रिमाइंडर दिखाओ', command: 'रिमाइंडर दिखाओ' },
      { label: 'मदद', command: 'मदद' },
    ],
  },
  as: {
    title: 'বহুভাষিক কণ্ঠ সংগী',
    subtitle: 'অসমীয়া, হিন্দী আৰু ইংৰাজীত আপোনাৰ সহায়কাৰী',
    idle: 'শুনিবলৈ সাজু। "শুনা আৰম্ভ কৰক" টিপক বা তলৰ পৰা নিৰ্বাচন কৰক।',
    listening: 'আপোনাৰ কণ্ঠ শুনি থকা হৈছে... স্পষ্টকৈ কওক।',
    processing: 'অনুৰোধ প্ৰক্ৰিয়াকৰণ হৈছে...',
    speaking: 'সংগীয়ে কথা কৈ আছে...',
    startListening: 'শুনা আৰম্ভ কৰক',
    stopListening: 'শুনা বন্ধ কৰক',
    stopSpeaking: 'কণ্ঠ বন্ধ কৰক',
    replayAudio: 'পুনৰ শুনক',
    repeatInstructions: 'নিৰ্দেশ পুনৰ কওক',
    transcriptLabel: 'আপুনি কি ক’লে',
    responseLabel: 'সংগীৰ উত্তৰ',
    transcriptPlaceholder: 'আপুনি কোৱা কথাবোৰ ইয়াত দেখা যাব...',
    responsePlaceholder: 'নমস্কাৰ! মই আপোনাৰ Cognicare কণ্ঠ সংগী। আজি আপোনাক কেনেদৰে সহায় কৰিব পাৰোঁ?',
    typeFallbackLabel: 'বা আপোনাৰ নিৰ্দেশ ইয়াত লিখক:',
    typePlaceholder: 'যেনে: হোম খোলা, মেমৰি গেম আৰম্ভ কৰা...',
    send: 'প্ৰেৰণ কৰক',
    close: 'বন্ধ কৰক',
    unsupportedRecognition: 'এই ব্ৰাউজাৰত কণ্ঠ চিনাক্তকৰণ উপলব্ধ নহয়। আপুনি তলত লিখি নিৰ্দেশ দিব পাৰে।',
    micDenied: 'মাইক্ৰ’ফোনৰ অনুমতি পোৱা নগ’ল। ব্ৰাউজাৰ ছেটিংছত অনুমতি দিয়ক বা তলত লিখক।',
    noSpeechDetected: 'কোনো কথা শুনা নগ’ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।',
    networkError: 'নেটৱৰ্কৰ সমস্যা হৈছে। অনুগ্ৰহ কৰি সংযোগ পৰীক্ষা কৰক।',
    suggestedTitle: 'প্ৰয়োজনীয় কণ্ঠ নিৰ্দেশনা:',
    chips: [
      { label: 'হোম খোলা', command: 'হোম খোলা' },
      { label: 'মেমৰি গেম আৰম্ভ কৰা', command: 'মেমৰি গেম আৰম্ভ কৰা' },
      { label: 'মোৰ অগ্ৰগতি দেখুওৱা', command: 'মোৰ অগ্ৰগতি দেখুওৱা' },
      { label: 'মোৰ স্মৃতিবোৰ খোলা', command: 'মোৰ স্মৃতিবোৰ খোলা' },
      { label: 'ৰিমাইণ্ডাৰ দেখুওৱা', command: 'ৰিমাইণ্ডাৰ দেখুওৱা' },
      { label: 'সহায়', command: 'সহায়' },
    ],
  },
}

export default function VoiceCompanionModal({
  isOpen,
  onClose,
  language = 'en-IN',
  onLanguageChange,
  onNavigate,
}) {
  const titleId = useId()
  const shortLang = toShortLanguageCode(language)
  const strings = UI_STRINGS[shortLang] || UI_STRINGS.en
  const normLang = normalizeLanguageCode(language)

  const [isListening, setIsListening] = useState(false)
  const [isSpeakingState, setIsSpeakingState] = useState(false)
  const [statusType, setStatusType] = useState('idle') // 'idle' | 'listening' | 'speaking' | 'processing' | 'error'
  const [statusMessage, setStatusMessage] = useState('')
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [companionReply, setCompanionReply] = useState('')
  const [typedInput, setTypedInput] = useState('')

  const recognizerRef = useRef(null)
  const recognitionSupported = isSpeechRecognitionSupported()
  const synthesisSupported = isSpeechSynthesisSupported()

  const handleClose = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.abort()
    }
    stopSpeaking()
    setIsListening(false)
    setIsSpeakingState(false)
    setStatusType('idle')
    setStatusMessage('')
    onClose?.()
  }, [onClose])

  // Cleanup speech/recognizer on modal close
  useEffect(() => {
    if (!isOpen) {
      if (recognizerRef.current) {
        recognizerRef.current.abort()
      }
      stopSpeaking()
    }
  }, [isOpen])

  // Keydown Esc handler
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Cleanup speech and recognition on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort()
      }
      stopSpeaking()
    }
  }, [])

  // Speak helper with state tracking
  const speakResponse = useCallback(
    (textToSpeak) => {
      if (!textToSpeak || !synthesisSupported) return
      setIsSpeakingState(true)
      setStatusType('speaking')
      setStatusMessage(strings.speaking)

      speakText(textToSpeak, {
        language: normLang,
        rate: 0.85,
        onStart: () => {
          setIsSpeakingState(true)
          setStatusType('speaking')
          setStatusMessage(strings.speaking)
        },
        onEnd: () => {
          setIsSpeakingState(false)
          setStatusType('idle')
          setStatusMessage(strings.idle)
        },
        onError: () => {
          setIsSpeakingState(false)
          setStatusType('idle')
          setStatusMessage(strings.idle)
        },
      })
    },
    [normLang, strings.idle, strings.speaking, synthesisSupported]
  )

  // Stop speaking
  const handleStopSpeaking = () => {
    stopSpeaking()
    setIsSpeakingState(false)
    setStatusType('idle')
    setStatusMessage(strings.idle)
  }

  // Replay
  const handleReplay = () => {
    const textToSpeak = companionReply || strings.responsePlaceholder
    if (textToSpeak) {
      speakResponse(textToSpeak)
    }
  }

  // Process text or recognized command
  const processCommand = useCallback(
    (inputCommand) => {
      if (!inputCommand || !inputCommand.trim()) return

      setStatusType('processing')
      setStatusMessage(strings.processing)
      setTranscript(inputCommand.trim())
      setInterimText('')

      const parsed = parseVoiceNavigationCommand(inputCommand, normLang)
      if (!parsed) {
        const fallbackText = strings.responsePlaceholder
        setCompanionReply(fallbackText)
        speakResponse(fallbackText)
        return
      }

      const responseText =
        parsed.response?.[shortLang] ||
        parsed.response?.en ||
        strings.responsePlaceholder

      setCompanionReply(responseText)
      speakResponse(responseText)

      if (parsed.action === 'navigate' && parsed.targetPage) {
        // Small delay to let speech synthesis start gracefully before navigation
        setTimeout(() => {
          onNavigate?.(parsed.targetPage)
        }, 600)
      }
    },
    [normLang, onNavigate, shortLang, speakResponse, strings.processing, strings.responsePlaceholder]
  )

  // Initialize or start speech recognizer
  const handleToggleListening = () => {
    if (isListening) {
      if (recognizerRef.current) {
        recognizerRef.current.stop()
      }
      setIsListening(false)
      setStatusType('idle')
      setStatusMessage(strings.idle)
      return
    }

    if (!recognitionSupported) {
      setStatusType('error')
      setStatusMessage(strings.unsupportedRecognition)
      return
    }

    // Stop speaking if currently speaking
    stopSpeaking()
    setIsSpeakingState(false)

    try {
      const recognizer = createSpeechRecognizer({
        language: normLang,
        continuous: false,
        interimResults: true,
        onStart: () => {
          setIsListening(true)
          setStatusType('listening')
          setStatusMessage(strings.listening)
          setInterimText('')
        },
        onResult: ({ finalTranscript, interimTranscript }) => {
          if (interimTranscript) {
            setInterimText(interimTranscript)
          }
          if (finalTranscript) {
            setTranscript(finalTranscript)
            setInterimText('')
            setIsListening(false)
            processCommand(finalTranscript)
          }
        },
        onError: (event) => {
          setIsListening(false)
          setStatusType('error')
          if (event.error === 'not-allowed' || event.name === 'NotAllowedError') {
            setStatusMessage(strings.micDenied)
          } else if (event.error === 'no-speech') {
            setStatusMessage(strings.noSpeechDetected)
          } else if (event.error === 'network') {
            setStatusMessage(strings.networkError)
          } else {
            setStatusMessage(strings.noSpeechDetected)
          }
        },
        onEnd: () => {
          setIsListening(false)
          if (statusType === 'listening') {
            setStatusType('idle')
            setStatusMessage(strings.idle)
          }
        },
      })

      recognizerRef.current = recognizer
      recognizer.start()
    } catch {
      setIsListening(false)
      setStatusType('error')
      setStatusMessage(strings.noSpeechDetected)
    }
  }

  // Handle manual typed submission
  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (!typedInput.trim()) return
    const text = typedInput.trim()
    setTypedInput('')
    processCommand(text)
  }

  if (!isOpen) return null

  return (
    <div
      className="voice-companion-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
      role="presentation"
    >
      <div
        className="voice-companion-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <header className="voice-companion-header">
          <div className="voice-companion-title-area">
            <div className="voice-companion-header-icon" aria-hidden="true">
              🎙️
            </div>
            <div>
              <h2 id={titleId} className="voice-companion-title">
                {strings.title}
              </h2>
              <p className="voice-companion-subtitle">{strings.subtitle}</p>
            </div>
          </div>

          <div className="voice-companion-header-actions">
            <select
              className="voice-companion-lang-select"
              value={normLang}
              onChange={(e) => {
                const newCode = e.target.value
                onLanguageChange?.(newCode)
                if (recognizerRef.current) {
                  recognizerRef.current.setLanguage(newCode)
                }
              }}
              aria-label="Select voice companion language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeLabel} ({lang.label})
                </option>
              ))}
            </select>

            <button
              type="button"
              className="voice-companion-close-button"
              onClick={handleClose}
              aria-label={strings.close}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="voice-companion-body">
          {/* Status Banner */}
          <div
            className={`voice-status-banner voice-status-banner--${statusType}`}
            role="status"
            aria-live="polite"
          >
            <span>
              {statusType === 'listening' && '🔴 '}
              {statusType === 'speaking' && '🔊 '}
              {statusType === 'error' && '⚠️ '}
              {statusType === 'processing' && '⏳ '}
              {statusType === 'idle' && '🟢 '}
              {statusMessage || strings.idle}
            </span>
          </div>

          {/* Controls: Big Listen Button & Stop audio */}
          <div className="voice-companion-controls">
            <button
              type="button"
              className={`voice-mic-main-button ${
                isListening
                  ? 'voice-mic-main-button--stop'
                  : 'voice-mic-main-button--start'
              }`}
              onClick={handleToggleListening}
              aria-label={
                isListening ? strings.stopListening : strings.startListening
              }
              aria-pressed={isListening}
            >
              <span aria-hidden="true" style={{ fontSize: '1.4rem' }}>
                {isListening ? '⏹️' : '🎤'}
              </span>
              <span>
                {isListening ? strings.stopListening : strings.startListening}
              </span>
            </button>

            {isSpeakingState && (
              <button
                type="button"
                className="voice-stop-speech-button"
                onClick={handleStopSpeaking}
                aria-label={strings.stopSpeaking}
              >
                <span aria-hidden="true">🔇</span>
                <span>{strings.stopSpeaking}</span>
              </button>
            )}
          </div>

          {/* Transcript Display */}
          <div className="voice-transcript-card">
            <div className="voice-card-label">
              <span>{strings.transcriptLabel}</span>
              {isListening && (
                <span style={{ color: '#d97706', fontSize: '0.75rem' }}>
                  ● LIVE
                </span>
              )}
            </div>
            {transcript || interimText ? (
              <p className="voice-transcript-text">
                {transcript}{' '}
                {interimText && (
                  <span className="voice-transcript-text--interim">
                    {interimText}
                  </span>
                )}
              </p>
            ) : (
              <p className="voice-transcript-placeholder">
                {strings.transcriptPlaceholder}
              </p>
            )}
          </div>

          {/* Response Display with Replay button */}
          <div className="voice-response-card">
            <div className="voice-card-label">
              <span>{strings.responseLabel}</span>
            </div>
            <p className="voice-response-text">{companionReply}</p>
            <div className="voice-response-actions">
              <button
                type="button"
                className="voice-replay-button"
                onClick={handleReplay}
                disabled={!companionReply}
                aria-label={strings.replayAudio}
              >
                <span aria-hidden="true">🔊</span>
                <span>{strings.replayAudio}</span>
              </button>
            </div>
          </div>

          {/* Quick Voice Command Chips for elderly users */}
          <div className="voice-suggested-commands">
            <span className="voice-suggested-title">
              {strings.suggestedTitle}
            </span>
            <div className="voice-chips-row">
              {strings.chips.map((chip) => (
                <button
                  key={chip.command}
                  type="button"
                  className="voice-command-chip"
                  onClick={() => processCommand(chip.command)}
                  aria-label={`Command: ${chip.label}`}
                >
                  <span aria-hidden="true">💬</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Text-based Alternative Input */}
          <div className="voice-text-fallback">
            <span className="voice-suggested-title">
              {strings.typeFallbackLabel}
            </span>
            <form onSubmit={handleTextSubmit} className="voice-fallback-form">
              <input
                type="text"
                className="voice-fallback-input"
                placeholder={strings.typePlaceholder}
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                aria-label={strings.typeFallbackLabel}
              />
              <button
                type="submit"
                className="voice-fallback-submit"
                aria-label={strings.send}
              >
                {strings.send}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
