'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface AvatarCaptureProps {
  onCapture: (imageData: string) => void
  onCancel: () => void
}

export default function AvatarCapture({ onCapture, onCancel }: AvatarCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 400, 
          height: 400,
          facingMode: 'user' 
        }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError('Unable to access camera. Please allow camera permissions.')
      console.error('Error accessing camera:', err)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        stopCamera()
        onCapture(imageData)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-whisky-dark mb-4">Capture Your Avatar</h2>
        
        {error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : (
          <div className="relative mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-gray-200"
              style={{ aspectRatio: '1/1' }}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={capturePhoto}
            disabled={!stream || !!error}
            className="flex-1 bg-whisky-dark text-white py-3 rounded-lg font-semibold hover:bg-whisky transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Camera size={20} />
            Capture
          </button>
          <button
            onClick={() => {
              stopCamera()
              onCancel()
            }}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <X size={20} />
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  )
}

