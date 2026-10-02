import {
  useCallback,
  useEffect,
  useState,
} from 'react'

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
  imageData: '',
}


const IMAGE_TEXT = {
  en: {
    label: 'Memory Image (optional)',
    choose: 'Choose an image',
    change: 'Change image',
    add: 'Add image',
    remove: 'Remove image',
    hint: 'JPG, PNG or WebP. The image is resized automatically.',
    invalid: 'Please choose an image file.',
    tooLarge: 'Please choose an image smaller than 5 MB.',
    failed: 'Could not process the image. Please try another file.',
    saving: 'Saving image...',
  },
  hi: {
    label: 'याद की तस्वीर (वैकल्पिक)',
    choose: 'तस्वीर चुनें',
    change: 'तस्वीर बदलें',
    add: 'तस्वीर जोड़ें',
    remove: 'तस्वीर हटाएँ',
    hint: 'JPG, PNG या WebP. तस्वीर अपने आप छोटे आकार में सहेजी जाएगी।',
    invalid: 'कृपया एक तस्वीर चुनें।',
    tooLarge: 'कृपया 5 MB से छोटी तस्वीर चुनें।',
    failed: 'तस्वीर तैयार नहीं हो सकी। कृपया दूसरी फ़ाइल चुनें।',
    saving: 'तस्वीर सहेजी जा रही है...',
  },
  as: {
    label: 'স্মৃতিৰ ছবি (ঐচ্ছিক)',
    choose: 'ছবি বাছনি কৰক',
    change: 'ছবি সলনি কৰক',
    add: 'ছবি যোগ কৰক',
    remove: 'ছবি আঁতৰাওক',
    hint: 'JPG, PNG বা WebP। ছবিখন স্বয়ংক্রিয়ভাৱে সৰু কৰি সংৰক্ষণ কৰা হ’ব।',
    invalid: 'অনুগ্ৰহ কৰি এখন ছবি বাছনি কৰক।',
    tooLarge: 'অনুগ্ৰহ কৰি 5 MB-তকৈ সৰু ছবি বাছনি কৰক।',
    failed: 'ছবিখন প্ৰস্তুত কৰিব পৰা নগ’ল। আন এটা ফাইল চেষ্টা কৰক।',
    saving: 'ছবি সংৰক্ষণ কৰা হৈছে...',
  },
}

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 1200
const IMAGE_QUALITY = 0.82
const MAX_IMAGE_DATA_LENGTH = 1200000


function getImageText(language) {
  const key = String(language || 'en').slice(0, 2)
  return IMAGE_TEXT[key] || IMAGE_TEXT.en
}


function prepareMemoryImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('invalid'))
      return
    }

    if (file.size > MAX_IMAGE_FILE_SIZE) {
      reject(new Error('tooLarge'))
      return
    }

    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error('failed'))
    }

    reader.onload = () => {
      const image = new Image()

      image.onload = () => {
        const longestSide = Math.max(
          image.naturalWidth,
          image.naturalHeight,
        )

        const scale = Math.min(
          1,
          MAX_IMAGE_DIMENSION / longestSide,
        )

        const width = Math.max(
          1,
          Math.round(image.naturalWidth * scale),
        )

        const height = Math.max(
          1,
          Math.round(image.naturalHeight * scale),
        )

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext('2d')

        if (!context) {
          reject(new Error('failed'))
          return
        }

        context.drawImage(image, 0, 0, width, height)

        let dataUrl

        try {
          dataUrl = canvas.toDataURL(
            'image/webp',
            IMAGE_QUALITY,
          )
        } catch {
          dataUrl = ''
        }

        if (!dataUrl || dataUrl === 'data:image/webp,') {
          try {
            dataUrl = canvas.toDataURL(
              'image/jpeg',
              IMAGE_QUALITY,
            )
          } catch {
            dataUrl = ''
          }
        }

        if (
          !dataUrl ||
          dataUrl.length > MAX_IMAGE_DATA_LENGTH
        ) {
          reject(new Error('tooLarge'))
          return
        }

        resolve(dataUrl)
      }

      image.onerror = () => {
        reject(new Error('failed'))
      }

      image.src = String(reader.result || '')
    }

    reader.readAsDataURL(file)
  })
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

  const [imageSavingId, setImageSavingId] =
    useState(null)

  const imageText = getImageText(language)


  // ==========================================
  // Load Memories
  // ==========================================

  const loadMemories = useCallback(async () => {
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
  }, [text.loadError])


  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMemories()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadMemories])


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


  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      setError('')
      const imageData = await prepareMemoryImage(file)

      setForm((currentForm) => ({
        ...currentForm,
        imageData,
      }))
    } catch (err) {
      setError(
        err.message === 'invalid'
          ? imageText.invalid
          : err.message === 'tooLarge'
            ? imageText.tooLarge
            : imageText.failed,
      )
    }
  }


  const handleRemoveImage = () => {
    setForm((currentForm) => ({
      ...currentForm,
      imageData: '',
    }))
  }


  const handleSavedMemoryImageChange = async (
    memoryId,
    event,
  ) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) {
      return
    }

    try {
      setError('')
      setMessage('')
      setImageSavingId(memoryId)

      const imageData =
        await prepareMemoryImage(file)

      // Show the image immediately in the UI.
      setMemories((currentMemories) =>
        currentMemories.map((memory) =>
          memory.id === memoryId
            ? {
              ...memory,
              imageData,
            }
            : memory,
        ),
      )

      await apiPut(
        `/memories/${memoryId}`,
        {
          imageData,
        },
      )

      setMessage(
        text.updateSuccess,
      )

      // Reload from backend/cache so the
      // saved state is confirmed.
      await loadMemories()
    } catch (err) {
      setError(
        err.message === 'invalid'
          ? imageText.invalid
          : err.message === 'tooLarge'
            ? imageText.tooLarge
            : err.message ||
            imageText.failed,
      )
    } finally {
      setImageSavingId(null)
    }
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

        imageData:
          form.imageData ||
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

      imageData:
        memory.imageData || '',
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


            <label className="memory-image-field">
              {imageText.label}

              <input
                type="file"
                name="memoryImage"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
              />
            </label>


            <div className="memory-image-preview">
              <div className="memory-image-preview-visual">
                {form.imageData ? (
                  <img
                    src={form.imageData}
                    alt="Memory preview"
                  />
                ) : (
                  <MemoryIcon />
                )}
              </div>

              <div className="memory-image-preview-content">
                <strong>
                  {form.imageData
                    ? imageText.change
                    : imageText.choose}
                </strong>
                <span>{imageText.hint}</span>

                {form.imageData && (
                  <button
                    type="button"
                    className="memory-image-remove-button"
                    onClick={handleRemoveImage}
                  >
                    {imageText.remove}
                  </button>
                )}
              </div>
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
                    className="saved-memory-card"
                    key={memory.id}
                  >

                    <label
                      className="saved-memory-card-visual"
                      title={
                        imageSavingId === memory.id
                          ? imageText.saving
                          : memory.imageData
                            ? imageText.change
                            : imageText.add
                      }
                    >
                      {memory.imageData ? (
                        <img
                          src={memory.imageData}
                          alt=""
                          className="saved-memory-card-image"
                        />
                      ) : (
                        <MemoryIcon />
                      )}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) =>
                          handleSavedMemoryImageChange(
                            memory.id,
                            event,
                          )
                        }
                        disabled={
                          imageSavingId === memory.id
                        }
                        aria-label={
                          memory.imageData
                            ? imageText.change
                            : imageText.add
                        }
                      />

                      <span className="saved-memory-card-image-badge">
                        {imageSavingId === memory.id
                          ? '…'
                          : memory.imageData
                            ? '↻'
                            : '+'}
                      </span>
                    </label>


                    <div className="saved-memory-card-body">

                      <div className="saved-memory-card-header">

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


                      <div className="saved-memory-card-actions">

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