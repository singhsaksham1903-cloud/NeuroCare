import { useEffect, useState } from 'react'

import './OfflineStatus.css'

function OfflineStatus({ text }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined'
      ? navigator.onLine
      : true,
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener(
      'online',
      handleOnline,
    )

    window.addEventListener(
      'offline',
      handleOffline,
    )

    return () => {
      window.removeEventListener(
        'online',
        handleOnline,
      )

      window.removeEventListener(
        'offline',
        handleOffline,
      )
    }
  }, [])

  return (
    <div
      className={`offline-status ${
        isOnline
          ? 'offline-status--online'
          : 'offline-status--offline'
      }`}
      role="status"
      aria-live="polite"
      title={
        isOnline
          ? text.online
          : text.offline
      }
    >
      <span
        className="offline-status-dot"
        aria-hidden="true"
      />

      <span>
        {isOnline
          ? text.online
          : text.offline}
      </span>
    </div>
  )
}

export default OfflineStatus