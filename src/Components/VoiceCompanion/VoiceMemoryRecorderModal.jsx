import { useState, useRef, useEffect } from 'react';
import './VoiceMemoryRecorderModal.css';
import { apiPost } from '../../utils/api';
import { SUPPORTED_VOICE_LANGUAGES } from '../../utils/voiceCompanion';

export default function VoiceMemoryRecorderModal({
  isOpen,
  onClose,
  language = 'en',
  onMemorySaved,
}) {
  const [step, setStep] = useState('intro'); // 'intro' | 'recording' | 'review' | 'success'
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [memoryTitle, setMemoryTitle] = useState('');
  const [memoryDescription, setMemoryDescription] = useState('');
  const [memoryCategory, setMemoryCategory] = useState('Personal');
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const recognitionRef = useRef(null);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSpeechSupported = Boolean(SpeechRecognition);
  const langConfig = SUPPORTED_VOICE_LANGUAGES[language] || SUPPORTED_VOICE_LANGUAGES.en;

  const i18n = {
    hi: {
      modalTitle: 'आवाज़ से याद रिकॉर्ड करें',
      introTitle: 'माइक्रोफ़ोन का उपयोग',
      introNotice:
        'आप अपनी याद अपनी ही आवाज़ में बोलकर सहेज सकते हैं। आपकी आवाज़ का अनुवाद या बदलाव नहीं किया जाएगा।',
      introConsent: 'शुरू करने के लिए "रिकॉर्डिंग शुरू करें" पर क्लिक करें और ब्राउज़र में माइक्रोफ़ोन की अनुमति दें।',
      startBtn: 'रिकॉर्डिंग शुरू करें 🎙️',
      listeningHeading: 'हम सुन रहे हैं, कृपया अपनी याद बोलें...',
      listeningSub: 'धीमी और साफ़ आवाज़ में बोलें। पूरा होने पर "समाप्त करें" दबाएँ।',
      stopBtn: 'रिकॉर्डिंग समाप्त करें ⏹️',
      reviewHeading: 'अपनी याद की समीक्षा करें और पुष्टि करें',
      reviewSub: 'कृपया सहेजने से पहले विवरण जाँच लें। केवल आपकी पुष्टि के बाद ही यह याद सहेजी जाएगी।',
      titleLabel: 'याद का शीर्षक',
      descLabel: 'सहेजा गया विवरण (Original Transcript)',
      categoryLabel: 'श्रेणी (Category)',
      dateLabel: 'तारीख',
      confirmSaveBtn: 'याद सहेजें (Confirm & Save)',
      reRecordBtn: 'दोबारा बोलें (Re-record)',
      cancelBtn: 'रद्द करें',
      unsupportedNotice:
        'आपके ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। आप नीचे सीधे टाइप करके अपनी याद सहेज सकते हैं।',
      typeManuallyBtn: 'सीधे टाइप करें',
      successHeading: 'याद सफलतापूर्वक सहेज ली गई!',
      doneBtn: 'हो गया (Done)',
      catFamily: 'परिवार (Family)',
      catFestivals: 'त्यौहार (Festivals)',
      catPlaces: 'स्थान व यात्रा (Places)',
      catPersonal: 'व्यक्तिगत (Personal)',
    },
    as: {
      modalTitle: 'কণ্ঠেৰে স্মৃতি ৰেকৰ্ড কৰক',
      introTitle: 'মাইক্ৰ’ফ’ন ব্যৱহাৰৰ জাননী',
      introNotice:
        'আপুনি নিজৰ ভাষাত স্মৃতি ক’ব পাৰে। আপোনাৰ কোৱা কথাৰ কোনো অনুবাদ বা সালসলনি কৰা নহ’ব।',
      introConsent: 'আৰম্ভ কৰিবলৈ "ৰেকৰ্ডিং আৰম্ভ কৰক"ত টিপক আৰু ব্ৰাউজাৰত অনুমতি প্ৰদান কৰক।',
      startBtn: 'ৰেকৰ্ডিং আৰম্ভ কৰক 🎙️',
      listeningHeading: 'আমি শুনি আছোঁ, অনুগ্ৰহ কৰি কওক...',
      listeningSub: 'স্পষ্টকৈ কওক। কোৱা শেষ হ’লে "সমাপ্ত কৰক" টিপক।',
      stopBtn: 'ৰেকৰ্ডিং সমাপ্ত কৰক ⏹️',
      reviewHeading: 'আপোনাৰ স্মৃতি পৰীক্ষা কৰক আৰু নিশ্চিত কৰক',
      reviewSub: 'সংৰক্ষণ কৰাৰ আগতে পৰীক্ষা কৰক। আপোনাৰ নিশ্চিতিৰ পিছতহে সংৰক্ষিত হ’ব।',
      titleLabel: 'স্মৃতিৰ শিৰোনাম',
      descLabel: 'কণ্ঠৰ পৰা সংগৃহীত বিৱৰণ (Original Transcript)',
      categoryLabel: 'শ্ৰেণী (Category)',
      dateLabel: 'তাৰিখ',
      confirmSaveBtn: 'স্মৃতি সংৰক্ষণ কৰক (Confirm & Save)',
      reRecordBtn: 'পুনৰ কওক (Re-record)',
      cancelBtn: 'বাতিল কৰক',
      unsupportedNotice:
        'আপোনাৰ ব্ৰাউজাৰত কণ্ঠ চিনাক্তকৰণ সমৰ্থিত নহয়। আপুনি পোনে পোনে লিখি সংৰক্ষণ কৰিব পাৰে।',
      typeManuallyBtn: 'পোনে পোনে লিখক',
      successHeading: 'স্মৃতি সফলতাৰে সংৰক্ষিত হ’ল!',
      doneBtn: 'হ’ল (Done)',
      catFamily: 'পৰিয়াল (Family)',
      catFestivals: 'উৎসৱ (Festivals)',
      catPlaces: 'ঠাই আৰু ভ্ৰমণ (Places)',
      catPersonal: 'ব্যক্তিগত (Personal)',
    },
    en: {
      modalTitle: 'Record a Personal Memory by Voice',
      introTitle: 'Microphone Permission & Privacy',
      introNotice:
        'Speak your cherished personal memory in your preferred language. Your original words are preserved exactly as spoken without automated translation or alteration.',
      introConsent:
        'To proceed, click "Start Voice Recording" and grant microphone permission when prompted by your browser.',
      startBtn: 'Start Voice Recording 🎙️',
      listeningHeading: 'Listening carefully, please speak your memory...',
      listeningSub: 'Take your time. When finished, tap "Finish Recording".',
      stopBtn: 'Finish Recording ⏹️',
      reviewHeading: 'Review & Confirm Your Memory',
      reviewSub:
        'Review or edit the transcript below. The memory will ONLY be saved after you explicitly confirm.',
      titleLabel: 'Memory Title',
      descLabel: 'Spoken Memory Transcript (Original Language)',
      categoryLabel: 'Category',
      dateLabel: 'Memory Date',
      confirmSaveBtn: 'Confirm & Save Memory',
      reRecordBtn: 'Re-record Spoken Memory',
      cancelBtn: 'Cancel',
      unsupportedNotice:
        'Voice speech recognition is not supported in this browser. You can type and save your memory manually below.',
      typeManuallyBtn: 'Type Memory Manually',
      successHeading: 'Memory Saved Successfully!',
      doneBtn: 'Done',
      catFamily: 'Family',
      catFestivals: 'Festivals',
      catPlaces: 'Places & Travel',
      catPersonal: 'Personal',
    },
  };

  const t = i18n[language] || i18n.en;

  useEffect(() => {
    if (isOpen) {
      setStep(isSpeechSupported ? 'intro' : 'review');
      setLiveTranscript('');
      setMemoryDescription('');
      setMemoryTitle('');
      setStatusError('');
      setSuccessMessage('');
      setIsListening(false);
    } else {
      stopListening();
    }
  }, [isOpen, isSpeechSupported]);

  const startListening = () => {
    setStatusError('');
    if (!isSpeechSupported) {
      setStep('review');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = langConfig.speechRecognitionCode;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setStep('recording');
        setLiveTranscript('');
      };

      recognition.onresult = (event) => {
        let fullText = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullText += event.results[i][0].transcript + ' ';
        }
        setLiveTranscript(fullText.trim());
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setStatusError(
            'Microphone access denied. Please enable microphone permissions in your browser.',
          );
        } else if (event.error !== 'aborted') {
          setStatusError(`Microphone error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setStatusError(err.message || 'Microphone error');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleFinishRecording = () => {
    stopListening();
    const finalWords = liveTranscript.trim();
    setMemoryDescription(finalWords);

    // Auto-derive a friendly default title if empty
    if (!memoryTitle.trim() && finalWords) {
      const firstWords = finalWords.split(' ').slice(0, 5).join(' ');
      setMemoryTitle(firstWords || 'Personal Memory');
    }

    setStep('review');
  };

  const handleConfirmAndSave = async (e) => {
    e.preventDefault();
    if (!memoryTitle.trim() || !memoryDescription.trim()) {
      setStatusError('Please provide both a title and the memory description.');
      return;
    }

    try {
      setIsSaving(true);
      setStatusError('');

      await apiPost('/memories', {
        title: memoryTitle.trim(),
        description: memoryDescription.trim(),
        category: memoryCategory,
        memoryDate: memoryDate,
        imageData: '',
      });

      setSuccessMessage(t.successHeading);
      setStep('success');
      onMemorySaved?.();
    } catch (err) {
      setStatusError(err.message || 'Failed to save memory. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="voice-memory-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-mem-title"
    >
      <div className="voice-memory-modal">
        {/* Header */}
        <div className="voice-memory-header">
          <div className="voice-memory-title-group">
            <span className="voice-memory-icon-badge" aria-hidden="true">
              🎙️
            </span>
            <h2 id="voice-mem-title" className="voice-memory-title">
              {t.modalTitle}
            </h2>
          </div>
          <button
            type="button"
            className="voice-memory-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {statusError && (
          <div className="voice-memory-alert" role="alert">
            ⚠️ {statusError}
          </div>
        )}

        {/* STEP 1: Intro & Permission Explanation */}
        {step === 'intro' && (
          <div className="voice-memory-step-content">
            <div className="voice-memory-notice-card">
              <h3>{t.introTitle}</h3>
              <p>{t.introNotice}</p>
              <p className="voice-memory-consent-note">{t.introConsent}</p>
            </div>

            <div className="voice-memory-actions-row">
              <button
                type="button"
                className="voice-memory-btn-primary"
                onClick={startListening}
              >
                {t.startBtn}
              </button>
              <button
                type="button"
                className="voice-memory-btn-secondary"
                onClick={() => setStep('review')}
              >
                {t.typeManuallyBtn}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Active Recording */}
        {step === 'recording' && (
          <div className="voice-memory-step-content voice-memory-recording-view">
            <div className="voice-recording-pulse-circle" aria-hidden="true">
              🎙️
            </div>
            <h3 className="voice-recording-heading">{t.listeningHeading}</h3>
            <p className="voice-recording-sub">{t.listeningSub}</p>

            <div className="voice-live-transcript-box">
              <span className="voice-live-transcript-label">Live Spoken Words:</span>
              <p className="voice-live-transcript-text">
                {liveTranscript || '...'}
              </p>
            </div>

            <button
              type="button"
              className="voice-memory-btn-danger"
              onClick={handleFinishRecording}
            >
              {t.stopBtn}
            </button>
          </div>
        )}

        {/* STEP 3: Review & Explicit Confirmation */}
        {step === 'review' && (
          <form onSubmit={handleConfirmAndSave} className="voice-memory-step-content">
            <div className="voice-memory-review-banner">
              <h3>{t.reviewHeading}</h3>
              <p>{t.reviewSub}</p>
            </div>

            <div className="voice-form-group">
              <label htmlFor="voice-mem-title-input" className="voice-form-label">
                {t.titleLabel} *
              </label>
              <input
                id="voice-mem-title-input"
                type="text"
                className="voice-form-input"
                value={memoryTitle}
                onChange={(e) => setMemoryTitle(e.target.value)}
                placeholder="e.g. Bihu celebration with family"
                required
              />
            </div>

            <div className="voice-form-group">
              <label htmlFor="voice-mem-desc-input" className="voice-form-label">
                {t.descLabel} *
              </label>
              <textarea
                id="voice-mem-desc-input"
                className="voice-form-textarea"
                rows={5}
                value={memoryDescription}
                onChange={(e) => setMemoryDescription(e.target.value)}
                placeholder="Spoken memory details..."
                required
              />
            </div>

            <div className="voice-form-row">
              <div className="voice-form-group">
                <label htmlFor="voice-mem-cat-select" className="voice-form-label">
                  {t.categoryLabel}
                </label>
                <select
                  id="voice-mem-cat-select"
                  className="voice-form-select"
                  value={memoryCategory}
                  onChange={(e) => setMemoryCategory(e.target.value)}
                >
                  <option value="Personal">{t.catPersonal}</option>
                  <option value="Family">{t.catFamily}</option>
                  <option value="Festivals">{t.catFestivals}</option>
                  <option value="Places">{t.catPlaces}</option>
                </select>
              </div>

              <div className="voice-form-group">
                <label htmlFor="voice-mem-date-input" className="voice-form-label">
                  {t.dateLabel}
                </label>
                <input
                  id="voice-mem-date-input"
                  type="date"
                  className="voice-form-input"
                  value={memoryDate}
                  onChange={(e) => setMemoryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="voice-memory-actions-row">
              <button
                type="submit"
                className="voice-memory-btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : t.confirmSaveBtn}
              </button>
              {isSpeechSupported && (
                <button
                  type="button"
                  className="voice-memory-btn-secondary"
                  onClick={startListening}
                >
                  {t.reRecordBtn}
                </button>
              )}
              <button
                type="button"
                className="voice-memory-btn-text"
                onClick={onClose}
              >
                {t.cancelBtn}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Success Message */}
        {step === 'success' && (
          <div className="voice-memory-step-content voice-memory-success-view">
            <span className="voice-success-icon" aria-hidden="true">
              ✅
            </span>
            <h3 className="voice-success-heading">{successMessage}</h3>
            <p>
              Your personal memory has been securely saved to your account.
            </p>
            <button
              type="button"
              className="voice-memory-btn-primary"
              onClick={onClose}
            >
              {t.doneBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
