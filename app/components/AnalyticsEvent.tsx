'use client'

import { useEffect } from 'react'

interface AnalyticsEventProps {
  eventName: string
  eventCategory: string
  eventLabel?: string
  slug?: string
  aiProvider?: string
  aiModel?: string
}

export default function AnalyticsEvent({ eventName, eventCategory, eventLabel, slug, aiProvider, aiModel }: AnalyticsEventProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: eventCategory,
        event_label: eventLabel || slug,
        slug: slug,
        ...(aiProvider ? { ai_provider: aiProvider } : {}),
        ...(aiModel ? { ai_model: aiModel } : {}),
      })
    }
  }, [eventName, eventCategory, eventLabel, slug, aiProvider, aiModel])

  return null
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

