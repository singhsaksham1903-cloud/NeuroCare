import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { apiPost } from '../../utils/api'
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  normalizeLanguageCode,
  SUPPORTED_LANGUAGES,
  toShortLanguageCode,
} from '../../utils/voiceCompanion'
import './VoiceMemoryRecorderModal.css'

const UI_STRINGS = {
  en: {
    title: 'Record a Memory with Voice',
    subtitle: 'Speak your cherished story, review the transcript, and save it to your memories.',
    privacyNotice:
      'Cognicare transcribes your speech locally in your browser. No raw audio is uploaded or shared. You have complete control to edit or cancel before anything is saved.',
    startRecording: 'Start Recording Voice',
    stopRecording: 'Stop Recording',
    retryRecording: 'Record Again',
    listeningStatus: 'Listening to your story... Speak at your own comfortable pace.',
    idleStatus: 'Press "Start Recording Voice" when you are ready to speak.',
    micDenied: 'Microphone permission was denied. You can type your memory directly into the boxes below.',
    unsupportedVoice:
      'Voice recognition is not supported in this browser. Please type your memory below.',
    memoryTitleLabel: 'Memory Title',
    memoryTitlePlaceholder: 'e.g., Spring festival with family...',
    memoryDescLabel: 'Memory Story / Details',
    memoryDescPlaceholder: 'Your spoken words will appear here. You can edit them freely...',
    categoryLabel: 'Category',
    dateLabel: 'Date of Memory',
    categories: ['Personal', 'Family', 'Tradition', 'Festival', 'Milestone', 'General'],
    saveButton: 'Confirm & Save Memory',
    savingButton: 'Saving Memory...',
    cancelButton: 'Cancel',
    saveSuccess: 'Memory saved successfully!',
    saveError: 'Could not save memory. Your story is safe above — please try saving again.',
    validationError: 'Please provide both a title and details for your memory.',
  },
  hi: {
    title: 'आवाज से अपनी याद दर्ज करें',
    subtitle: 'अपनी प्रिय कहानी बोलें, लिखे गए शब्दों की जाँच करें, और अपनी यादों में सहेजें।',
    privacyNotice:
      'कॉग्निकेयर आपके शब्दों को सीधे आपके ब्राउज़र में लिखता है। कोई ऑडियो रिकॉर्डिंग अपलोड नहीं की जाती। सहेजने से पहले आप इसे बदल या रद्द कर सकते हैं।',
    startRecording: 'आवाज रिकॉर्ड करना शुरू करें',
    stopRecording: 'रिकॉर्डिंग समाप्त करें',
    retryRecording: 'फिर से बोलें',
    listeningStatus: 'आपकी कहानी सुनी जा रही है... अपनी गति से आराम से बोलें।',
    idleStatus: 'जब आप तैयार हों तो "आवाज रिकॉर्ड करना शुरू करें" दबाएँ।',
    micDenied: 'माइक्रोफोन की अनुमति नहीं मिली। आप नीचे अपनी याद सीधे लिख सकते हैं।',
    unsupportedVoice:
      'इस ब्राउज़र में आवाज पहचान समर्थित नहीं है। कृपया नीचे अपनी याद लिखें।',
    memoryTitleLabel: 'याद का शीर्षक',
    memoryTitlePlaceholder: 'जैसे: परिवार के साथ बिहू उत्सव...',
    memoryDescLabel: 'याद की कहानी / विवरण',
    memoryDescPlaceholder: 'आपके बोले गए शब्द यहाँ दिखाई देंगे। आप इन्हें बदल भी सकते हैं...',
    categoryLabel: 'श्रेणी',
    dateLabel: 'याद की तारीख',
    categories: ['व्यक्तिगत', 'परिवार', 'परंपरा', 'उत्सव', 'महत्वपूर्ण पल', 'सामान्य'],
    saveButton: 'पुष्टि करें और सहेजें',
    savingButton: 'सहेजा जा रहा है...',
    cancelButton: 'रद्द करें',
    saveSuccess: 'आपकी याद सफलतापूर्वक सहेज ली गई!',
    saveError: 'याद सहेजी नहीं जा सकी। आपकी कहानी ऊपर सुरक्षित है — कृपया पुनः प्रयास करें।',
    validationError: 'कृपया याद का शीर्षक और विवरण दोनों भरें।',
  },
  as: {
    title: 'কণ্ঠৰে স্মৃতি সংৰক্ষণ কৰক',
    subtitle: 'আপোনাৰ মৰমৰ কাহিনী কওক, পৰীক্ষা কৰক আৰু নিজৰ স্মৃতিত সংৰক্ষণ কৰক।',
    privacyNotice:
      'Cognicare-এ আপোনাৰ কণ্ঠ ব্ৰাউজাৰৰ ভিতৰতে চিনাক্ত কৰে। কোনো অডিঅ’ আপলোড কৰা নহয়। সংৰক্ষণ কৰাৰ আগতে আপুনি সম্পূৰ্ণভাৱে সম্পাদনা কৰিব পাৰে।',
    startRecording: 'কণ্ঠ ৰেকৰ্ডিং আৰম্ভ কৰক',
    stopRecording: 'ৰেকৰ্ডিং বন্ধ কৰক',
    retryRecording: 'পুনৰ কওক',
    listeningStatus: 'আপোনাৰ কাহিনী শুনি থকা হৈছে... লাহে লাহে আৰু স্পষ্টকৈ কওক।',
    idleStatus: 'যেতিয়া আপুনি সাজু হয়, "কণ্ঠ ৰেকৰ্ডিং আৰম্ভ কৰক" টিপক।',
    micDenied: 'মাইক্ৰ’ফোনৰ অনুমতি পোৱা নগ’ল। আপুনি তলৰ বাকচত পোনপটীয়াকৈ লিখিব পাৰে।',
    unsupportedVoice:
      'এই ব্ৰাউজাৰত কণ্ঠ চিনাক্তকৰণ উপলব্ধ নহয়। অনুগ্ৰহ কৰি তলত লিখক।',
    memoryTitleLabel: 'স্মৃতিৰ শিৰোনাম',
    memoryTitlePlaceholder: 'যেনে: পৰিয়ালৰ সৈতে বিহু উৎসৱ...',
    memoryDescLabel: 'স্মৃতিৰ কাহিনী / বিৱৰণ',
    memoryDescPlaceholder: 'আপুনি কোৱা কথা ইয়াত দেখা যাব। আপুনি সম্পাদনা কৰিব পাৰিব...',
    categoryLabel: 'শ্ৰেণী',
    dateLabel: 'স্মৃতিৰ তাৰিখ',
    categories: ['ব্যক্তিগত', 'পৰিয়াল', 'পৰম্পৰা', 'উৎসৱ', 'বিশেষ মুহূৰ্ত', 'সাধাৰণ'],
    saveButton: 'নিশ্চিত কৰি সংৰক্ষণ কৰক',
    savingButton: 'সংৰক্ষণ কৰা হৈছে...',
    cancelButton: 'বাতিল কৰক',
    saveSuccess: 'আপোনাৰ স্মৃতি সফলতাৰে সংৰক্ষণ হ’ল!',
    saveError: 'স্মৃতি সংৰক্ষণ কৰিব পৰা নগ’ল। আপোনাৰ কাহিনী সুৰক্ষিত আছে — পুনৰ চেষ্টা কৰক।',
    validationError: 'অনুগ্ৰহ কৰি স্মৃতিৰ শিৰোনাম আৰু বিৱৰণ দুয়োটাই দিয়ক।',
  },
}

export default function VoiceMemoryRecorderModal({
  isOpen,
  onClose,
  language = 'en-IN',
  onMemorySaved,
}) {
  const titleId = useId()
  const shortLang = toShortLanguageCode(language)
  const strings = UI_STRINGS[shortLang] || UI_STRINGS.en
  const [userLangOverride, setUserLangOverride] = useState(null)
  const selectedLang = userLangOverride || normalizeLanguageCode(language)

  const [isRecording, setIsRecording] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Personal')
  const [memoryDate, setMemoryDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const recognizerRef = useRef(null)
  const recognitionSupported = isSpeechRecognitionSupported()

  const handleModalClose = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.abort()
    }
    setIsRecording(false)
    setStatusMessage('')
    setSaveError('')
    setSaveSuccess('')
    onClose?.()
  }, [onClose])

  // Cleanup on modal close or unmount
  useEffect(() => {
    if (!isOpen && recognizerRef.current) {
      recognizerRef.current.abort()
    }
  }, [isOpen])

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSaving) {
        handleModalClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, handleModalClose])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort()
      }
    }
  }, [])

  // Start / stop recording
  const handleToggleRecording = () => {
    if (isRecording) {
      if (recognizerRef.current) {
        recognizerRef.current.stop()
      }
      setIsRecording(false)
      setStatusMessage(strings.idleStatus)
      return
    }

    if (!recognitionSupported) {
      setStatusMessage(strings.unsupportedVoice)
      return
    }

    setSaveError('')
    setSaveSuccess('')

    try {
      const recognizer = createSpeechRecognizer({
        language: selectedLang,
        continuous: true,
        interimResults: true,
        onStart: () => {
          setIsRecording(true)
          setStatusMessage(strings.listeningStatus)
        },
        onResult: ({ finalTranscript, interimTranscript }) => {
          const combined = (finalTranscript || '') + (interimTranscript ? ` ${interimTranscript}` : '')
          if (combined.trim()) {
            setDescription((prev) => {
              // Append naturally if there was prior text, otherwise set
              if (!prev || prev.trim().length === 0) {
                return combined.trim()
              }
              // If finalTranscript is complete, append
              if (finalTranscript) {
                return `${prev.trim()} ${finalTranscript.trim()}`
              }
              return prev
            })

            // Generate title from first few words if title is still empty
            if (!title) {
              const words = combined.trim().split(/\s+/).slice(0, 5).join(' ')
              if (words) {
                setTitle(words.charAt(0).toUpperCase() + words.slice(1))
              }
            }
          }
        },
        onError: (event) => {
          setIsRecording(false)
          if (event.error === 'not-allowed') {
            setStatusMessage(strings.micDenied)
          } else {
            setStatusMessage(strings.idleStatus)
          }
        },
        onEnd: () => {
          setIsRecording(false)
          setStatusMessage(strings.idleStatus)
        },
      })

      recognizerRef.current = recognizer
      recognizer.start()
    } catch {
      setIsRecording(false)
      setStatusMessage(strings.idleStatus)
    }
  }

  // Clear description and record again
  const handleRetry = () => {
    if (recognizerRef.current) {
      recognizerRef.current.abort()
    }
    setIsRecording(false)
    setDescription('')
    setTitle('')
    setStatusMessage(strings.idleStatus)
  }

  // Confirm and Save Memory via authenticated backend API
  const handleConfirmSave = async (e) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      setSaveError(strings.validationError)
      return
    }

    try {
      setIsSaving(true)
      setSaveError('')
      setSaveSuccess('')

      const clientMutationId = `voice-rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category || 'General',
        memoryDate: memoryDate || new Date().toISOString().split('T')[0],
        imageData: '',
        clientMutationId,
      }

      const response = await apiPost('/memories', payload)
      setSaveSuccess(strings.saveSuccess)

      // Allow user to see success before closing
      setTimeout(() => {
        onMemorySaved?.(response.memory || response)
        onClose?.()
        // Reset form
        setTitle('')
        setDescription('')
        setSaveSuccess('')
      }, 900)
    } catch (err) {
      setSaveError(err.message || strings.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="voice-memory-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          handleModalClose()
        }
      }}
      role="presentation"
    >
      <div
        className="voice-memory-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <header className="voice-memory-header">
          <div className="voice-memory-header-info">
            <div className="voice-memory-header-icon" aria-hidden="true">
              🎙️
            </div>
            <div>
              <h2 id={titleId} className="voice-memory-title">
                {strings.title}
              </h2>
              <p className="voice-memory-subtitle">{strings.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            className="voice-memory-close-btn"
            onClick={handleModalClose}
            disabled={isSaving}
            aria-label={strings.cancelButton}
          >
            ✕
          </button>
        </header>

        {/* Body */}
        <div className="voice-memory-body">
          {/* Privacy Notice */}
          <div className="voice-memory-privacy-notice">
            <span
              className="voice-memory-privacy-notice-icon"
              aria-hidden="true"
            >
              🔒
            </span>
            <span>{strings.privacyNotice}</span>
          </div>

          {/* Language Selector for Recording */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <label
              htmlFor="voice-memory-lang"
              style={{ fontWeight: 700, fontSize: '0.92rem', color: '#55342c' }}
            >
              Speaking Language:
            </label>
            <select
              id="voice-memory-lang"
              className="voice-companion-lang-select"
              value={selectedLang}
              onChange={(e) => setUserLangOverride(e.target.value)}
              disabled={isRecording || isSaving}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeLabel} ({lang.label})
                </option>
              ))}
            </select>
          </div>

          {/* Recording Action Card */}
          <div className="voice-memory-rec-card">
            <p className="voice-memory-status-text">
              {statusMessage || strings.idleStatus}
            </p>

            <div className="voice-memory-rec-actions">
              <button
                type="button"
                className={`voice-memory-rec-btn ${
                  isRecording
                    ? 'voice-memory-rec-btn--stop'
                    : 'voice-memory-rec-btn--start'
                }`}
                onClick={handleToggleRecording}
                disabled={isSaving}
                aria-pressed={isRecording}
                aria-label={
                  isRecording
                    ? strings.stopRecording
                    : strings.startRecording
                }
              >
                <span aria-hidden="true" style={{ fontSize: '1.3rem' }}>
                  {isRecording ? '⏹️' : '🎤'}
                </span>
                <span>
                  {isRecording
                    ? strings.stopRecording
                    : strings.startRecording}
                </span>
              </button>

              {description && !isRecording && (
                <button
                  type="button"
                  className="voice-memory-retry-btn"
                  onClick={handleRetry}
                  disabled={isSaving}
                  aria-label={strings.retryRecording}
                >
                  <span aria-hidden="true">🔄</span>
                  <span>{strings.retryRecording}</span>
                </button>
              )}
            </div>
          </div>

          {/* Editable Review Form */}
          <form onSubmit={handleConfirmSave} className="voice-memory-form">
            <div className="voice-memory-field">
              <label htmlFor="vm-title" className="voice-memory-label">
                {strings.memoryTitleLabel} *
              </label>
              <input
                id="vm-title"
                type="text"
                className="voice-memory-input"
                placeholder={strings.memoryTitlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSaving}
              />
            </div>

            <div className="voice-memory-field">
              <label htmlFor="vm-desc" className="voice-memory-label">
                {strings.memoryDescLabel} *
              </label>
              <textarea
                id="vm-desc"
                className="voice-memory-textarea"
                placeholder={strings.memoryDescPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                disabled={isSaving}
              />
            </div>

            <div className="voice-memory-grid">
              <div className="voice-memory-field">
                <label htmlFor="vm-cat" className="voice-memory-label">
                  {strings.categoryLabel}
                </label>
                <select
                  id="vm-cat"
                  className="voice-memory-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSaving}
                >
                  {strings.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="voice-memory-field">
                <label htmlFor="vm-date" className="voice-memory-label">
                  {strings.dateLabel}
                </label>
                <input
                  id="vm-date"
                  type="date"
                  className="voice-memory-input"
                  value={memoryDate}
                  onChange={(e) => setMemoryDate(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Error or Success Feedback */}
            {saveError && (
              <div
                className="voice-memory-msg voice-memory-msg--error"
                role="alert"
              >
                ⚠️ {saveError}
              </div>
            )}
            {saveSuccess && (
              <div
                className="voice-memory-msg voice-memory-msg--success"
                role="status"
              >
                ✓ {saveSuccess}
              </div>
            )}

            {/* Actions */}
            <div className="voice-memory-footer">
              <button
                type="button"
                className="voice-memory-cancel-btn"
                onClick={handleModalClose}
                disabled={isSaving}
              >
                {strings.cancelButton}
              </button>
              <button
                type="submit"
                className="voice-memory-save-btn"
                disabled={isSaving || !title.trim() || !description.trim()}
              >
                <span aria-hidden="true">💾</span>
                <span>
                  {isSaving ? strings.savingButton : strings.saveButton}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
