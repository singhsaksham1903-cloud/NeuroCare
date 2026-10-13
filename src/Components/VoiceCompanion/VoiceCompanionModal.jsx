import { useEffect, useRef, useState, useCallback } from 'react';
import './VoiceCompanionModal.css';
import {
  SUPPORTED_VOICE_LANGUAGES,
  COMPANION_RESPONSES,
  parseVoiceCommand,
  speakMessage,
  stopSpeaking,
} from '../../utils/voiceCompanion';

export default function VoiceCompanionModal({
  isOpen,
  onClose,
  language = 'en',
  onLanguageChange,
  onNavigate,
  currentPage = 'dashboard',
  activeGame = null,
  onRecordMemoryVoice,
}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [companionReply, setCompanionReply] = useState('');
  const [lastInstruction, setLastInstruction] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'denied' | 'unsupported'
  const [errorMessage, setErrorMessage] = useState('');
  const [textCommand, setTextCommand] = useState('');

  const recognitionRef = useRef(null);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSpeechSupported = Boolean(SpeechRecognition);

  const langConfig = SUPPORTED_VOICE_LANGUAGES[language] || SUPPORTED_VOICE_LANGUAGES.en;
  const dialogs = COMPANION_RESPONSES[language] || COMPANION_RESPONSES.en;

  // Set greeting on first open
  useEffect(() => {
    if (isOpen) {
      const initialGreeting = dialogs.greeting;
      setCompanionReply(initialGreeting);
      setStatus('idle');
      setLiveTranscript('');
      setFinalTranscript('');
      setErrorMessage('');
    } else {
      stopListening();
      stopSpeaking();
    }
  }, [isOpen, language]);

  // Handle companion speaking response
  const triggerSpeak = useCallback(
    (textToSpeak) => {
      if (!textToSpeak) return;
      setIsSpeaking(true);
      setStatus('speaking');

      speakMessage({
        text: textToSpeak,
        language,
        onStart: () => {
          setIsSpeaking(true);
          setStatus('speaking');
        },
        onEnd: () => {
          setIsSpeaking(false);
          setStatus('idle');
        },
        onError: () => {
          setIsSpeaking(false);
          setStatus('idle');
        },
      });
    },
    [language],
  );

  // Execute recognized or typed command
  const executeCommand = useCallback(
    (transcript) => {
      setStatus('processing');
      const parsed = parseVoiceCommand(transcript, language);

      if (!parsed) {
        setStatus('idle');
        return;
      }

      if (parsed.intent === 'NAVIGATE') {
        const reply = dialogs[parsed.responseKey] || dialogs.navDashboard;
        setCompanionReply(reply);
        triggerSpeak(reply);
        onNavigate?.(parsed.page);
        return;
      }

      if (parsed.intent === 'NAVIGATE_GAME') {
        const reply = dialogs[parsed.responseKey] || dialogs.navGames;
        setCompanionReply(reply);
        triggerSpeak(reply);
        onNavigate?.(parsed.page, parsed.game);
        return;
      }

      if (parsed.intent === 'RECORD_MEMORY') {
        const reply = dialogs[parsed.responseKey];
        setCompanionReply(reply);
        triggerSpeak(reply);
        onRecordMemoryVoice?.();
        return;
      }

      if (parsed.intent === 'HELP') {
        const reply = dialogs.generalHelp;
        setCompanionReply(reply);
        triggerSpeak(reply);
        return;
      }

      // Unrecognized
      const fallbackReply = dialogs.unrecognized;
      setCompanionReply(fallbackReply);
      triggerSpeak(fallbackReply);
    },
    [dialogs, language, onNavigate, onRecordMemoryVoice, triggerSpeak],
  );

  // Setup SpeechRecognition
  const startListening = () => {
    if (!isSpeechSupported) {
      setStatus('unsupported');
      setErrorMessage(dialogs.speechUnsupported);
      return;
    }

    stopSpeaking();
    setIsSpeaking(false);

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = langConfig.speechRecognitionCode;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setStatus('listening');
        setLiveTranscript('');
        setErrorMessage('');
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setLiveTranscript(interim);
        }

        if (final) {
          setFinalTranscript(final);
          setLiveTranscript(final);
          executeCommand(final);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'no-speech') {
          setStatus('error');
          setErrorMessage(dialogs.noSpeechDetected);
        } else if (event.error === 'not-allowed') {
          setStatus('denied');
          setErrorMessage(dialogs.permissionDenied);
        } else if (event.error !== 'aborted') {
          setStatus('error');
          setErrorMessage(`Error: ${event.error}. Please try again.`);
        } else {
          setStatus('idle');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setStatus('error');
      setErrorMessage(err.message || 'Microphone error');
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
    setStatus('idle');
  };

  // Replay companion's current reply
  const handleReplayResponse = () => {
    if (companionReply) {
      triggerSpeak(companionReply);
    }
  };

  // Speak game instructions if on game page or requested
  const handleHearGameInstructions = (gameKey) => {
    const key = gameKey || activeGame || 'memory-match';
    const instruction = dialogs.games?.[key] || dialogs.games['memory-match'];
    const fullText = `${dialogs.gameInstructionsHeader} ${instruction}`;
    setCompanionReply(fullText);
    setLastInstruction(fullText);
    triggerSpeak(fullText);
  };

  // Repeat last instruction
  const handleRepeatInstruction = () => {
    if (lastInstruction) {
      triggerSpeak(`${dialogs.repeatPrompt} ${lastInstruction}`);
    } else {
      handleHearGameInstructions();
    }
  };

  // Text-based accessible fallback submit
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textCommand.trim()) return;
    setFinalTranscript(textCommand);
    setLiveTranscript(textCommand);
    executeCommand(textCommand);
    setTextCommand('');
  };

  if (!isOpen) return null;

  return (
    <div className="voice-companion-backdrop" role="dialog" aria-modal="true" aria-labelledby="voice-companion-title">
      <div className="voice-companion-modal">
        {/* Header */}
        <div className="voice-companion-header">
          <div className="voice-companion-title-group">
            <span className="voice-companion-badge" aria-hidden="true">
              🎙️
            </span>
            <div>
              <h2 id="voice-companion-title" className="voice-companion-title">
                {language === 'hi' ? 'आवाज़ साथी' : language === 'as' ? 'কণ্ঠ সংগী' : 'Voice Companion'}
              </h2>
              <p className="voice-companion-subtitle">
                {language === 'hi'
                  ? 'बोलकर नेविगेट करें और सहायता पाएँ'
                  : language === 'as'
                  ? 'কণ্ঠেৰে নিৰ্দেশনা দিয়ক আৰু সহায় লওক'
                  : 'Speak commands to navigate or hear instructions'}
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="voice-companion-lang-wrap">
            <label htmlFor="voice-lang-select" className="sr-only">
              Select Language
            </label>
            <select
              id="voice-lang-select"
              value={language}
              onChange={(e) => onLanguageChange?.(e.target.value)}
              className="voice-companion-lang-select"
              aria-label="Change voice companion language"
            >
              {Object.values(SUPPORTED_VOICE_LANGUAGES).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="voice-companion-close-btn"
              onClick={onClose}
              aria-label="Close voice companion"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div
          className={`voice-companion-status-bar voice-companion-status-bar--${status}`}
          role="status"
          aria-live="polite"
        >
          <span className="voice-status-dot" aria-hidden="true" />
          <span className="voice-status-text">
            {status === 'listening'
              ? dialogs.listening
              : status === 'speaking'
              ? 'Speaking response...'
              : status === 'processing'
              ? dialogs.processing
              : status === 'denied'
              ? dialogs.permissionDenied
              : status === 'unsupported'
              ? dialogs.speechUnsupported
              : status === 'error'
              ? errorMessage || 'Could not understand'
              : 'Ready. Press microphone to speak.'}
          </span>
        </div>

        {/* Main Microphone Interaction Circle */}
        <div className="voice-companion-mic-zone">
          <button
            type="button"
            className={`voice-companion-mic-btn ${isListening ? 'voice-companion-mic-btn--active' : ''}`}
            onClick={isListening ? stopListening : startListening}
            aria-label={isListening ? 'Stop listening' : 'Start speaking'}
            aria-pressed={isListening}
          >
            <div className="voice-mic-icon-inner" aria-hidden="true">
              {isListening ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" />
                  <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round" />
                </svg>
              )}
            </div>

            {/* Audio wave pulses (disabled if prefers-reduced-motion) */}
            {isListening && (
              <>
                <span className="voice-wave-ring voice-wave-ring-1" aria-hidden="true" />
                <span className="voice-wave-ring voice-wave-ring-2" aria-hidden="true" />
                <span className="voice-wave-ring voice-wave-ring-3" aria-hidden="true" />
              </>
            )}
          </button>

          <p className="voice-mic-caption">
            {isListening
              ? language === 'hi'
                ? 'सुन रहा हूँ... पूरा होने पर रुकें या दोबारा दबाएँ'
                : language === 'as'
                ? 'শুনি আছোঁ... সমাপ্ত হ’লে ৰওক বা পুনৰ টিপক'
                : 'Listening... speak clearly or tap to stop'
              : language === 'hi'
              ? 'बोलने के लिए माइक दबाएँ'
              : language === 'as'
              ? 'ক’বলৈ মাইকত টিপক'
              : 'Tap to speak a command'}
          </p>
        </div>

        {/* Live Recognized Speech Transcript Box */}
        {(liveTranscript || finalTranscript) && (
          <div className="voice-transcript-card" aria-label="Speech recognition text">
            <span className="voice-transcript-label">
              {language === 'hi' ? 'आपने कहा:' : language === 'as' ? 'আপুনি ক’লে:' : 'You said:'}
            </span>
            <p className="voice-transcript-text">"{liveTranscript || finalTranscript}"</p>
          </div>
        )}

        {/* Companion Reply Card */}
        {companionReply && (
          <div className="voice-reply-card">
            <div className="voice-reply-header">
              <span className="voice-reply-label">
                {language === 'hi' ? 'साथी का उत्तर:' : language === 'as' ? 'সংগীৰ উত্তৰ:' : 'Companion:'}
              </span>
              <div className="voice-reply-actions">
                <button
                  type="button"
                  className="voice-action-btn"
                  onClick={handleReplayResponse}
                  title="Replay response aloud"
                  aria-label="Replay response aloud"
                >
                  🔊 {language === 'hi' ? 'पुनः सुनें' : language === 'as' ? 'পুনৰ শুনক' : 'Replay'}
                </button>
                <button
                  type="button"
                  className="voice-action-btn"
                  onClick={handleRepeatInstruction}
                  title="Repeat instructions"
                  aria-label="Repeat instructions"
                >
                  🔁 {language === 'hi' ? 'नियम दोहराएँ' : language === 'as' ? 'নিয়ম পুনৰাবৃত্তি' : 'Repeat'}
                </button>
              </div>
            </div>
            <p className="voice-reply-text">{companionReply}</p>
          </div>
        )}

        {/* Quick Voice Commands Pills */}
        <div className="voice-quick-commands">
          <span className="voice-quick-label">
            {language === 'hi'
              ? 'सुझाए गए आदेश:'
              : language === 'as'
              ? 'প্ৰস্তাৱিত নিৰ্দেশসমূহ:'
              : 'Suggested Commands:'}
          </span>
          <div className="voice-chips-grid">
            <button
              type="button"
              className="voice-chip"
              onClick={() => executeCommand(language === 'hi' ? 'होम खोलो' : language === 'as' ? 'হোম খোলা' : 'Open home')}
            >
              🏠 {language === 'hi' ? '"होम खोलो"' : language === 'as' ? '"হোম খোলা"' : '"Open home"'}
            </button>
            <button
              type="button"
              className="voice-chip"
              onClick={() => executeCommand(language === 'hi' ? 'मेमोरी गेम शुरू करो' : language === 'as' ? 'মেমৰি গেম আৰম্ভ কৰা' : 'Start memory game')}
            >
              🧠 {language === 'hi' ? '"मेमोरी गेम शुरू करो"' : language === 'as' ? '"মেমৰি গেম আৰম্ভ কৰা"' : '"Start memory game"'}
            </button>
            <button
              type="button"
              className="voice-chip"
              onClick={() => executeCommand(language === 'hi' ? 'मेरी यादें खोलो' : language === 'as' ? 'মোৰ স্মৃতিবোৰ খোলা' : 'Open my memories')}
            >
              📸 {language === 'hi' ? '"मेरी यादें खोलो"' : language === 'as' ? '"মোৰ স্মৃতিবোৰ খোলা"' : '"Open my memories"'}
            </button>
            <button
              type="button"
              className="voice-chip"
              onClick={() => executeCommand(language === 'hi' ? 'मेरी प्रगति दिखाओ' : language === 'as' ? 'মোৰ অগ্ৰগতি দেখুওৱা' : 'Show my progress')}
            >
              📊 {language === 'hi' ? '"मेरी प्रगति दिखाओ"' : language === 'as' ? '"মোৰ অগ্ৰগতি দেখুওৱা"' : '"Show my progress"'}
            </button>
            <button
              type="button"
              className="voice-chip"
              onClick={() => executeCommand(language === 'hi' ? 'रिमाइंडर दिखाओ' : language === 'as' ? 'ৰিমাইণ্ডাৰ দেখুওৱা' : 'Show reminders')}
            >
              ⏰ {language === 'hi' ? '"रिमाइंडर दिखाओ"' : language === 'as' ? '"ৰিমাইণ্ডাৰ দেখুওৱা"' : '"Show reminders"'}
            </button>
            <button
              type="button"
              className="voice-chip voice-chip--highlight"
              onClick={() => executeCommand(language === 'hi' ? 'याद रिकॉर्ड करो' : language === 'as' ? 'স্মৃতি ৰেকৰ্ড কৰা' : 'Record a memory')}
            >
              🎙️ {language === 'hi' ? '"याद रिकॉर्ड करो"' : language === 'as' ? '"স্মৃতি ৰেকৰ্ড কৰা"' : '"Record a memory"'}
            </button>
            <button
              type="button"
              className="voice-chip"
              onClick={() => handleHearGameInstructions(activeGame || 'memory-match')}
            >
              ℹ️ {language === 'hi' ? '"खेल के नियम बताओ"' : language === 'as' ? '"খেলৰ নিয়ম কওক"' : '"Game instructions"'}
            </button>
          </div>
        </div>

        {/* Accessible Text-Based Alternative Input */}
        <form onSubmit={handleTextSubmit} className="voice-text-fallback-form">
          <input
            type="text"
            className="voice-text-fallback-input"
            value={textCommand}
            onChange={(e) => setTextCommand(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'या यहाँ टाइप करें (जैसे: "यादें खोलो", "खेल शुरू करो")...'
                : language === 'as'
                ? 'বা ইয়াত টাইপ কৰক (যেনে: "স্মৃতি খোলা", "খেল আৰম্ভ কৰা")...'
                : 'Or type a command (e.g. "Open memories", "Start games")...'
            }
            aria-label="Type a voice command alternative"
          />
          <button type="submit" className="voice-text-fallback-submit">
            {language === 'hi' ? 'भेजें' : language === 'as' ? 'প্ৰেৰণ' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
