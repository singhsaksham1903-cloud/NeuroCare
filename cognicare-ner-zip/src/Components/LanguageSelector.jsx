import './LanguageSelector.css'

function LanguageSelector({
  language,
  onChange,
  label = 'Language',
}) {
  return (
    <div className="language-selector">

      <label
        htmlFor="language-select"
        className="language-selector-label"
      >
        {label}
      </label>

      <div className="language-selector-control">

        <span
          className="language-selector-icon"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="1.8"
            />

            <path
              d="M3 12H21"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M12 3C14.5 5.5 15.6 8.7 15.6 12C15.6 15.3 14.5 18.5 12 21"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M12 3C9.5 5.5 8.4 8.7 8.4 12C8.4 15.3 9.5 18.5 12 21"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>

        <select
          id="language-select"
          value={language}
          onChange={(event) =>
            onChange(event.target.value)
          }
          aria-label={label}
          className="language-selector-select"
        >
          <option value="en">
            English
          </option>

          <option value="hi">
            हिन्दी
          </option>

          <option value="as">
            অসমীয়া
          </option>
        </select>

      </div>

    </div>
  )
}

export default LanguageSelector