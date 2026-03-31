import { useRef, useState, useCallback } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'

interface Props {
  /** Current image URL (shown as preview) */
  value:      string
  /** Called with the new download URL after a successful upload */
  onChange:   (url: string) => void
  /** Storage path prefix, e.g. "businesses/biz_001/services" */
  storagePath: string
  /** Whether the preview should be a circle (avatar) or rectangle (cover/service) */
  shape?:     'circle' | 'rect'
  label?:     string
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_MB   = 5

export default function ImageUpload({
  value, onChange, storagePath, shape = 'rect', label = 'Photo',
}: Props) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const upload = useCallback(async (file: File) => {
    setError(null)

    if (!ACCEPTED.includes(file.type)) {
      setError('Only JPG, PNG, WebP or GIF files are supported.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be smaller than ${MAX_MB} MB.`)
      return
    }

    const filename  = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const storageRef = ref(storage, `${storagePath}/${filename}`)
    const task       = uploadBytesResumable(storageRef, file)

    task.on(
      'state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err)  => { setError(err.message); setProgress(null) },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        onChange(url)
        setProgress(null)
      },
    )
  }, [storagePath, onChange])

  const handleFile = (file: File | undefined) => { if (file) upload(file) }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [upload]) // eslint-disable-line react-hooks/exhaustive-deps

  const isCircle  = shape === 'circle'
  const previewCls = isCircle
    ? 'w-20 h-20 rounded-full object-cover shrink-0'
    : 'w-full h-40 object-cover rounded-xl'

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Current preview */}
      {value && (
        <div className={`mb-3 ${isCircle ? 'flex justify-center' : ''}`}>
          <img src={value} alt="preview" className={previewCls} />
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors
          ${dragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-gray-300 bg-gray-50 hover:border-brand-400 hover:bg-gray-100'
          }`}
      >
        {progress !== null ? (
          /* Upload progress */
          <div className="w-full">
            <p className="text-sm text-brand-600 font-medium text-center mb-2">
              Uploading… {progress}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Drop image here or <span className="text-brand-500">click to browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP — max {MAX_MB} MB</p>
            </div>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
