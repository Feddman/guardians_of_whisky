'use client'

import { useState } from 'react'
import { X, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface Whisky {
  name: string
  years?: string
  type?: string
  region?: string
  description?: string
  image?: string
}

interface AddWhiskyModalProps {
  onAdd: (whisky: Whisky) => Promise<void>
  onClose: () => void
}

export default function AddWhiskyModal({ onAdd, onClose }: AddWhiskyModalProps) {
  const [whisky, setWhisky] = useState<Whisky>({
    name: '',
    years: '',
    type: '',
    region: '',
    description: '',
    image: ''
  })
  const [loading, setLoading] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Alleen afbeeldingen zijn toegestaan')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('Afbeelding is te groot. Maximum grootte is 5MB. Probeer de afbeelding te comprimeren.')
      return
    }

    const reader = new FileReader()
    reader.onerror = () => {
      alert('Fout bij het lezen van de afbeelding')
    }
    
    reader.onloadend = () => {
      const result = reader.result as string
      
      // Compress image if it's too large
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Resize if image is too large (max 1200px on longest side)
        const maxDimension = 1200
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to JPEG with 0.85 quality to reduce size
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
          setWhisky(prev => ({ ...prev, image: compressedDataUrl }))
        } else {
          // Fallback to original if canvas fails
          setWhisky(prev => ({ ...prev, image: result }))
        }
      }
      
      img.onerror = () => {
        alert('Fout bij het laden van de afbeelding')
      }
      
      img.src = result
    }
    
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!whisky.name.trim()) {
      alert('Voer een whisky naam in')
      return
    }
    setLoading(true)
    try {
      await onAdd(whisky)
      setWhisky({
        name: '',
        years: '',
        type: '',
        region: '',
        description: '',
        image: ''
      })
      onClose()
    } catch (error) {
      console.error('Error adding whisky:', error)
      alert('Whisky toevoegen mislukt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-whisky-dark">Whisky Toevoegen</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Whisky Naam *</label>
            <input
              type="text"
              value={whisky.name}
              onChange={(e) => setWhisky(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whisky focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Jaar</label>
            <input
              type="text"
              value={whisky.years}
              onChange={(e) => setWhisky(prev => ({ ...prev, years: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whisky focus:border-transparent"
              placeholder="e.g., 12"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Type</label>
            <input
              type="text"
              value={whisky.type}
              onChange={(e) => setWhisky(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whisky focus:border-transparent"
              placeholder="e.g., Single Malt"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Regio</label>
            <input
              type="text"
              value={whisky.region}
              onChange={(e) => setWhisky(prev => ({ ...prev, region: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whisky focus:border-transparent"
              placeholder="e.g., Islay"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Beschrijving</label>
            <textarea
              value={whisky.description}
              onChange={(e) => setWhisky(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whisky focus:border-transparent min-h-[100px]"
              placeholder="Beschrijf de whisky..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Afbeelding</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="whisky-image-upload"
                />
                <label
                  htmlFor="whisky-image-upload"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <ImageIcon size={20} />
                  <span>Afbeelding Uploaden</span>
                </label>
                {whisky.image && (
                  <img
                    src={whisky.image}
                    alt="Whisky preview"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
              </div>
              <p className="text-xs text-gray-500">
                Ondersteunde formaten: JPEG, PNG, WebP. Maximum grootte: 5MB. 
                Afbeeldingen worden automatisch gecomprimeerd tot maximaal 1200px.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !whisky.name.trim()}
              className="flex-1 bg-whisky-dark text-white py-3 rounded-lg font-semibold hover:bg-whisky transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Toevoegen...' : 'Whisky Toevoegen'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
                Annuleren
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

