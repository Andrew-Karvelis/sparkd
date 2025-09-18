import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, X } from 'lucide-react'
import { Button } from './Button'

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void
  onPhotoRemove: () => void
  selectedPhoto?: File | null
  error?: string
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onPhotoSelect,
  onPhotoRemove,
  selectedPhoto,
  error
}) => {
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    let file = acceptedFiles[0]
    if (file) {
      // Force MIME fallback if browser didn’t set one properly
      const safeType = file.type || "image/jpeg"
      file = new File([file], file.name, { type: safeType })

      onPhotoSelect(file)

      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [onPhotoSelect])


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const handleRemove = () => {
    onPhotoRemove()
    setPreview(null)
  }

  if (selectedPhoto && preview) {
    return (
      <div className="w-full">
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Photo uploaded successfully! Click the X to remove and upload a different photo.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
          ${error ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full
            ${isDragActive ? 'bg-primary-100' : 'bg-gray-100'}
          `}>
            {isDragActive ? (
              <Upload className="h-8 w-8 text-primary-600" />
            ) : (
              <Camera className="h-8 w-8 text-gray-600" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop your photo here' : 'Upload your photo'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag & drop or click to select a photo
            </p>
            <p className="text-xs text-gray-400 mt-2">
              JPG, PNG, or WebP up to 10MB
            </p>
          </div>

          <Button variant="outline" size="sm">
            Choose File
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Photo Requirements:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Clear, high-quality photo of your face</li>
          <li>• Good lighting and clear background</li>
          <li>• No sunglasses or hats covering your face</li>
          <li>• Photo should be recent and represent you well</li>
        </ul>
      </div>
    </div>
  )
}
