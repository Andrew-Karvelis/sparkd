import React from 'react'
import { clsx } from 'clsx'

export interface Interest {
  id: string
  name: string
  description: string
  icon: string
  category: string
}

interface InterestSelectorProps {
  interests: Interest[]
  selectedInterests: string[]
  onInterestToggle: (interestId: string) => void
  maxSelections?: number
}

const defaultInterests: Interest[] = [
  {
    id: 'nature',
    name: 'Nature & Outdoors',
    description: 'Hiking, mountains, lakes, forest adventures',
    icon: '🌿',
    category: 'lifestyle'
  },
  {
    id: 'sports',
    name: 'Sports & Fitness',
    description: 'Athletic activities, gym, fitness lifestyle',
    icon: '🏃‍♂️',
    category: 'lifestyle'
  },
  {
    id: 'formal',
    name: 'Professional & Formal',
    description: 'Business settings, elegant venues, sophisticated style',
    icon: '👔',
    category: 'professional'
  },
  {
    id: 'travel',
    name: 'Travel & Exploration',
    description: 'Famous landmarks, city exploration, vacation vibes',
    icon: '✈️',
    category: 'lifestyle'
  },
  {
    id: 'casual',
    name: 'Casual & Relaxed',
    description: 'Coffee shops, parks, everyday friendly settings',
    icon: '☕',
    category: 'lifestyle'
  },
  {
    id: 'adventure',
    name: 'Adventure Sports',
    description: 'Rock climbing, surfing, skiing, extreme activities',
    icon: '🧗‍♂️',
    category: 'adventure'
  },
  {
    id: 'creative',
    name: 'Creative & Artistic',
    description: 'Art studios, music venues, creative spaces',
    icon: '🎨',
    category: 'creative'
  },
  {
    id: 'foodie',
    name: 'Food & Dining',
    description: 'Restaurants, food markets, culinary experiences',
    icon: '🍽️',
    category: 'lifestyle'
  }
]

export const InterestSelector: React.FC<InterestSelectorProps> = ({
  interests = defaultInterests,
  selectedInterests,
  onInterestToggle,
  maxSelections = 5
}) => {
  const handleInterestClick = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      onInterestToggle(interestId)
    } else if (selectedInterests.length < maxSelections) {
      onInterestToggle(interestId)
    }
  }

  const isSelected = (interestId: string) => selectedInterests.includes(interestId)
  const canSelect = selectedInterests.length < maxSelections

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select Your Interests
        </h3>
        <p className="text-sm text-gray-600">
          Choose up to {maxSelections} interests. AI will generate images based on these themes.
        </p>
        <p className="text-sm text-primary-600 mt-1">
          {selectedInterests.length}/{maxSelections} selected
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {interests.map((interest) => (
          <button
            key={interest.id}
            onClick={() => handleInterestClick(interest.id)}
            disabled={!isSelected(interest.id) && !canSelect}
            className={clsx(
              'p-4 rounded-lg border-2 text-left transition-all duration-200',
              'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500',
              isSelected(interest.id)
                ? 'border-primary-500 bg-primary-50 text-primary-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300',
              !isSelected(interest.id) && !canSelect && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{interest.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm mb-1">{interest.name}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {interest.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedInterests.length > 0 && (
        <div className="mt-6 p-4 bg-primary-50 rounded-lg">
          <h4 className="font-medium text-primary-900 mb-2">Selected Interests:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interestId) => {
              const interest = interests.find(i => i.id === interestId)
              return (
                <span
                  key={interestId}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                >
                  {interest?.icon} {interest?.name}
                  <button
                    onClick={() => onInterestToggle(interestId)}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
