import { useEffect, useState } from 'react'

import './Memories.css'
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
  memoryDate: '',
}


// ============================================
// Memory Icon
// ============================================

function MemoryIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="10"
        y="12"
        width="44"
        height="40"
        rx="9"
        stroke="currentColor"
        strokeWidth="3"
      />

      <rect
        x="17"
        y="20"
        width="30"
        height="22"
        rx="5"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      <circle
        cx="27"
        cy="27"
        r="4"
        stroke="currentColor"
        strokeWidth="2.5"
      />

      <path
        d="M20 38L29 32L35 36L39 33L44 39"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


// ============================================
// Memories Page
// ============================================

function Memories({
  text,
  language = 'en-IN',
  readAloudLabel = 'Read Aloud',
  stopReadingLabel = 'Stop Reading',
  onBack,
}) {
  const [memories, setMemories] =
    useState([])

  const [form, setForm] =
    useState(EMPTY_FORM)

  const [editingId, setEditingId] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')


  // ==========================================
  // Load Memories
  // ==========================================

  const loadMemories = async () => {
    try {
      setLoading(true)
      setError('')

      const data =
        await apiGet('/memories')

      setMemories(
        data.memories || [],
      )
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
    loadMemories()
  }, [])


  // ==========================================
  // Form
  // ==========================================

  const handleChange = (
    event,
  ) => {
    const {
      name,
      value,
    } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }


  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }


  // ==========================================
  // Save / Update
  // ==========================================

  const handleSubmit = async (
    event,
  ) => {
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

      const isEditing =
        editingId !== null

      const payload = {
        title:
          form.title.trim(),

        description:
          form.description.trim(),

        category:
          form.category,

        memoryDate:
          form.memoryDate ||
          null,
      }

      if (isEditing) {
        await apiPut(
          `/memories/${editingId}`,
          payload,
        )

        setMessage(
          text.updateSuccess,
        )
      } else {
        await apiPost(
          '/memories',
          payload,
        )

        setMessage(
          text.saveSuccess,
        )
      }

      resetForm()

      await loadMemories()

    } catch (err) {
      setError(
        err.message ||
        text.saveError,
      )
    } finally {
      setSaving(false)
    }
  }


  // ==========================================
  // Edit
  // ==========================================

  const handleEdit = (
    memory,
  ) => {
    setEditingId(memory.id)

    setForm({
      title:
        memory.title || '',

      description:
        memory.description || '',

      category:
        memory.category ||
        'General',

      memoryDate:
        memory.memoryDate || '',
    })

    setMessage('')
    setError('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }


  // ==========================================
  // Delete
  // ==========================================

  const handleDelete = async (
    memoryId,
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
        `/memories/${memoryId}`,
      )

      if (
        editingId === memoryId
      ) {
        resetForm()
      }

      setMessage(
        text.deleteSuccess,
      )

      await loadMemories()

    } catch (err) {
      setError(
        err.message ||
        text.deleteError,
      )
    }
  }


  // ==========================================
  // Date
  // ==========================================

  const formatDate = (
    value,
  ) => {
    if (!value) {
      return text.noDate
    }

    const parsedDate =
      new Date(value)

    if (
      Number.isNaN(
        parsedDate.getTime(),
      )
    ) {
      return value
    }

    return parsedDate.toLocaleDateString()
  }


  return (
    <div className="memories-page">

      {/* ======================================
                Header
                ====================================== */}

      <header className="memories-header">

        <button
          type="button"
          className="memories-back-button"
          onClick={onBack}
        >
          <span aria-hidden="true">
            ←
          </span>

          {text.backToDashboard}
        </button>


        <div className="memories-heading">

          <div
            className="memories-heading-icon"
            aria-hidden="true"
          >
            <MemoryIcon />
          </div>

          <div>

            <span className="memories-eyebrow">
              {text.savedMemories}
            </span>

            <h1>
              {text.memoriesTitle}
            </h1>

            <p>
              {text.memoriesDescription}
            </p>

          </div>

        </div>


        <VoiceReadAloud
          text={`${text.memoriesTitle}. ${text.memoriesDescription}`}
          language={language}
          label={readAloudLabel}
          stopLabel={stopReadingLabel}
        />

      </header>


      {/* ======================================
                Messages
                ====================================== */}

      {error && (
        <div className="memories-message memories-message--error">
          {error}
        </div>
      )}


      {message && (
        <div className="memories-message memories-message--success">
          {message}
        </div>
      )}


      <main className="memories-content">

        {/* ==================================
                    Add / Edit Form
                    ================================== */}

        <section className="memory-form-card">

          <div className="memory-form-heading">

            <div className="memory-form-icon">
              <MemoryIcon />
            </div>

            <div>

              <span>
                {editingId !== null
                  ? text.editMemory
                  : text.addMemory}
              </span>

              <h2>
                {editingId !== null
                  ? text.editMemory
                  : text.addMemory}
              </h2>

            </div>

          </div>


          <form
            className="memory-form"
            onSubmit={
              handleSubmit
            }
          >

            <label>
              {text.title}

              <input
                type="text"
                name="title"
                value={
                  form.title
                }
                onChange={
                  handleChange
                }
                placeholder={
                  text.titlePlaceholder
                }
                maxLength={200}
              />
            </label>


            <label>
              {text.description}

              <textarea
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                placeholder={
                  text.descriptionPlaceholder
                }
                rows={5}
                maxLength={5000}
              />
            </label>


            <div className="memory-form-row">

              <label>
                {text.category}

                <select
                  name="category"
                  value={
                    form.category
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="General">
                    {
                      text.categories
                        .General
                    }
                  </option>

                  <option value="Family">
                    {
                      text.categories
                        .Family
                    }
                  </option>

                  <option value="Friends">
                    {
                      text.categories
                        .Friends
                    }
                  </option>

                  <option value="Travel">
                    {
                      text.categories
                        .Travel
                    }
                  </option>

                  <option value="Celebration">
                    {
                      text.categories
                        .Celebration
                    }
                  </option>

                  <option value="Childhood">
                    {
                      text.categories
                        .Childhood
                    }
                  </option>

                  <option value="Other">
                    {
                      text.categories
                        .Other
                    }
                  </option>

                </select>
              </label>


              <label>
                {text.memoryDate}

                <input
                  type="date"
                  name="memoryDate"
                  value={
                    form.memoryDate
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>

            </div>


            <div className="memory-form-actions">

              <button
                type="submit"
                className="memory-primary-button"
                disabled={saving}
              >
                {saving
                  ? text.saving
                  : editingId !== null
                    ? text.updateMemory
                    : text.saveMemory}
              </button>


              {editingId !== null && (
                <button
                  type="button"
                  className="memory-secondary-button"
                  onClick={
                    resetForm
                  }
                >
                  {text.cancelEdit}
                </button>
              )}

            </div>

          </form>

        </section>


        {/* ==================================
                    Saved Memories
                    ================================== */}

        <section className="memory-list-section">

          <div className="memory-list-header">

            <div>

              <span className="memories-section-label">
                {text.savedMemories}
              </span>

              <h2>
                {text.savedMemories}
              </h2>

              <p>
                {
                  text.savedMemoriesDescription
                }
              </p>

            </div>


            <span className="memory-count">
              {memories.length}{' '}

              {memories.length === 1
                ? text.memory
                : text.memoriesPlural}
            </span>

          </div>


          {loading ? (

            <div className="memory-empty">
              {text.loadingMemories}
            </div>

          ) : memories.length === 0 ? (

            <div className="memory-empty">

              <div
                className="memory-empty-icon"
                aria-hidden="true"
              >
                <MemoryIcon />
              </div>

              <h3>
                {text.noMemories}
              </h3>

              <p>
                {
                  text.savedMemoriesDescription
                }
              </p>

            </div>

          ) : (

            <div className="memory-list">

              {memories.map(
                (memory) => (
                  <article
                    className="memory-card"
                    key={memory.id}
                  >

                    <div className="memory-card-visual">
                      <MemoryIcon />
                    </div>


                    <div className="memory-card-body">

                      <div className="memory-card-header">

                        <div>

                          <h3>
                            {
                              memory.title
                            }
                          </h3>

                          <span className="memory-category">
                            {
                              text.categories[
                              memory.category
                              ] ||
                              memory.category
                            }
                          </span>

                        </div>


                        <time>
                          {formatDate(
                            memory.memoryDate,
                          )}
                        </time>

                      </div>


                      <p>
                        {
                          memory.description
                        }
                      </p>


                      <div className="memory-card-actions">

                        <button
                          type="button"
                          className="memory-secondary-button"
                          onClick={() =>
                            handleEdit(
                              memory,
                            )
                          }
                        >
                          {text.edit}
                        </button>


                        <button
                          type="button"
                          className="memory-delete-button"
                          onClick={() =>
                            handleDelete(
                              memory.id,
                            )
                          }
                        >
                          {text.delete}
                        </button>

                      </div>

                    </div>

                  </article>
                ),
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  )
}


export default Memories