import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { apiPost } from '../../utils/api'
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
    typePlaceholder: 'e.g., Open home, Start the memory game, How is my score?',
    send: 'Send',
    close: 'Close',
    unsupportedRecognition: 'Speech recognition is not supported in this browser. You can still type commands below.',
    micDenied: 'Microphone permission was denied. Please allow microphone access in your browser settings (click the lock/camera icon in the address bar), or type below.',
    noSpeechDetected: 'No speech was detected. Please tap Start Listening and try speaking again.',
    networkError: 'Network error during speech recognition. Please check your internet connection.',
    suggestedTitle: 'Common Voice Commands:',
    chips: [
      { label: 'Open home', command: 'Open home' },
      { label: 'Play memory game', command: 'Play Memory Match' },
      { label: 'Sequence game', command: 'Play Sequence Memory' },
      { label: 'Show my progress', command: 'Show my progress' },
      { label: 'Open memories', command: 'Open my memories' },
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
    typePlaceholder: 'जैसे: होम खोलो, मेमोरी गेम शुरू करो, मेरी प्रगति दिखाओ...',
    send: 'भेजें',
    close: 'बंद करें',
    unsupportedRecognition: 'इस ब्राउज़र में आवाज पहचान उपलब्ध नहीं है। आप नीचे लिखकर निर्देश दे सकते हैं।',
    micDenied: 'माइक्रोफोन की अनुमति नहीं मिली। कृपया ब्राउज़र एड्रेस बार में माइक्रोफोन आइकन दबाकर अनुमति दें, या नीचे लिखें।',
    noSpeechDetected: 'कोई आवाज सुनाई नहीं दी। कृपया फिर से कोशिश करें।',
    networkError: 'इंटरनेट की समस्या आई। कृपया नेटवर्क जाँचें।',
    suggestedTitle: 'प्रमुख आवाज निर्देश:',
    chips: [
      { label: 'होम खोलो', command: 'होम खोलो' },
      { label: 'मेमोरी मैच खेलो', command: 'मेमोरी मैच' },
      { label: 'सीक्वेंस खेलो', command: 'सीक्वेंस मेमोरी' },
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
    typePlaceholder: 'যেনে: হোম খোলা, মেমৰি গেম আৰম্ভ কৰা, অগ্ৰগতি দেখুওৱা...',
    send: 'প্ৰেৰণ কৰক',
    close: 'বন্ধ কৰক',
    unsupportedRecognition: 'এই ব্ৰাউজাৰত কণ্ঠ চিনাক্তকৰণ উপলব্ধ নহয়। আপুনি তলত লিখি নিৰ্দেশ দিব পাৰে।',
    micDenied: 'মাইক্ৰ’ফোনৰ অনুমতি পোৱা নগ’ল। অনুগ্ৰহ কৰি ব্ৰাউজাৰ ছেটিংছত মাইক্ৰ’ফোনৰ অনুমতি দিয়ক বা তলত লিখক।',
    noSpeechDetected: 'কোনো কথা শুনা নগ’ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।',
    networkError: 'নেটৱৰ্কৰ সমস্যা হৈছে। অনুগ্ৰহ কৰি সংযোগ পৰীক্ষা কৰক।',
    suggestedTitle: 'প্ৰয়োজনীয় কণ্ঠ নিৰ্দেশনা:',
    chips: [
      { label: 'হোম খোলা', command: 'হোম খোলা' },
      { label: 'মেমৰি মেচ খেলক', command: 'মেমৰি মেচ' },
      { label: 'ক্ৰম স্মৃতি খেলক', command: 'ক্ৰম স্মৃতি' },
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
  const turnIdRef = useRef(0)
  const textInputRef = useRef(null)

  const handleClose = useCallback(() => {
    turnIdRef.current++
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

  // Cleanup external speech/recognizer systems on modal close
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
    const turnRef = turnIdRef
    const recRef = recognizerRef
    return () => {
      turnRef.current++
      if (recRef.current) {
        recRef.current.abort()
      }
      stopSpeaking()
    }
  }, [])

  // Update speech recognizer language if prop changes
  useEffect(() => {
    if (recognizerRef.current) {
      recognizerRef.current.setLanguage(normLang)
    }
  }, [normLang])

  // Speak helper with strict turn tracking to prevent repeated or overlapping audio
  const speakResponse = useCallback(
    (textToSpeak, turnId) => {
      if (!textToSpeak || !synthesisSupported) return
      // If a newer turn started, discard this speech
      if (turnId && turnId !== turnIdRef.current) return

      stopSpeaking()
      setIsSpeakingState(true)
      setStatusType('speaking')
      setStatusMessage(strings.speaking)

      speakText(textToSpeak, {
        language: normLang,
        rate: 0.85,
        onStart: () => {
          if (turnId && turnId !== turnIdRef.current) return
          setIsSpeakingState(true)
          setStatusType('speaking')
          setStatusMessage(strings.speaking)
        },
        onEnd: () => {
          if (turnId && turnId !== turnIdRef.current) return
          setIsSpeakingState(false)
          setStatusType('idle')
          setStatusMessage(strings.idle)
        },
        onError: () => {
          if (turnId && turnId !== turnIdRef.current) return
          setIsSpeakingState(false)
          setStatusType('idle')
          setStatusMessage(strings.idle)
        },
      })
    },
    [normLang, strings.idle, strings.speaking, synthesisSupported]
  )

  // Stop speaking audio immediately
  const handleStopSpeaking = () => {
    turnIdRef.current++
    stopSpeaking()
    setIsSpeakingState(false)
    setStatusType('idle')
    setStatusMessage(strings.idle)
  }

  // Replay current companion answer
  const handleReplay = () => {
    const textToSpeak = companionReply || strings.responsePlaceholder
    if (textToSpeak) {
      const turnId = ++turnIdRef.current
      speakResponse(textToSpeak, turnId)
    }
  }

  // Process voice transcript or typed text
  const processCommand = useCallback(
    async (inputCommand) => {
      if (!inputCommand || !inputCommand.trim()) return

      const thisTurn = ++turnIdRef.current
      const cleanInput = inputCommand.trim()

      // Stop speech and listening while processing
      if (recognizerRef.current) {
        recognizerRef.current.stop()
      }
      stopSpeaking()
      setIsListening(false)
      setIsSpeakingState(false)

      setStatusType('processing')
      setStatusMessage(strings.processing)
      setTranscript(cleanInput)
      setInterimText('')

      // 1. Try local navigation / command matcher first for instant responsiveness
      const localParsed = parseVoiceNavigationCommand(cleanInput, normLang)

      if (localParsed) {
        if (thisTurn !== turnIdRef.current) return

        const responseText =
          localParsed.response?.[shortLang] ||
          localParsed.response?.en ||
          strings.responsePlaceholder

        setCompanionReply(responseText)
        speakResponse(responseText, thisTurn)

        if (localParsed.action === 'navigate' && localParsed.targetPage) {
          setTimeout(() => {
            if (thisTurn === turnIdRef.current) {
              onNavigate?.(localParsed.targetPage, localParsed.gameId)
            }
          }, 800)
        }
        return
      }

      // 2. Not a standard local command — call conversational AI endpoint
      try {
        const chatRes = await apiPost('/voice-companion/chat', {
          message: cleanInput,
          language: normLang,
        })

        if (thisTurn !== turnIdRef.current) return

        const reply = chatRes?.reply || strings.responsePlaceholder
        setCompanionReply(reply)
        speakResponse(reply, thisTurn)

        if (chatRes?.action === 'navigate' && chatRes?.targetPage) {
          setTimeout(() => {
            if (thisTurn === turnIdRef.current) {
              onNavigate?.(chatRes.targetPage, chatRes.gameId)
            }
          }, 800)
        }
      } catch {
        if (thisTurn !== turnIdRef.current) return

        // Graceful offline conversational fallback
        const fallback =
          shortLang === 'hi'
            ? 'मैं आपकी बात सुन रहा हूँ। आप मुझसे खेल खेलने, अपनी प्रगति देखने या यादें खोलने के लिए कह सकते हैं।'
            : shortLang === 'as'
            ? 'মই আপোনাৰ কথা শুনিছোঁ। আপুনি মোক খেল আৰম্ভ কৰিবলৈ, অগ্ৰগতি চাবলৈ বা স্মৃতি খুলিবলৈ ক’ব পাৰে।'
            : "I hear you clearly. You can ask me to start a game, show your progress, view your memories, or check your reminders."

        setCompanionReply(fallback)
        speakResponse(fallback, thisTurn)
      }
    },
    [normLang, onNavigate, shortLang, speakResponse, strings.processing, strings.responsePlaceholder]
  )

  // Start or stop speech recognition with permission checks
  const handleToggleListening = async () => {
    // If currently listening, stop cleanly
    if (isListening || (recognizerRef.current && recognizerRef.current.isRunning())) {
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
      textInputRef.current?.focus()
      return
    }

    // Stop speaking if companion is currently talking
    handleStopSpeaking()

    // Test microphone permission if mediaDevices is available
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Close test stream tracks immediately
        stream.getTracks().forEach((track) => track.stop())
      } catch (err) {
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setIsListening(false)
          setStatusType('error')
          setStatusMessage(strings.micDenied)
          textInputRef.current?.focus()
          return
        }
      }
    }

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
            setIsListening(false)
            void processCommand(finalTranscript)
          }
        },
        onError: (event) => {
          setIsListening(false)
          if (event.error === 'not-allowed' || event.name === 'NotAllowedError') {
            setStatusType('error')
            setStatusMessage(strings.micDenied)
            textInputRef.current?.focus()
          } else if (event.error === 'no-speech') {
            setStatusType('idle')
            setStatusMessage(strings.noSpeechDetected)
          } else if (event.error === 'network') {
            setStatusType('error')
            setStatusMessage(strings.networkError)
          } else {
            setStatusType('idle')
            setStatusMessage(strings.noSpeechDetected)
          }
        },
        onEnd: () => {
          setIsListening(false)
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
    void processCommand(text)
  }

  // Handle language switch
  const handleLanguageChangeInternal = (newLangCode) => {
    onLanguageChange?.(newLangCode)
    if (recognizerRef.current) {
      recognizerRef.current.setLanguage(newLangCode)
    }
    const short = toShortLanguageCode(newLangCode)
    const announcement =
      short === 'hi'
        ? 'भाषा हिन्दी चुनी गई।'
        : short === 'as'
        ? 'ভাষা অসমীয়া নিৰ্বাচন কৰা হ’ল।'
        : 'Language set to English.'

    setCompanionReply(announcement)
    const turnId = ++turnIdRef.current
    speakResponse(announcement, turnId)
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
              onChange={(e) => handleLanguageChangeInternal(e.target.value)}
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
                <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 700 }}>
                  ● LISTENING
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
            <p className="voice-response-text">{companionReply || strings.responsePlaceholder}</p>
            <div className="voice-response-actions">
              <button
                type="button"
                className="voice-replay-button"
                onClick={handleReplay}
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
                  onClick={() => void processCommand(chip.command)}
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
                ref={textInputRef}
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
