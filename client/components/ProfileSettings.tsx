'use client'

import { useState } from 'react'
import { X, User, Camera } from 'lucide-react'
import { motion } from 'framer-motion'
import AvatarCapture from './AvatarCapture'

interface ProfileSettingsProps {
  currentName: string
  currentAvatar: string
  onSave: (name: string, avatar: string) => void
  onClose: () => void
}

export default function ProfileSettings({ currentName, currentAvatar, onSave, onClose }: ProfileSettingsProps) {
  const [name, setName] = useState(currentName)
  const [avatar, setAvatar] = useState(currentAvatar)
  const [showAvatarCapture, setShowAvatarCapture] = useState(false)

  const handleSave = () => {
    if (!name.trim()) {
      alert('Voer een naam in')
      return
    }
    onSave(name.trim(), avatar)
    onClose()
  }

  const handleAvatarCapture = (imageData: string) => {
    setAvatar(imageData)
    setShowAvatarCapture(false)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-whisky-dark">Profiel Bewerken</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Naam</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-whisky focus:border-transparent"
                  placeholder="Voer je naam in"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Avatar</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-whisky-light flex items-center justify-center">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-whisky-dark">
                      {name.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAvatarCapture(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Camera size={20} />
                  <span>Nieuwe Avatar Vastleggen</span>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="flex-1 bg-whisky-dark text-white py-3 rounded-lg font-semibold hover:bg-whisky transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Wijzigingen Opslaan
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {showAvatarCapture && (
        <AvatarCapture
          onCapture={handleAvatarCapture}
          onCancel={() => setShowAvatarCapture(false)}
        />
      )}
    </>
  )
}

