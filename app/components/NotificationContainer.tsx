'use client'

import { useState, useEffect } from 'react'
import Notification from './Notification'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

interface NotificationContainerProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

export default function NotificationContainer({ 
  notifications, 
  onRemove 
}: NotificationContainerProps) {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={() => onRemove(notification.id)}
        />
      ))}

      <style jsx>{`
        .notification-container {
          position: fixed;
          top: 2rem;
          right: 2rem;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-width: 400px;
        }

        @media (max-width: 768px) {
          .notification-container {
            top: 1rem;
            right: 1rem;
            left: 1rem;
            max-width: none;
          }
        }
      `}</style>
    </div>
  )
}