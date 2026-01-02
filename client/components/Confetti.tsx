'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface ConfettiProps {
  onComplete?: () => void
}

export default function Confetti({ onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number, x: number, y: number, color: string, delay: number }>>([])

  useEffect(() => {
    // Create confetti particles
    const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5
    }))
    setParticles(newParticles)

    // Call onComplete after animation
    const timer = setTimeout(() => {
      if (onComplete) onComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 pointer-events-none z-[110] overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          initial={{ 
            x: `${particle.x}vw`,
            y: `${particle.y}vh`,
            rotate: 0,
            scale: 1,
            opacity: 1
          }}
          animate={{ 
            y: '110vh',
            rotate: 360,
            scale: 0,
            opacity: 0
          }}
          transition={{ 
            duration: 2 + Math.random(),
            delay: particle.delay,
            ease: 'easeOut'
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{ backgroundColor: particle.color }}
        />
      ))}
    </div>
  )
}

