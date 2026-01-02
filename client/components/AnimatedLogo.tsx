'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedLogoProps {
  onAnimationComplete?: () => void
  animationDuration?: number
}

interface Spark {
  id: number
  x: number
  y: number
  angle: number
  delay: number
  animName: string
  duration: number
}

export default function AnimatedLogo({ onAnimationComplete, animationDuration = 4 }: AnimatedLogoProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [pathLength, setPathLength] = useState(0)
  const [sparks, setSparks] = useState<Spark[]>([])

  useEffect(() => {
    if (pathRef.current && svgRef.current) {
      const path = pathRef.current
      const svg = svgRef.current
      const length = path.getTotalLength()
      setPathLength(length)
      
      // Generate sparks along the path
      const newSparks: Spark[] = []
      const numSparks = 30 // Number of sparks
      const styleSheet = document.createElement('style')
      document.head.appendChild(styleSheet)
      
      for (let i = 0; i < numSparks; i++) {
        // Random position along the path (0 to 1)
        const pathProgress = Math.random()
        const point = path.getPointAtLength(pathProgress * length)
        
        // Random angle for spark direction (radians)
        const angle = Math.random() * Math.PI * 2
        
        // Random delay (0 to animationDuration)
        const delay = Math.random() * animationDuration
        
        const distance = 25 + Math.random() * 20
        const sparkX = Math.cos(angle) * distance
        const sparkY = Math.sin(angle) * distance
        const duration = 0.6 + Math.random() * 0.4
        const animName = `spark-${i}`
        
        // Add keyframes for this spark
        styleSheet.textContent += `
          @keyframes ${animName} {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translate(${sparkX}px, ${sparkY}px) scale(0);
              opacity: 0;
            }
          }
          @keyframes ${animName}-inner {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translate(${sparkX * 0.8}px, ${sparkY * 0.8}px) scale(0);
              opacity: 0;
            }
          }
          @keyframes ${animName}-core {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translate(${sparkX * 0.6}px, ${sparkY * 0.6}px) scale(0);
              opacity: 0;
            }
          }
        `
        
        newSparks.push({
          id: i,
          x: point.x,
          y: point.y,
          angle: angle,
          delay: delay,
          animName: animName,
          duration: duration
        })
      }
      
      setSparks(newSparks)
      
      // Set up the drawing animation
      path.style.strokeDasharray = `${length}`
      path.style.strokeDashoffset = `${length}`
      path.style.animation = `drawPath ${animationDuration}s ease-in-out forwards`
      
      // Call callback when animation completes
      if (onAnimationComplete) {
        const timer = setTimeout(() => {
          onAnimationComplete()
        }, animationDuration * 1000)
        
        return () => {
          clearTimeout(timer)
          document.head.removeChild(styleSheet)
        }
      }
      
      return () => {
        if (document.head.contains(styleSheet)) {
          document.head.removeChild(styleSheet)
        }
      }
    }
  }, [onAnimationComplete, animationDuration])

  return (
    <div className="flex justify-center items-center mb-6 relative">
      <svg 
        ref={svgRef}
        width="283" 
        height="331" 
        viewBox="0 0 283 331" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-48 h-56 md:w-64 md:h-72 lg:w-80 lg:h-96 drop-shadow-lg relative z-10"
      >
        <path 
          ref={pathRef}
          d="M281.056 102.408H230.056H225.056V126.408C225.056 126.408 232.556 118.408 237.056 118.408C241.556 118.408 248.056 126.408 248.056 126.408V253.408C248.056 253.408 241.056 266.408 230.056 268.408C219.056 270.408 184.056 259.408 175.056 253.408C166.056 247.408 150.056 229.408 150.056 212.408C150.056 195.408 147.056 196.408 161.056 157.408C175.056 118.408 198.056 102.408 198.056 102.408H112.056V136.408H150.056C150.056 136.408 110.81 160.749 104.056 186.408C100.377 200.381 104.056 223.408 104.056 223.408C108.056 257.408 132.056 276.408 132.056 276.408C90.3602 267.124 70.0556 246.408 63.0556 205.408C56.0556 164.408 64.0556 138.408 84.0556 109.408C104.056 80.4079 140.995 47.4646 198.056 53.4079C225.056 59.9079 234.005 56.1884 248.056 80.4079L281.056 1.40787C253.2 21.0358 252.556 21.9079 230.056 21.9079C207.556 21.9079 190.068 15.845 161.056 15.4079C132.043 14.9707 115.36 17.5172 84.0556 32.4079C32.6936 65.5788 14.283 92.2522 4.05559 157.408C4.05559 157.408 -3.94441 200.408 4.05559 231.408C12.0556 262.408 51.2039 301.882 112.056 329.408L150.056 288.408L198.056 316.408L281.056 281.408V102.408Z" 
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="text-whisky-dark"
        />
        
        {/* Sparks */}
        {sparks.map((spark) => (
          <g key={spark.id}>
            <circle
              cx={spark.x}
              cy={spark.y}
              r="2.5"
              fill="#FFA500"
              style={{
                animation: `${spark.animName} ${spark.duration}s ease-out ${spark.delay}s forwards`,
                opacity: 0
              }}
              className="spark-particle"
            />
            <circle
              cx={spark.x}
              cy={spark.y}
              r="1.5"
              fill="#FFD700"
              style={{
                animation: `${spark.animName}-inner ${spark.duration * 0.8}s ease-out ${spark.delay + 0.05}s forwards`,
                opacity: 0
              }}
              className="spark-particle"
            />
            <circle
              cx={spark.x}
              cy={spark.y}
              r="1"
              fill="#FFF"
              style={{
                animation: `${spark.animName}-core ${spark.duration * 0.6}s ease-out ${spark.delay + 0.1}s forwards`,
                opacity: 0
              }}
              className="spark-particle"
            />
          </g>
        ))}
      </svg>
    </div>
  )
}

