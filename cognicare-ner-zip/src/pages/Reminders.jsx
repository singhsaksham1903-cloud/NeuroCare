import { useEffect, useState } from 'react'

import './Reminders.css'
import VoiceReadAloud from '../Components/VoiceReadAloud'

import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from '../utils/api'


const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'General',
  dueDatetime: '',
  completed: false,
}


/* --------------------------------------------
   Reminder Icon
   -------------------------------------------- */

function ReminderIcon({ type = 'calendar' }) {
  if (type === 'check') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r="23"
          stroke="currentColor"
          strokeWidth="4"
        />

        <path
          d="M21 32.5L28 39L43 24"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (type === 'overdue') {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r="23"
          stroke="currentColor"
          strokeWidth="4"
        />

        <path
          d="M32 20V34"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />

        <circle
          cx="32"
          cy="43"
          r="2.8"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="12"
        y="15"
        width="40"
        height="37"
        rx="8"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        d="M21 11V20"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M43 11V20"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M12 25H52"
        stroke="currentColor"
        strokeWidth="4"
      />

      <path
        d="M22 34H32"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <path
        d="M22 43H39"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}


function Reminders({
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
  onBack,
}) {
  const [reminders, setReminders] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)

  const [editingId, setEditingId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')


  /* --------------------------------------------
     Load reminders
     -------------------------------------------- */

  const loadReminders = async () => {
    try {
      setLoading(true)
      setError('')

      const data = await apiGet('/reminders')

      setReminders(data.reminders || [])
    } catch (err) {
      setError(
        err.message ||
        text.loadError,
      )
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadReminders()
  }, [])


  /* --------------------------------------------
     Form handling
     -------------------------------------------- */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }


  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }


  /* --------------------------------------------
     Save / Update reminder
     -------------------------------------------- */

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (
      !form.title.trim() ||
      !form.description.trim()
    ) {
      setError(
        text.validationError,
      )
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const isEditing = editingId !== null

      const payload = {
        title: form.title.trim(),
        description:
          form.description.trim(),
        category: form.category,
        dueDatetime: form.dueDatetime
          ? new Date(
            form.dueDatetime,
          ).toISOString()
          : null,
        completed: form.completed,
      }

      if (isEditing) {
        await apiPut(
          `/reminders/${editingId}`,
          payload,
        )

        setMessage(
          text.updateSuccess,
        )
      } else {
        await apiPost(
          '/reminders',
          payload,
        )

        setMessage(
          text.saveSuccess,
        )
      }

      resetForm()

      await loadReminders()
    } catch (err) {
      setError(
        err.message ||
        text.saveError,
      )
    } finally {
      setSaving(false)
    }
  }


  /* --------------------------------------------
     Edit reminder
     -------------------------------------------- */

  const handleEdit = (reminder) => {
    let localDateTime = ''

    if (reminder.dueDatetime) {
      const date = new Date(
        reminder.dueDatetime,
      )

      if (!Number.isNaN(date.getTime())) {
        const year = date.getFullYear()

        const month = String(
          date.getMonth() + 1,
        ).padStart(2, '0')

        const day = String(
          date.getDate(),
        ).padStart(2, '0')

        const hours = String(
          date.getHours(),
        ).padStart(2, '0')

        const minutes = String(
          date.getMinutes(),
        ).padStart(2, '0')

        localDateTime =
          `${year}-${month}-${day}T${hours}:${minutes}`
      }
    }

    setEditingId(reminder.id)

    setForm({
      title: reminder.title || '',
      description:
        reminder.description || '',
      category:
        reminder.category || 'General',
      dueDatetime: localDateTime,
      completed: Boolean(
        reminder.completed,
      ),
    })

    setMessage('')
    setError('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }


  /* --------------------------------------------
     Complete / activate reminder
     -------------------------------------------- */

  const handleToggleComplete = async (
    reminder,
  ) => {
    try {
      setError('')
      setMessage('')

      await apiPut(
        `/reminders/${reminder.id}`,
        {
          completed: !reminder.completed,
        },
      )

      setMessage(
        reminder.completed
          ? text.markActiveSuccess
          : text.completeSuccess,
      )

      await loadReminders()
    } catch (err) {
      setError(
        err.message ||
        text.updateError,
      )
    }
  }


  /* --------------------------------------------
     Delete reminder
     -------------------------------------------- */

  const handleDelete = async (
    reminderId,
  ) => {
    const confirmed =
      window.confirm(
        text.deleteConfirm,
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setMessage('')

      await apiDelete(
        `/reminders/${reminderId}`,
      )

      if (editingId === reminderId) {
        resetForm()
      }

      setMessage(
        text.deleteSuccess,
      )

      await loadReminders()
    } catch (err) {
      setError(
        err.message ||
        text.deleteError,
      )
    }
  }


  /* --------------------------------------------
     Date helpers
     -------------------------------------------- */

  const formatDateTime = (value) => {
    if (!value) {
      return text.noDueDate
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleString()
  }


  const isOverdue = (reminder) => {
    if (
      reminder.completed ||
      !reminder.dueDatetime
    ) {
      return false
    }

    const dueDate = new Date(
      reminder.dueDatetime,
    )

    return (
      !Number.isNaN(dueDate.getTime()) &&
      dueDate.getTime() < Date.now()
    )
  }


  /* --------------------------------------------
     Page
     -------------------------------------------- */

  return (
    <div className="reminders-page">

      <header className="reminders-header">

        <button
          type="button"
          className="reminders-back-button"
          onClick={onBack}
        >
          <span
            className="reminders-back-icon"
            aria-hidden="true"
          >
            ←
          </span>

          {text.backToDashboard}
        </button>


        <div className="reminders-heading">

          <div
            className="reminders-heading-icon"
            aria-hidden="true"
          >
            <ReminderIcon />
          </div>

          <div>
            <span className="reminders-eyebrow">
              Cognicare NER
            </span>

            <h1>
              {text.remindersTitle}
            </h1>

            <p>
              {text.remindersDescription}
            </p>
          </div>

        </div>

        <VoiceReadAloud
          text={`${text.remindersTitle}. ${text.remindersDescription}`}
          language={language}
          label={readAloudLabel}
          stopLabel={stopReadingLabel}
        />

      </header>


      {error && (
        <div className="reminders-message reminders-message--error">
          {error}
        </div>
      )}


      {message && (
        <div className="reminders-message reminders-message--success">
          {message}
        </div>
      )}


      <main className="reminders-content">

        {/* ----------------------------------------
            Add / Edit Form
            ---------------------------------------- */}

        <section className="reminder-form-card">

          <div className="reminder-form-heading">

            <div
              className="reminder-form-icon"
              aria-hidden="true"
            >
              <ReminderIcon />
            </div>

            <div>
              <span>
                {editingId !== null
                  ? text.editReminder
                  : text.addReminder}
              </span>

              <h2>
                {editingId !== null
                  ? text.editReminder
                  : text.addReminder}
              </h2>
            </div>

          </div>


          <form
            className="reminder-form"
            onSubmit={handleSubmit}
          >

            <div className="reminder-form-row">

              <label>
                {text.title}

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder={
                    text.titlePlaceholder
                  }
                  maxLength={200}
                />
              </label>


              <label>
                {text.category}

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option value="General">
                    {text.categories.General}
                  </option>

                  <option value="Family">
                    {text.categories.Family}
                  </option>

                  <option value="Appointment">
                    {text.categories.Appointment}
                  </option>

                  <option value="Medication">
                    {text.categories.Medication}
                  </option>

                  <option value="Activity">
                    {text.categories.Activity}
                  </option>

                  <option value="Personal">
                    {text.categories.Personal}
                  </option>

                  <option value="Other">
                    {text.categories.Other}
                  </option>
                </select>
              </label>

            </div>


            <label>
              {text.description}

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={
                  text.descriptionPlaceholder
                }
                rows={4}
                maxLength={5000}
              />
            </label>


            <div className="reminder-form-row">

              <label>
                {text.dueDateTime}

                <input
                  type="datetime-local"
                  name="dueDatetime"
                  value={
                    form.dueDatetime
                  }
                  onChange={handleChange}
                />
              </label>


              {editingId !== null && (
                <label className="reminder-checkbox-label">

                  <input
                    type="checkbox"
                    name="completed"
                    checked={
                      form.completed
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <span>
                    {text.markCompleted}
                  </span>

                </label>
              )}

            </div>


            <div className="reminder-form-actions">

              <button
                type="submit"
                className="reminder-primary-button"
                disabled={saving}
              >
                {saving
                  ? text.saving
                  : editingId !== null
                    ? text.updateReminder
                    : text.saveReminder}
              </button>


              {editingId !== null && (
                <button
                  type="button"
                  className="reminder-secondary-button"
                  onClick={resetForm}
                >
                  {text.cancelEdit}
                </button>
              )}

            </div>

          </form>

        </section>


        {/* ----------------------------------------
            Saved Reminders
            ---------------------------------------- */}

        <section className="reminder-list-section">

          <div className="reminder-list-header">

            <div>

              <span className="reminders-section-label">
                Your schedule
              </span>

              <h2>
                {text.savedReminders}
              </h2>

              <p>
                {text.savedRemindersDescription}
              </p>

            </div>


            <span className="reminder-count">
              {reminders.length}{' '}

              {reminders.length === 1
                ? text.reminder
                : text.remindersPlural}
            </span>

          </div>


          {loading ? (

            <div className="reminder-empty">

              <div
                className="reminder-empty-icon"
                aria-hidden="true"
              >
                <ReminderIcon />
              </div>

              <h3>
                {text.loadingReminders}
              </h3>

            </div>

          ) : reminders.length === 0 ? (

            <div className="reminder-empty">

              <div
                className="reminder-empty-icon"
                aria-hidden="true"
              >
                <ReminderIcon />
              </div>

              <h3>
                {text.noReminders}
              </h3>

              <p>
                Add a reminder above to keep
                important activities easy to remember.
              </p>

            </div>

          ) : (

            <div className="reminder-list">

              {reminders.map(
                (reminder) => {

                  const overdue =
                    isOverdue(reminder)

                  const visualType =
                    reminder.completed
                      ? 'check'
                      : overdue
                        ? 'overdue'
                        : 'calendar'

                  return (
                    <article
                      className={`reminder-card ${reminder.completed
                        ? 'reminder-card--completed'
                        : ''
                        } ${overdue
                          ? 'reminder-card--overdue'
                          : ''
                        }`}
                      key={reminder.id}
                    >

                      <div
                        className="reminder-card-visual"
                        aria-hidden="true"
                      >
                        <ReminderIcon
                          type={visualType}
                        />
                      </div>


                      <div className="reminder-card-body">

                        <div className="reminder-card-header">

                          <div className="reminder-card-main">

                            <h3>
                              {reminder.title}
                            </h3>


                            <div className="reminder-meta">

                              <span className="reminder-category">
                                {
                                  text.categories[
                                  reminder.category
                                  ] ||
                                  reminder.category
                                }
                              </span>


                              {reminder.completed && (
                                <span className="reminder-status reminder-status--completed">
                                  {text.completed}
                                </span>
                              )}


                              {overdue && (
                                <span className="reminder-status reminder-status--overdue">
                                  {text.overdue}
                                </span>
                              )}

                            </div>

                          </div>


                          <time>
                            {formatDateTime(
                              reminder.dueDatetime,
                            )}
                          </time>

                        </div>


                        <p className="reminder-description">
                          {
                            reminder.description
                          }
                        </p>


                        <div className="reminder-card-actions">

                          <button
                            type="button"
                            className="reminder-secondary-button"
                            onClick={() =>
                              handleToggleComplete(
                                reminder,
                              )
                            }
                          >
                            {reminder.completed
                              ? text.markActive
                              : text.markComplete}
                          </button>


                          <button
                            type="button"
                            className="reminder-secondary-button"
                            onClick={() =>
                              handleEdit(
                                reminder,
                              )
                            }
                          >
                            {text.edit}
                          </button>


                          <button
                            type="button"
                            className="reminder-delete-button"
                            onClick={() =>
                              handleDelete(
                                reminder.id,
                              )
                            }
                          >
                            {text.delete}
                          </button>

                        </div>

                      </div>

                    </article>
                  )
                },
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  )
}


export default Reminders