'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-xl shadow-xl p-12 text-center max-w-lg">
        <div className='flex items-center justify-center space-x-2'>
          <Sparkles className="h-12 w-12 text-primary-500 mb-4" />
          <span className="text-2xl font-bold text-gray-900">Sparkd</span>

        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Your credits have been added to your account. You can now use them to generate AI images.
        </p>
        <Link href="/profile">
          <button className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-lg">
            Go to Profile
          </button>
        </Link>
      </div>
    </div>
  )
}
