'use client'

import { motion } from 'framer-motion'
import { Crown, X, Trophy, Medal } from 'lucide-react'

interface Participant {
  id: string
  name: string
  avatar?: string
  currentEmote?: string
}

interface PointsBreakdown {
  category: string
  value: string
  matches: number
  points: number
  matchedParticipants?: string[]
}

interface Whisky {
  id: string
  name: string
  revealed: boolean
  pointsBreakdown?: PointsBreakdown[]
}

interface ParticipantGridProps {
  participants: Participant[]
  currentParticipantId: string
  creatorId?: string | null
  onEmote: (emote: string) => void
  onKick?: (participantId: string) => void
  isCreator?: boolean
  whiskies?: Whisky[]
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
  isCreator,
  whiskies = []
}: ParticipantGridProps) {
  const currentParticipant = participants.find(p => p.id === currentParticipantId)

  // Calculate participant scores from all revealed whiskies
  const calculateParticipantScores = () => {
    const scores = new Map<string, number>()
    
    // Initialize all participants with 0 points
    participants.forEach(p => {
      scores.set(p.id, 0)
    })
    
    // Go through all revealed whiskies and calculate points
    whiskies
      .filter(w => w.revealed && w.pointsBreakdown)
      .forEach(whisky => {
        whisky.pointsBreakdown?.forEach(breakdown => {
          if (breakdown.matchedParticipants && breakdown.matchedParticipants.length > 0) {
            // Points are distributed equally among matched participants
            const pointsPerParticipant = breakdown.points / breakdown.matchedParticipants.length
            
            breakdown.matchedParticipants.forEach(participantName => {
              // Find participant by name
              const participant = participants.find(p => p.name === participantName)
              if (participant) {
                const currentScore = scores.get(participant.id) || 0
                scores.set(participant.id, currentScore + pointsPerParticipant)
              }
            })
          }
        })
      })
    
    return scores
  }
  
  const participantScores = calculateParticipantScores()
  
  // Determine whether any participant has points yet
  const hasAnyPoints = Array.from(participantScores.values()).some(v => (v || 0) > 0)
  
  // Sort participants by score (highest first), then by name
  const sortedParticipants = [...participants].sort((a, b) => {
    const scoreA = participantScores.get(a.id) || 0
    const scoreB = participantScores.get(b.id) || 0
    if (scoreB !== scoreA) {
      return scoreB - scoreA
    }
    return a.name.localeCompare(b.name)
  })
  
  const getRankIcon = (index: number) => {
    if (!hasAnyPoints) return null
    switch (index) {
      case 0:
        return <Trophy className="text-yellow-500" size={16} />
      case 1:
        return <Medal className="text-gray-400" size={16} />
      case 2:
        return <Medal className="text-amber-600" size={16} />
      default:
        return null
    }
  }
  
  const getRankBadge = (index: number) => {
    if (!hasAnyPoints) return null
    if (index >= 3) return null
    return (
      <div className={`absolute -top-1 -left-1 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md ${
        index === 0 ? 'bg-yellow-500 text-white' :
        index === 1 ? 'bg-gray-400 text-white' :
        'bg-amber-600 text-white'
      }`}>
        {index === 0 ? '👑' : index + 1}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-whisky-dark mb-4">Deelnemers</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
        {sortedParticipants.map((participant, index) => {
          const score = Math.round((participantScores.get(participant.id) || 0) * 10) / 10
          const rankIcon = getRankIcon(index)
          const rankBadge = getRankBadge(index)
          
          return (
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
                  : index < 3 && hasAnyPoints && score > 0
                  ? index === 0 
                    ? 'border-yellow-400 bg-yellow-50/50'
                    : index === 1
                    ? 'border-gray-300 bg-gray-50/50'
                    : 'border-amber-500 bg-amber-50/50'
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
                  {rankBadge}
                  {participant.avatar ? (
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className={`w-20 h-20 rounded-full object-cover mb-2 border-2 ${
                        participant.id === creatorId 
                          ? 'border-amber-400' 
                          : hasAnyPoints && index === 0 && score > 0
                          ? 'border-yellow-400'
                          : index === 1 && score > 0
                          ? 'border-gray-400'
                          : index === 2 && score > 0
                          ? 'border-amber-600'
                          : 'border-whisky-light'
                      } ${index === 0 && score > 0 ? 'ring-2 ring-yellow-200' : ''}`}
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-full bg-whisky-light flex items-center justify-center mb-2 border-2 ${
                      participant.id === creatorId 
                        ? 'border-amber-400' 
                        : hasAnyPoints && index === 0 && score > 0
                        ? 'border-yellow-400 bg-gradient-to-br from-yellow-200 to-yellow-400'
                        : hasAnyPoints && index === 1 && score > 0
                        ? 'border-gray-400 bg-gradient-to-br from-gray-100 to-gray-200'
                        : hasAnyPoints && index === 2 && score > 0
                        ? 'border-amber-600 bg-gradient-to-br from-amber-200 to-amber-400'
                        : 'border-whisky-light'
                    } ${index === 0 && score > 0 ? 'ring-2 ring-yellow-200' : ''}`}>
                      <span className={`text-3xl font-bold ${
                        hasAnyPoints && index === 0 && score > 0 ? 'text-yellow-900' :
                        hasAnyPoints && index === 1 && score > 0 ? 'text-gray-700' :
                        hasAnyPoints && index === 2 && score > 0 ? 'text-amber-900' :
                        'text-whisky-dark'
                      }`}>
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {participant.id === creatorId && (
                    <div className="absolute -bottom-1 -right-1 bg-amber-400 rounded-full p-1 border-2 border-white">
                      <Crown size={14} className="text-amber-900" fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1 w-full">
                  <div className="flex items-center gap-1">
                    {hasAnyPoints && rankIcon && (
                      <span className="flex-shrink-0">{rankIcon}</span>
                    )}
                    <span className="text-sm font-medium text-center truncate">
                      {participant.name}
                    </span>
                    {participant.id === creatorId && (
                      <span className="text-xs text-amber-600 font-semibold">(Maker)</span>
                    )}
                  </div>
                  {hasAnyPoints && score > 0 && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-whisky-light text-whisky-dark'
                    }`}>
                      <Trophy size={12} className={index < 3 ? '' : 'text-whisky-dark'} />
                      <span>{score} ptn</span>
                    </div>
                  )}
                </div>
                {participant.currentEmote && (
                  <motion.div
                    initial={{ scale: 0, y: 0 }}
                    animate={{ scale: [0, 1.2, 1], y: -10 }}
                    className="absolute -top-2 -right-2 text-2xl z-20"
                  >
                    {EMOTES.find(e => e.id === participant.currentEmote)?.label || '🎉'}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
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

