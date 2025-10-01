'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { PhotoUpload } from '@/components/ui/PhotoUpload'
import { InterestSelector } from '@/components/ui/InterestSelector'
import { Sparkles, User, LogOut, Download, Sparkle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface GeneratedImage {
  theme: string
  imageUrl: string
  success: boolean
}

interface GenerationError {
  theme: string
  error: string
}

const AVAILABLE_INTERESTS = [
  { id: 'nature', name: 'Nature & Outdoors', description: 'Hiking, forests, lakes, mountains', icon: '🌿', category: 'lifestyle' },
  { id: 'sports', name: 'Sports & Fitness', description: 'Gym, athletics, active lifestyle', icon: '🏃‍♂️', category: 'lifestyle' },
  { id: 'formal', name: 'Professional & Formal', description: 'Business, elegant settings', icon: '👔', category: 'professional' },
  { id: 'travel', name: 'Travel & Adventure', description: 'Landmarks, vacation spots', icon: '✈️', category: 'lifestyle' },
  { id: 'casual', name: 'Casual & Lifestyle', description: 'Cafes, parks, everyday settings', icon: '☕', category: 'lifestyle' },
  { id: 'adventure', name: 'Extreme Adventures', description: 'Rock climbing, surfing, skiing', icon: '🧗‍♂️', category: 'adventure' },
  { id: 'creative', name: 'Creative & Artistic', description: 'Art studios, music venues, creative spaces', icon: '🎨', category: 'creative' },
  { id: 'foodie', name: 'Food & Dining', description: 'Restaurants, food markets, culinary experiences', icon: '🍽️', category: 'lifestyle' }
]

const DashboardPage = () => {
  const { data: session, status } = useSession()
  const [userCredits, setUserCredits] = useState<number>(0)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [generationProgress, setGenerationProgress] = useState<{ total: number; completed: number; current: string } | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Fetch user credits from backend
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => setUserCredits(data.credits))
        .catch(err => console.error('Failed to fetch user:', err))
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to continue</h1>
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Photo & interest handlers
  const handlePhotoSelect = (file: File) => setSelectedPhoto(file)
  const handlePhotoRemove = () => setSelectedPhoto(null)
  const handleInterestToggle = (id: string) =>
    setSelectedInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  // Generate AI images
  const handleGenerateImages = async () => {
    if (!selectedPhoto) { toast.error('Please upload a photo first'); return }
    if (selectedInterests.length === 0) { toast.error('Please select at least one interest'); return }

    const cost = selectedInterests.length
    if (userCredits < cost) { toast.error(`Insufficient credits. You need ${cost} credits but have ${userCredits} credits`); return }

    setIsGenerating(true)
    setGenerationProgress({ total: selectedInterests.length, completed: 0, current: selectedInterests[0] })

    try {
      // Proceed with AI generation
      const formData = new FormData();
      formData.append('file', selectedPhoto);
      formData.append('themes', JSON.stringify(selectedInterests));
      console.log('Submitting photo and themes AFTER:', selectedPhoto, selectedInterests);

      const res = await fetch('/api/enhance-photos', { method: 'POST', body: formData });
      console.log('enhancje photos res:', res)
      if (!res.ok) {
        const errText = await res.text();
        console.error('Enhance photos failed:', errText);
        throw new Error('Image generation failed');
      }

      const data = await res.json();
      console.log("enhance-photos response:", data);
      if (data.images && Array.isArray(data.images)) {
        setGeneratedImages(prev => [...data.images, ...prev]);
        toast.success(`Generated ${data.images.length} image${data.images.length !== 1 ? 's' : ''} successfully!`);
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to generate images')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(null)
    }
  }

  // Download image
  const handleDownload = async (imageUrl: string, theme: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `sparkd-${theme.toLowerCase()}-profile.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Download started!')
    } catch (err) {
      console.error(err)
      window.open(imageUrl, '_blank')
      toast.error('Download failed, opened in new tab instead')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary-500" />
              <span className="text-2xl font-bold text-gray-900">Sparkd</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Credits: {userCredits}</span>
                <Link href="/pricing"><Button variant="outline" size="sm">Buy More</Button></Link>
              </div>
              <div className="flex items-center space-x-2">
                <Link href="/profile"><Button variant="ghost" size="sm"><User className="h-4 w-4 mr-2" />Profile</Button></Link>
                <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/auth/login' })}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Upload Your Photo</h2>
              {!selectedPhoto ? <PhotoUpload onPhotoSelect={handlePhotoSelect} onPhotoRemove={handlePhotoRemove} /> :
                <div className="relative w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
                  <img src={URL.createObjectURL(selectedPhoto)} alt="Uploaded photo" className="w-full h-auto max-h-96 object-contain" />
                  <button onClick={handlePhotoRemove} className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow">✕</button>
                  <p className="text-center text-sm text-gray-500 mt-2">{selectedPhoto.name}</p>
                </div>
              }
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Choose Your Interests</h2>
              <InterestSelector
                interests={AVAILABLE_INTERESTS}
                selectedInterests={selectedInterests}
                onInterestToggle={handleInterestToggle}
                maxSelections={3}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <Button
                onClick={handleGenerateImages}
                disabled={!selectedPhoto || selectedInterests.length === 0 || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <><Sparkle className="h-5 w-5 mr-2 animate-spin" /> Generating {selectedInterests.length} Images...</>
                ) : (
                  <><Sparkles className="h-5 w-5 mr-2" /> Generate {selectedInterests.length || 0} AI Image{selectedInterests.length !== 1 ? 's' : ''}</>
                )}
              </Button>

              {userCredits < selectedInterests.length && (
                <p className="text-sm text-red-600 text-center mt-2">
                  Insufficient credits. You need {selectedInterests.length} credits.
                </p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Images</h2>
              {generatedImages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Upload a photo and select interests to generate your AI profile images.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200">
                      <img onClick={() => setSelectedImage(img.imageUrl)} src={img.imageUrl} alt={img.theme} className="w-full h-48 object-cover cursor-pointer" />
                      <div className="absolute bottom-2 left-2 flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-white font-semibold">{img.theme}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(img.imageUrl, img.theme)}}
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full screen"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}
    </div>
  )
}

export default DashboardPage
