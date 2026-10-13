import './VoiceCompanionWidget.css';

export default function VoiceCompanionWidget({
  onOpenCompanion,
  language = 'en',
  isInlineCard = false,
}) {
  const labels = {
    hi: {
      title: 'आवाज़ साथी (Voice Companion)',
      desc: 'बोलकर खेल शुरू करें, यादें देखें या सहायता पाएँ।',
      button: 'साथी से बात करें 🎙️',
      floatingLabel: 'आवाज़ साथी खोलें',
    },
    as: {
      title: 'কণ্ঠ সংগী (Voice Companion)',
      desc: 'কণ্ঠেৰে খেল আৰম্ভ কৰক, স্মৃতি চাওক বা সহায় লওক।',
      button: 'সংগীৰ সৈতে কথা পাতক 🎙️',
      floatingLabel: 'কণ্ঠ সংগী খোলক',
    },
    en: {
      title: 'Voice Companion',
      desc: 'Speak freely to open games, view memories, and navigate easily.',
      button: 'Talk to Companion 🎙️',
      floatingLabel: 'Open Voice Companion',
    },
  };

  const text = labels[language] || labels.en;

  if (isInlineCard) {
    return (
      <article className="voice-companion-card">
        <div className="voice-companion-card-visual" aria-hidden="true">
          <span className="voice-companion-card-icon">🎙️</span>
        </div>
        <div className="voice-companion-card-body">
          <span className="voice-companion-card-tag">Multilingual Voice</span>
          <h2 className="voice-companion-card-title">{text.title}</h2>
          <p className="voice-companion-card-desc">{text.desc}</p>
          <button
            type="button"
            className="voice-companion-card-btn"
            onClick={onOpenCompanion}
            aria-label={`${text.title} — ${text.button}`}
          >
            {text.button}
          </button>
        </div>
      </article>
    );
  }

  return (
    <button
      type="button"
      className="voice-companion-floating-btn"
      onClick={onOpenCompanion}
      aria-label={text.floatingLabel}
      title={text.floatingLabel}
    >
      <span className="voice-floating-icon" aria-hidden="true">
        🎙️
      </span>
      <span className="voice-floating-text">
        {language === 'hi' ? 'आवाज़ साथी' : language === 'as' ? 'কণ্ঠ সংগী' : 'Voice Companion'}
      </span>
    </button>
  );
}
