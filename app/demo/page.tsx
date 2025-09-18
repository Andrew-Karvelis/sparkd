'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Sparkles, ArrowRight, Star } from 'lucide-react'

export default function DemoPage() {
  const demoSteps = [
    {
      id: 1,
      step: "Step 1: Upload Your Photo",
      url: '/assets/step1.png',
      description: "Start with a regular photo of yourself",
    },
    {
      id: 2,
      step: "Step 2: Choose Your Interests",
      url: '/assets/step2.png',
      description: "Pick up to 3 interests to inspire your AI profile",
    },
    {
      id: 3,
      step: "Step 3: See Your AI Profiles",
      url: '/assets/step3.png',
      description: "Get unique AI-generated images that match your vibe",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Sparkles className="h-8 w-8 text-primary-500" />
          <span className="text-2xl font-bold text-gray-900">Sparkd</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/auth/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-center py-16 px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          See Sparkd in Action
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Here’s a step-by-step gallery of how Sparkd transforms your profile.
        </p>
      </div>

      {/* Gallery Section */}
      <div className="max-w-5xl mx-auto px-6 pb-16 space-y-12">
        {demoSteps.map((step) => (
          <div key={step.id} className="card flex flex-col md:flex-row items-center gap-6">
            <img
              src={step.url}
              alt={step.step}
              className="w-full md:w-1/2 h-auto rounded-lg shadow-md"
            />
            <div className="md:w-1/2 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">{step.step}</h2>
              <p className="text-gray-600">{step.description}</p>
              <div className="flex justify-center md:justify-start items-center gap-2 mt-3 text-sm text-gray-500">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Example Image</span>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-primary-50 rounded-lg p-6 text-center shadow-md">
          <h3 className="font-semibold text-primary-900 mb-2">Ready to create your own?</h3>
          <p className="text-sm text-primary-800 mb-4">
            Sign up to generate and save unlimited AI profile images tailored to you.
          </p>
          <Link href="/auth/register">
            <Button>
              Start Creating
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
