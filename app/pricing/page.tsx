'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Sparkles, Check, Star } from 'lucide-react'

interface PricingPlan {
  id: string
  name: string
  price: number
  credits: number
  features: string[]
  popular?: boolean
  description: string
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 9.99,
    credits: 10,
    description: 'Perfect for trying out Sparkd',
    features: [
      '10 AI image generations',
      'All interest themes',
      'High-quality downloads',
      'Email support',
      'Valid for 30 days'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 24.99,
    credits: 30,
    description: 'Most popular choice',
    popular: true,
    features: [
      '30 AI image generations',
      'All interest themes',
      'High-quality downloads',
      'Priority support',
      'Valid for 30 days',
      'Bulk download option'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 49.99,
    credits: 75,
    description: 'For power users',
    features: [
      '75 AI image generations',
      'All interest themes',
      'High-quality downloads',
      'Priority support',
      'Valid for 30 days',
      'Bulk download option',
      'Custom themes (coming soon)',
      'API access (coming soon)'
    ]
  }
]

const creditPackages = [
  { credits: 5, price: 4.99, savings: 0 },
  { credits: 15, price: 12.99, savings: 12 },
  { credits: 25, price: 19.99, savings: 20 },
  { credits: 50, price: 34.99, savings: 30 }
]

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')
  const [selectedCredits, setSelectedCredits] = useState<number>(15)

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleCreditSelect = (credits: number) => {
    setSelectedCredits(credits)
  }

  const handleSubscribe = async (planId: string) => {
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          id: planId,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };

  const handleBuyCredits = async (credits: number) => {
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "credits",  // exactly this string
          id: credits.toString(), // keys in creditPrices are strings: "5", "15", etc.
        })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Navigation */}
      <nav className="px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Sparkles className="h-8 w-8 text-primary-500" />
          <span className="text-2xl font-bold text-gray-900">Sparkd</span>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </nav>

      {/* Header */}
      <div className="text-center py-16 px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Get the perfect amount of AI image generations for your dating profile needs.
          Start with a few or go all-in with our premium plans.
        </p>
      </div>

      {/* Subscription Plans */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Subscription Plans</h2>
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative card ${plan.popular ? 'ring-2 ring-primary-500 shadow-xl' : ''
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <div className="text-lg font-semibold text-primary-600">
                  {plan.credits} AI Generations
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.id)}
                className={`w-full ${plan.popular ? 'bg-primary-500 hover:bg-primary-600' : ''
                  }`}
                variant={plan.popular ? 'primary' : 'outline'}
              >
                {selectedPlan === plan.id ? 'Current Plan' : 'Subscribe Now'}
              </Button>
            </div>
          ))}
        </div>

        {/* Credit Packages */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pay Per Generation</h2>
          <p className="text-gray-600">
            Don't want a subscription? Buy credits individually and use them whenever you want.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {creditPackages.map((pkg) => (
            <div
              key={pkg.credits}
              className={`card text-center cursor-pointer transition-all duration-200 ${selectedCredits === pkg.credits
                ? 'ring-2 ring-primary-500 bg-primary-50'
                : 'hover:shadow-lg'
                }`}
              onClick={() => handleCreditSelect(pkg.credits)}
            >
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {pkg.credits} Credits
              </div>
              <div className="text-2xl font-bold text-primary-600 mb-2">
                ${pkg.price}
              </div>
              {pkg.savings > 0 && (
                <div className="text-sm text-green-600 mb-4">
                  Save {pkg.savings}%
                </div>
              )}
              <div className="text-sm text-gray-600 mb-4">
                ${(pkg.price / pkg.credits).toFixed(2)} per credit
              </div>
              <Button
                onClick={() => handleBuyCredits(pkg.credits)}
                variant="outline"
                className="w-full"
              >
                Buy Now
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do credits work?</h3>
              <p className="text-gray-600">
                Each credit allows you to generate one set of AI images based on your selected interests.
                Credits never expire and can be used at any time.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I cancel my subscription?</h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access until
                the end of your current billing period.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, and digital wallets through our secure
                Stripe payment processing.
              </p>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">
                New users get 3 free AI generations when they sign up. This allows you to try our
                service before committing to a paid plan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
