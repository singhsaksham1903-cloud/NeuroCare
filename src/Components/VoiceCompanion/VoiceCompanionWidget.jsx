import { useState } from 'react'
import { toShortLanguageCode } from '../../utils/voiceCompanion'
import VoiceCompanionModal from './VoiceCompanionModal'
import './VoiceCompanionWidget.css'

const WIDGET_LABELS = {
  en: {
    label: 'Voice Companion',
    badge: 'AI',
    ariaLabel: 'Open Multilingual Voice Companion',
  },
  hi: {
    label: 'आवाज सहायक',
    badge: 'AI',
    ariaLabel: 'बहुभाषी आवाज सहायक खोलें',
  },
  as: {
    label: 'কণ্ঠ সংগী',
    badge: 'AI',
    ariaLabel: 'বহুভাষিক কণ্ঠ সংগী খোলক',
  },
}

export default function VoiceCompanionWidget({
  language = 'en-IN',
  onLanguageChange,
  onNavigate,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const shortLang = toShortLanguageCode(language)
  const text = WIDGET_LABELS[shortLang] || WIDGET_LABELS.en

  return (
    <>
      <div className="voice-companion-widget-container">
        <button
          type="button"
          className="voice-companion-widget-btn"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={text.ariaLabel}
        >
          <span className="voice-companion-widget-icon" aria-hidden="true">
            🎙️
          </span>
          <span className="voice-companion-widget-text">{text.label}</span>
          <span className="voice-companion-widget-badge" aria-hidden="true">
            {text.badge}
          </span>
        </button>
      </div>

      <VoiceCompanionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        language={language}
        onLanguageChange={onLanguageChange}
        onNavigate={(targetPage, gameId) => {
          setIsOpen(false)
          onNavigate?.(targetPage, gameId)
        }}
      />
    </>
  )
}

