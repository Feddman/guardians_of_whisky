'use client'

import { motion } from 'framer-motion'
import { Crown, X } from 'lucide-react'

interface Participant {
  id: string
  name: string
  avatar?: string
  currentEmote?: string
}

interface ParticipantGridProps {
  participants: Participant[]
  currentParticipantId: string
  creatorId?: string | null
  onEmote: (emote: string) => void
  onKick?: (participantId: string) => void
  isCreator?: boolean
}

const EMOTES = [
  { id: 'smile', label: '😊' },
  { id: 'heart', label: '❤️' },
  { id: 'thumbsup', label: '👍' },
  { id: 'clap', label: '👏' },
  { id: 'fire', label: '🔥' },
  { id: 'party', label: '🎉' },
]

export default function ParticipantGrid({ 
  participants, 
  currentParticipantId,
  creatorId,
  onEmote,
  onKick,
  isCreator
}: ParticipantGridProps) {
  const currentParticipant = participants.find(p => p.id === currentParticipantId)

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-whisky-dark mb-4">Deelnemers</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
        {participants.map((participant, index) => (
          <motion.div
            key={participant.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-3 rounded-lg border-2 ${
              participant.id === currentParticipantId
                ? 'border-whisky-dark bg-whisky-light/20'
                : participant.id === creatorId
                ? 'border-amber-400 bg-amber-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            {isCreator && participant.id !== currentParticipantId && participant.id !== creatorId && onKick && (
              <button
                onClick={() => {
                  if (confirm(`Weet je zeker dat je ${participant.name} wilt verwijderen uit de sessie?`)) {
                    onKick(participant.id)
                  }
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors z-10"
                title={`${participant.name} verwijderen`}
              >
                <X size={14} />
              </button>
            )}
            <div className="flex flex-col items-center">
              <div className="relative">
                {participant.avatar ? (
                  <img
                    src={participant.avatar}
                    alt={participant.name}
                    className={`w-20 h-20 rounded-full object-cover mb-2 border-2 ${
                      participant.id === creatorId ? 'border-amber-400' : 'border-whisky-light'
                    }`}
                  />
                ) : (
                  <div className={`w-20 h-20 rounded-full bg-whisky-light flex items-center justify-center mb-2 border-2 ${
                    participant.id === creatorId ? 'border-amber-400' : 'border-whisky-light'
                  }`}>
                    <span className="text-3xl font-bold text-whisky-dark">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {participant.id === creatorId && (
                  <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1 border-2 border-white">
                    <Crown size={14} className="text-amber-900" fill="currentColor" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-center truncate">
                  {participant.name}
                </span>
                {participant.id === creatorId && (
                  <span className="text-xs text-amber-600 font-semibold">(Maker)</span>
                )}
              </div>
              {participant.currentEmote && (
                <motion.div
                  initial={{ scale: 0, y: 0 }}
                  animate={{ scale: [0, 1.2, 1], y: -10 }}
                  className="absolute -top-2 -right-2 text-2xl"
                >
                  {EMOTES.find(e => e.id === participant.currentEmote)?.label || '🎉'}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {EMOTES.map((emote) => (
          <button
            key={emote.id}
            onClick={() => onEmote(emote.id)}
            className="p-3 rounded-lg bg-whisky-light hover:bg-whisky transition-colors text-2xl"
            title={emote.label}
          >
            {emote.label}
          </button>
        ))}
      </div>
    </div>
  )
}

