'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import clsx from 'clsx'

const questions = [
  {
    id: 1,
    question: "What kind of images do you usually create?",
    options: ["Portraits / Selfies", "Urban / Architecture", "Nature / Landscapes", "Artistic / Fantasy"],
  },
  {
    id: 2,
    question: "What’s your vibe when editing photos?",
    options: ["Subtle & clean", "Bright & colorful", "Moody & dramatic", "Dreamy & surreal"],
  },
{
  id: 3,
  question: "If AI could improve one thing about your photos, what would it be?",
  options: ["Lighting & color", "Detail & sharpness", "Background enhancement", "Removing distractions"],
},
  {
    id: 4,
    question: "How experienced are you with AI tools?",
    options: ["Just getting started", "Some experience", "I use them regularly"],
  },
  {
    id: 5,
    question: "What’s your goal with AI-enhanced images?",
    options: ["Stand out on social media", "Make my brand look professional", "Get more polished photos", "Just want to experiment & have fun"],
  },
]

const results = [
  {
    type: "The Visionary",
    desc: "You love bold colors and pushing creative limits. Sparkd helps you turn imagination into stunning visuals.",
    color: "from-pink-500 to-yellow-400",
  },
  {
    type: "The Naturalist",
    desc: "You prefer realism and subtle enhancement. Sparkd makes your photos shine while staying authentic.",
    color: "from-green-400 to-emerald-600",
  },
  {
    type: "The Creator",
    desc: "You’re hands-on and love experimenting. Sparkd gives you full creative control to shape your next masterpiece.",
    color: "from-blue-400 to-indigo-600",
  },
  {
    type: "The Dreamer",
    desc: "You crave surreal, artistic transformations. Sparkd brings your imagination to life.",
    color: "from-purple-400 to-pink-600",
  },
]

export default function QuizPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [loadingResult, setLoadingResult] = useState(false)
  const [result, setResult] = useState<null | typeof results[number]>(null)

  const handleSelect = (option: string) => {
    const newAnswers = [...answers]
    newAnswers[step] = option
    setAnswers(newAnswers)

    if (step + 1 < questions.length) {
      setStep(step + 1)
    } else {
      setLoadingResult(true)
      setTimeout(() => {
        const randomResult = results[Math.floor(Math.random() * results.length)]
        setResult(randomResult)
        setLoadingResult(false)
      }, 1500)
    }
  }

  const progress = ((step + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col">
      {/* Navbar */}
      <nav className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-8 w-8 text-primary-500" />
          <span className="text-2xl font-bold text-gray-900">Sparkd</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/auth/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>
      </nav>

      {/* Quiz Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8 relative overflow-hidden">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500" style={{ width: `${progress}%` }} />

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.4 }}
              >
                <div className={`text-4xl font-bold bg-gradient-to-r ${result.color} bg-clip-text text-transparent mb-4`}>
                  {result.type}
                </div>
                <p className="text-gray-700 mb-8">{result.desc}</p>
                <Link href="/auth/register">
                  <Button size="lg" className="px-6 py-3 text-lg">
                    Start Creating <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            ) : loadingResult ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                <p className="mt-4 text-gray-600">Analyzing your creative spark...</p>
              </motion.div>
            ) : (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  {questions[step].question}
                </h2>
                <div className="grid gap-3">
                  {questions[step].options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={clsx(
                        'border border-gray-200 rounded-xl py-3 px-4 text-gray-700 hover:border-primary-500 hover:text-primary-500 transition-all',
                        answers[step] === option && 'border-primary-500 text-primary-600 bg-primary-50'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="mt-6 text-sm text-gray-500">
                  Question {step + 1} of {questions.length}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
          <p>&copy; 2025 Sparkd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
