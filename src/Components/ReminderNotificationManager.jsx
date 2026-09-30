import {
    useEffect,
    useRef,
    useState,
} from 'react'
import './ReminderNotificationManager.css'


const DEFAULT_TEXT = {
    enableNotifications:
        'Enable Reminder Alerts',

    notificationsEnabled:
        'Reminder alerts are enabled.',

    notificationsDenied:
        'Reminder alerts are blocked. Please allow notifications in your browser settings.',

    notificationsUnsupported:
        'This browser does not support system notifications.',

    notificationReady:
        'You will receive an alert when a reminder becomes due.',

    reminderDue:
        'Reminder Due',

    dismiss:
        'Dismiss',

    alerts:
        'Alerts',

    speakReminder:
        'Your reminder is due.',
}


// ============================================================
// Browser notification helper
// ============================================================

async function showBrowserNotification(
    reminder,
    language,
) {
    if (
        typeof window === 'undefined' ||
        !('Notification' in window)
    ) {
        return false
    }


    if (
        Notification.permission !==
        'granted'
    ) {
        return false
    }


    const title =
        `🔔 ${reminder.title}`


    const body =
        reminder.description?.trim() ||
        'Your reminder is due.'


    const tag =
        `cognicare-reminder-${reminder.id}-${reminder.dueDatetime}`


    const options = {
        body,

        lang:
            language ||
            'en-IN',

        tag,

        renotify:
            true,

        requireInteraction:
            true,

        data: {
            reminderId:
                reminder.id,
        },
    }


    /*
     * Prefer the active service worker when available.
     * This is useful for the PWA version.
     */

    try {
        if (
            'serviceWorker' in
            navigator
        ) {
            const registration =
                await navigator
                    .serviceWorker
                    .getRegistration()


            if (
                registration
            ) {
                await registration
                    .showNotification(
                        title,
                        options,
                    )

                return true
            }
        }
    } catch {
        /*
         * Fall through to the
         * normal browser notification.
         */
    }


    /*
     * Desktop / localhost fallback.
     */

    try {
        const notification =
            new Notification(
                title,
                options,
            )


        notification.onclick =
            () => {
                window.focus()
                notification.close()
            }


        return true
    } catch {
        return false
    }
}


// ============================================================
// Read reminder aloud
// ============================================================

function speakReminder(
    reminder,
    language,
) {
    if (
        typeof window === 'undefined' ||
        !('speechSynthesis' in window)
    ) {
        return
    }


    try {
        window.speechSynthesis.cancel()


        const title =
            reminder.title?.trim() ||
            'Reminder'


        const description =
            reminder.description?.trim() ||
            ''


        const utterance =
            new SpeechSynthesisUtterance(
                `${title}. ${description}`,
            )


        utterance.lang =
            language ||
            'en-IN'


        utterance.rate =
            0.9


        utterance.pitch =
            1


        window.speechSynthesis.speak(
            utterance,
        )

    } catch {
        /*
         * Speech failure should never
         * prevent the reminder notification.
         */
    }
}


// ============================================================
// Reminder Notification Manager
// ============================================================

function ReminderNotificationManager({
    reminders = [],
    language = 'en-IN',
    text = {},
}) {
    const ui = {
        ...DEFAULT_TEXT,
        ...(text || {}),
    }


    // ========================================================
    // Notification permission
    // ========================================================

    const [
        permission,
        setPermission,
    ] = useState(() => {

        if (
            typeof window === 'undefined'
        ) {
            return 'unsupported'
        }


        if (
            !('Notification' in window)
        ) {
            return 'unsupported'
        }


        return Notification.permission
    })


    // ========================================================
    // In-app active alert
    // ========================================================

    const [
        activeReminder,
        setActiveReminder,
    ] = useState(null)


    // ========================================================
    // Status
    // ========================================================

    const [
        statusMessage,
        setStatusMessage,
    ] = useState('')


    // ========================================================
    // Already-notified reminders
    // ========================================================

    const notifiedRef =
        useRef(
            new Set(),
        )


    // ========================================================
    // Request notification permission
    // ========================================================

    const enableNotifications =
        async () => {

            if (
                typeof window === 'undefined' ||
                !('Notification' in window)
            ) {
                setPermission(
                    'unsupported',
                )

                setStatusMessage(
                    ui.notificationsUnsupported,
                )

                return
            }


            try {

                const result =
                    await Notification.requestPermission()


                setPermission(
                    result,
                )


                if (
                    result === 'granted'
                ) {
                    setStatusMessage(
                        ui.notificationReady,
                    )
                } else if (
                    result === 'denied'
                ) {
                    setStatusMessage(
                        ui.notificationsDenied,
                    )
                } else {
                    setStatusMessage(
                        ui.notificationReady,
                    )
                }

            } catch {
                setStatusMessage(
                    ui.notificationsDenied,
                )
            }
        }


    // ========================================================
    // Check reminders periodically
    // ========================================================

    useEffect(() => {

        if (
            !Array.isArray(
                reminders,
            ) ||
            reminders.length === 0
        ) {
            return undefined
        }


        const checkReminders =
            () => {

                const currentTime =
                    Date.now()


                for (
                    const reminder
                    of reminders
                ) {

                    if (
                        reminder.completed
                    ) {
                        continue
                    }


                    if (
                        !reminder.dueDatetime
                    ) {
                        continue
                    }


                    const dueTime =
                        new Date(
                            reminder.dueDatetime,
                        ).getTime()


                    if (
                        Number.isNaN(
                            dueTime,
                        )
                    ) {
                        continue
                    }


                    if (
                        dueTime >
                        currentTime
                    ) {
                        continue
                    }


                    const notificationKey =
                        [
                            reminder.id,
                            reminder.dueDatetime,
                        ].join(':')


                    if (
                        notifiedRef.current.has(
                            notificationKey,
                        )
                    ) {
                        continue
                    }


                    notifiedRef.current.add(
                        notificationKey,
                    )


                    setActiveReminder(
                        reminder,
                    )


                    /*
                     * Browser notification.
                     */

                    void showBrowserNotification(
                        reminder,
                        language,
                    )


                    /*
                     * Optional spoken reminder.
                     */

                    speakReminder(
                        reminder,
                        language,
                    )


                    /*
                     * Handle only one reminder
                     * per scheduler tick.
                     */

                    break
                }
            }


        /*
         * Small delay for the initial check,
         * avoiding synchronous state changes
         * directly inside the effect body.
         */

        const initialTimer =
            window.setTimeout(
                checkReminders,
                500,
            )


        /*
         * Check every 10 seconds.
         */

        const interval =
            window.setInterval(
                checkReminders,
                10000,
            )


        return () => {

            window.clearTimeout(
                initialTimer,
            )

            window.clearInterval(
                interval,
            )
        }

    }, [
        reminders,
        language,
    ])


    // ========================================================
    // Unsupported
    // ========================================================

    if (
        permission ===
        'unsupported'
    ) {
        return (
            <section className="reminder-notification-tools">

                <div className="reminder-notification-row">

                    <span
                        className="reminder-notification-icon"
                        aria-hidden="true"
                    >
                        🔔
                    </span>

                    <div>
                        <strong>
                            {ui.alerts}
                        </strong>

                        <p>
                            {
                                ui.notificationsUnsupported
                            }
                        </p>
                    </div>

                </div>

            </section>
        )
    }


    // ========================================================
    // Main
    // ========================================================

    return (
        <>
            <section className="reminder-notification-tools">

                <div className="reminder-notification-row">

                    <span
                        className="reminder-notification-icon"
                        aria-hidden="true"
                    >
                        🔔
                    </span>


                    <div className="reminder-notification-content">

                        <strong>
                            {ui.alerts}
                        </strong>


                        {permission ===
                            'granted' ? (
                            <p>
                                {
                                    ui.notificationsEnabled
                                }
                            </p>
                        ) : permission ===
                            'denied' ? (
                            <p>
                                {
                                    ui.notificationsDenied
                                }
                            </p>
                        ) : (
                            <p>
                                {
                                    ui.notificationReady
                                }
                            </p>
                        )}

                    </div>


                    {permission !==
                        'granted' &&
                        permission !==
                        'denied' && (
                            <button
                                type="button"
                                className="reminder-notification-button"
                                onClick={
                                    enableNotifications
                                }
                            >
                                {
                                    ui.enableNotifications
                                }
                            </button>
                        )}

                </div>


                {statusMessage && (
                    <p
                        className="reminder-notification-status"
                        role="status"
                    >
                        {statusMessage}
                    </p>
                )}

            </section>


            {activeReminder && (
                <aside
                    className="reminder-alert-banner"
                    role="alert"
                >

                    <div
                        className="reminder-alert-icon"
                        aria-hidden="true"
                    >
                        🔔
                    </div>


                    <div className="reminder-alert-content">

                        <span>
                            {ui.reminderDue}
                        </span>


                        <h3>
                            {
                                activeReminder.title
                            }
                        </h3>


                        {activeReminder.description && (
                            <p>
                                {
                                    activeReminder.description
                                }
                            </p>
                        )}

                    </div>


                    <button
                        type="button"
                        className="reminder-alert-dismiss"
                        onClick={() =>
                            setActiveReminder(
                                null,
                            )
                        }
                    >
                        {ui.dismiss}
                    </button>

                </aside>
            )}
        </>
    )
}


export default ReminderNotificationManager