'use client'

import { useEffect } from 'react'

interface AnalyticsEventProps {
  eventName: string
  eventCategory: string
  eventLabel?: string
  slug?: string
}

export default function AnalyticsEvent({ eventName, eventCategory, eventLabel, slug }: AnalyticsEventProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: eventCategory,
        event_label: eventLabel || slug,
        slug: slug,
      })
    }
  }, [eventName, eventCategory, eventLabel, slug])

  return null
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

