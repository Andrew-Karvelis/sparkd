'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { PhotoUpload } from '@/components/ui/PhotoUpload'
import { InterestSelector } from '@/components/ui/InterestSelector'
import { Sparkles, User, Settings, LogOut, Download, Sparkle, AlertCircle, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

// Mock auth hook for testing - replace with your actual auth
const useAuth = () => {
  return {
    user: { credits: 10 }, // Mock user data
    logout: () => console.log('Logging out...')
  }
}

interface GeneratedImage {
  theme: string;
  imageUrl: string;
  success: boolean;
}

interface GenerationError {
  theme: string;
  error: string;
}

// Available interests/themes that match your route.ts
const AVAILABLE_INTERESTS = [
  { id: 'nature', name: 'Nature & Outdoors', description: 'Hiking, forests, lakes, mountains', icon: '🌿', category: 'lifestyle' },
  { id: 'sports', name: 'Sports & Fitness', description: 'Gym, athletics, active lifestyle', icon: '🏃‍♂️', category: 'lifestyle' },
  { id: 'formal', name: 'Professional & Formal', description: 'Business, elegant settings', icon: '👔', category: 'professional' },
  { id: 'travel', name: 'Travel & Adventure', description: 'Landmarks, vacation spots', icon: '✈️', category: 'lifestyle' },
  { id: 'casual', name: 'Casual & Lifestyle', description: 'Cafes, parks, everyday settings', icon: '☕', category: 'lifestyle' },
  { id: 'adventure', name: 'Extreme Adventures', description: 'Rock climbing, surfing, skiing', icon: '🧗‍♂️', category: 'adventure' },
  { id: 'creative', name: 'Creative & Artistic', description: 'Art studios, music venues, creative spaces', icon: '🎨', category: 'creative' },
  { id: 'foodie', name: 'Food & Dining', description: 'Restaurants, food markets, culinary experiences', icon: '🍽️', category: 'lifestyle' }
];

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  // Enhancement strength removed for simpler, subtle processing
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [generationProgress, setGenerationProgress] = useState<{
    total: number;
    completed: number;
    current: string;
  } | null>(null)

  // Helper function to resize image on client side
  const resizeImage = (file: File, maxSize: number = 1024): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw resized image
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob then file
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(resizedFile);
          }
        }, 'image/jpeg', 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoSelect = async (file: File) => {
    try {
      // Resize image if it's too large
      const resizedFile = await resizeImage(file, 1024);
      const fileSizeMB = resizedFile.size / (1024 * 1024);

      console.log(`Resized to: ${fileSizeMB.toFixed(2)}MB`);

      setSelectedPhoto(resizedFile);
      toast.success(`Photo uploaded and resized to ${fileSizeMB.toFixed(1)}MB!`);
    } catch (error) {
      console.error('Resize error:', error);
      toast.error('Failed to process image');
    }
  }

  const handlePhotoRemove = () => {
    setSelectedPhoto(null)
  }

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    )
  }

  const handleGenerateImages = async () => {
    // Try to create a simple person/background mask on the client (optional)
    // This uses the browser's OffscreenCanvas + a basic heuristic if advanced models are not wired yet
    // Later we can upgrade to MediaPipe Selfie Segmentation
    async function createClientMask(file: File): Promise<Blob | null> {
      try {
        const imgBitmap = await createImageBitmap(file);
        const side = 1024; // target size consistent with server
        const canvas = document.createElement('canvas');
        canvas.width = side; canvas.height = side;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Draw image centered and covered into 1024x1024
        const ratio = Math.max(side / imgBitmap.width, side / imgBitmap.height);
        const w = imgBitmap.width * ratio;
        const h = imgBitmap.height * ratio;
        const x = (side - w) / 2;
        const y = (side - h) / 2;
        ctx.drawImage(imgBitmap, x, y, w, h);

        // Very naive heuristic mask: assume central area is person; background near edges
        // Fill opaque circle/ellipse in the center; transparent elsewhere
        const mask = document.createElement('canvas');
        mask.width = side; mask.height = side;
        const mctx = mask.getContext('2d');
        if (!mctx) return null;
        mctx.clearRect(0, 0, side, side);
        mctx.fillStyle = 'white';
        mctx.beginPath();
        mctx.ellipse(side / 2, side / 2, side * 0.35, side * 0.45, 0, 0, Math.PI * 2);
        mctx.fill();

        // Slight feather to soften edges
        // Use CSS shadow blur trick by drawing multiple times (approximate)
        // Or simply rely on server-side blur(1)

        // Convert to PNG blob (white=opaque subject, black=transparent background)
        return await new Promise<Blob | null>((resolve) => {
          mask.toBlob((blob) => resolve(blob), 'image/png');
        });
      } catch (e) {
        console.warn('Client mask generation failed:', e);
        return null;
      }
    }
    if (!selectedPhoto) {
      toast.error("Please upload a photo first");
      return;
    }

    if (selectedInterests.length === 0) {
      toast.error("Please select at least one interest");
      return;
    }

    if (user.credits < selectedInterests.length * 3) {
      toast.error(`Insufficient credits. You need ${selectedInterests.length * 3} credits but have ${user.credits}`);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({
      total: selectedInterests.length,
      completed: 0,
      current: selectedInterests[0]
    });

    try {
      const formData = new FormData();
      formData.append("file", selectedPhoto);
      formData.append("themes", JSON.stringify(selectedInterests));

      // Client-side mask (optional)
      const maskBlob = await createClientMask(selectedPhoto);
      if (maskBlob) {
        formData.append("mask", maskBlob, "mask.png");
      }

      toast.loading(`Generating ${selectedInterests.length} AI images...`, { duration: 10000 });

      // Updated to match your route path
      const res = await fetch("/api/enhance-photos", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();

        // Handle face detection errors with more specific messaging
        if (errorData.faceDetection) {
          const issues = errorData.faceDetection.issues || [];
          const suggestions = errorData.faceDetection.suggestions || [];

          let detailedMessage = errorData.error;
          if (suggestions.length > 0) {
            detailedMessage += `\n\nSuggestions:\n• ${suggestions.join('\n• ')}`;
          }

          toast.error(detailedMessage, { duration: 8000 });
          throw new Error(errorData.error);
        }

        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      console.log("API response:", data);

      if (data.success && data.images && Array.isArray(data.images)) {
        // Add new images to the beginning of the array
        setGeneratedImages(prev => [...data.images, ...prev]);

        const successCount = data.successfulGenerations || data.images.length;
        const failureCount = data.failedGenerations || 0;

        if (failureCount > 0) {
          toast.success(`Generated ${successCount} images successfully! ${failureCount} failed.`);
        } else {
          toast.success(`All ${successCount} AI profile photos ready!`);
        }

        // Show errors if any
        if (data.errors && data.errors.length > 0) {
          console.error("Generation errors:", data.errors);
          data.errors.forEach((error: GenerationError) => {
            toast.error(`Failed to generate ${error.theme}: ${error.error}`, { duration: 5000 });
          });
        }
      } else if (Array.isArray(data?.errors) && data.errors.length > 0) {
        // Server responded with a valid error list (e.g., background removal failed)
        console.warn("Generation returned errors:", data.errors);
        data.errors.forEach((error: GenerationError) => {
          toast.error(`Failed to generate ${error.theme}: ${error.error}`, { duration: 6000 });
        });
      } else {
        console.error("Invalid response format:", data);
        toast.error(data.error || "Invalid response from server");
      }
    } catch (err) {
      console.error("Generation error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate images");
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const handleDownload = async (imageUrl: string, theme: string) => {
    try {
      // Fetch the image as a blob to ensure proper download
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `sparkd-${theme.toLowerCase().replace(/\s+/g, '-')}-profile.jpg`
      link.target = '_blank' // Open in new tab if download fails
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the object URL
      window.URL.revokeObjectURL(url)
      toast.success('Download started!')
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: open in new tab
      window.open(imageUrl, '_blank')
      toast.error('Download failed, opened in new tab instead')
    }
  }

  if (!user) {
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
                <span>Credits: {user.credits}</span>
                <Link href="/pricing">
                  <Button variant="outline" size="sm">Buy More</Button>
                </Link>
              </div>

              <div className="flex items-center space-x-2">
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Interests */}
          <div className="space-y-8">
            {/* Photo Upload */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Step 1: Upload Your Photo
              </h2>

              <div className="w-full">
                {!selectedPhoto ? (
                  // Show file upload if no photo exists
                  <PhotoUpload
                    onPhotoSelect={handlePhotoSelect}
                    onPhotoRemove={handlePhotoRemove}
                  />
                ) : (
                  // Show preview if photo exists
                  <div className="relative w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(selectedPhoto)}
                      alt="Uploaded photo preview"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                    {/* Remove button */}
                    <button
                      onClick={handlePhotoRemove}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow"
                    >
                      ✕
                    </button>
                    <p className="text-center text-sm text-gray-500 mt-2">
                      {selectedPhoto.name}
                    </p>
                  </div>
                )}
              </div>
            </div>



            {/* Interest Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Choose Your Interests</h2>
              <p className="text-sm text-gray-600 mb-4">
                Select up to 5 interests. Each interest will generate a separate themed profile photo.
              </p>
              <InterestSelector
                interests={AVAILABLE_INTERESTS}
                selectedInterests={selectedInterests}
                onInterestToggle={handleInterestToggle}
                maxSelections={2}
              />
            </div>

            {/* Generate Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                {selectedInterests.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <p>You will generate {selectedInterests.length} image{selectedInterests.length > 1 ? 's' : ''} for:</p>
                    <ul className="list-disc list-inside mt-1">
                      {selectedInterests.map(interest => {
                        const interestData = AVAILABLE_INTERESTS.find(i => i.id === interest);
                        return (
                          <li key={interest} className="capitalize">
                            {interestData?.name || interest}
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-2 font-medium">
                      Cost: {selectedInterests.length * 3} credits
                    </p>
                  </div>
                )}

                {generationProgress && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>Generating images...</span>
                      <span>{generationProgress.completed} / {generationProgress.total}</span>
                    </div>
                    <div className="mt-2 bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(generationProgress.completed / generationProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      This may take 1-2 minutes per image...
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleGenerateImages}
                  disabled={!selectedPhoto || selectedInterests.length === 0 || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Sparkle className="h-5 w-5 mr-2 animate-spin" />
                      Generating {selectedInterests.length} Images...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generate {selectedInterests.length || 0} AI Image{selectedInterests.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>

                {user.credits < selectedInterests.length && (
                  <p className="text-sm text-red-600 text-center">
                    Insufficient credits. You need {selectedInterests.length} credits but have {user.credits}.
                  </p>
                )}

                {user.credits <= 0 && (
                  <p className="text-sm text-red-600 text-center">
                    You have no credits left. Please purchase more to continue.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Generated Images */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Images</h2>

              {generatedImages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Upload a photo and select interests to generate AI images</p>
                  <p className="text-sm mt-2">Each interest will create a separate themed photo</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Group by theme */}
                  {selectedInterests.map((interestId) => {
                    const interestData = AVAILABLE_INTERESTS.find(i => i.id === interestId);
                    const imagesForTheme = generatedImages.filter(img => img.theme === interestId);

                    if (imagesForTheme.length === 0) return null;

                    return (
                      <div key={interestId} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-lg text-gray-900 flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            {interestData?.name || interestId}
                          </h3>
                        </div>

                        {/* Gallery grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {imagesForTheme.map((image, index) => (
                            <div
                              key={`${interestId}-${index}`}
                              className="relative group rounded-lg overflow-hidden shadow-md"
                            >
                              <img
                                src={image.imageUrl}
                                alt={`${interestId} themed profile`}
                                className="w-full h-auto object-cover"
                                onError={(e) => {
                                  console.error(`Failed to load image for ${interestId}:`, e);
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                <Button
                                  onClick={() => handleDownload(image.imageUrl, interestId)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage